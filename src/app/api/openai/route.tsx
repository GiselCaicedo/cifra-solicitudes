import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type ConversationMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const {
      rol,
      clienteNombre,
      clienteEmail,
      titulo,
      descripcion,
      estado,
      preferirNeutro = true,
      conversation = [],
    }: {
      rol: 'admin' | 'soporte' | 'cliente' | string
      clienteNombre?: string
      clienteEmail?: string
      titulo: string
      descripcion: string
      estado: 'abierta' | 'en_proceso' | 'cerrada'
      preferirNeutro?: boolean
      conversation?: ConversationMessage[]
    } = await req.json()

    if (!process.env.OPENAI_API_KEY) {
      console.error('Falta OPENAI_API_KEY en el entorno')
      return NextResponse.json({ error: 'Configuración del servidor incompleta' }, { status: 500 })
    }

    // Persona según rol
    const persona =
      rol === 'cliente'
        ? `
Eres el/la **cliente** que responde al equipo de soporte de CIFRA.
Objetivo: redactar un mensaje breve (5–10 líneas), claro y concreto, desde la perspectiva del cliente.
- Mantén español neutro (LatAm), tono cordial y profesional.
- No pidas información que ya esté en el hilo. Confirma o aporta datos si hace falta.
- Si el soporte ya pidió algo y el contexto lo contiene, no lo vuelvas a solicitar; simplemente confirma.
- Evita tecnicismos innecesarios; habla como usuario final.
- No inventes nombres del equipo; firma de forma simple (solo nombre del cliente si corresponde).
`.trim()
        : `
Eres un **agente de atención al cliente** de una empresa CIFRA.
Objetivo: redactar un email breve (5–10 líneas), claro, amable y accionable.
- Si "rol" = "admin": coordina siguientes pasos y plazos a alto nivel.
- Si "rol" = "soporte": enfócate en diagnóstico, pasos técnicos y datos a recopilar.
- Personaliza el saludo usando el nombre del remitente.
- Tratamiento y género:
  • Solo si hay alta confianza (>=90%) usa "Sr.", "Sra.", etc.
  • Si NO hay alta confianza ${preferirNeutro ? 'o preferirNeutro = true' : ''}, usa lenguaje neutro/formal:
    - Evita adjetivos/participios generizados; usa formulaciones impersonales.
    - Prefiere "Hola, <Nombre>" y tratamiento de "usted".
- Mantén español neutro (LatAm), tono profesional y empático.
- Si falta información clave, solicita 1–2 datos puntuales máximo.
- No repitas textualmente mensajes previos; resume si es necesario.
`.trim()

    const marcoContexto = `
Contexto previo (historial entre cliente y soporte). Debes usarlo para mantener coherencia,
no repetir preguntas/datos y continuar el hilo con naturalidad. Si ya existe una respuesta a una
pregunta, no la vuelvas a pedir. Si ya hay confirmación de datos (p.ej., nombre de sede, correos,
fechas), no vuelvas a pedir confirmación.
`.trim()

    // Prompt con datos del ticket
    const datosTicket = `
Datos del ticket:
- Rol que redacta AHORA: ${rol}
- Remitente (cliente): ${clienteNombre || '—'}
- Email del remitente: ${clienteEmail || '—'}
- Título: ${titulo}
- Estado actual: ${estado}
- Descripción inicial del ticket: ${descripcion}

Instrucciones:
- Redacta SOLO el cuerpo del mensaje listo para enviar (sin comillas, sin "Asunto:").
- Mantén 5–10 líneas máximo.
- Personaliza el saludo con el nombre (${clienteNombre || '—'}).
`.trim()

    // Normaliza conversación
    const convoSafe: ConversationMessage[] = Array.isArray(conversation)
      ? conversation
          .filter(
            (m): m is ConversationMessage =>
              !!m &&
              (m.role === 'user' || m.role === 'assistant') &&
              typeof m.content === 'string' &&
              m.content.trim().length > 0
          )
          .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
          .slice(-30)
      : []

    // Construcción de mensajes para el modelo
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: persona },
      { role: 'system', content: marcoContexto },
      ...convoSafe,
      { role: 'user', content: datosTicket },
      // Task final explícita según rol
      {
        role: 'user',
        content:
          rol === 'cliente'
            ? 'Redacta el PRÓXIMO mensaje como si fueras el cliente, continuando el hilo en base al contexto.'
            : 'Redacta el PRÓXIMO mensaje como si fueras soporte/admin, continuando el hilo en base al contexto.',
      },
    ]

    // Llamada a OpenAI
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 30000)

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 400,
        messages,
      }),
    }).finally(() => clearTimeout(t))

    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      console.error('OpenAI error:', msg || `status=${res.status}`)
      return NextResponse.json({ error: 'Error generando sugerencia' }, { status: 500 })
    }

    const data = await res.json()
    const sugerencia: string = data?.choices?.[0]?.message?.content?.trim() || 'No se pudo generar una sugerencia.'
    return NextResponse.json({ sugerencia })
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError'
    console.error(isAbort ? 'Timeout OpenAI' : 'Error en /api/openai:', err)
    return NextResponse.json(
      { error: isAbort ? 'Tiempo de espera agotado generando sugerencia' : 'Error generando sugerencia' },
      { status: 500 }
    )
  }
}
