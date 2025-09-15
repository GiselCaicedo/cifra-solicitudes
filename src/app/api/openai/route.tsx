import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const {
      rol,
      // cliente = (remitente)
      clienteNombre,
      clienteEmail,
      // campos del ticket
      titulo,
      descripcion,
      estado,
      // opcional: si se quiere forzar neutro siempre
      preferirNeutro = true
    } = await req.json()

    const system = `
Eres un agente de atención al cliente de una empresa SaaS.
Objetivo: redactar un email breve (5–10 líneas), claro, amable y accionable.

- Si "rol" = "admin": puedes coordinar, decidir siguientes pasos y plazos a alto nivel.
- Si "rol" = "soporte": enfócate en diagnóstico, pasos técnicos y datos a recopilar.
- Personaliza el saludo usando el nombre del remitente.
- Tratamiento y género:
  • Primero, intenta determinar el tratamiento (p. ej., "Sr.", "Sra.", "Mx.") y formas gramaticales
    SOLO si hay alta confianza por el nombre y el contexto (>=90%).
  • Si NO hay alta confianza ${preferirNeutro ? 'o preferirNeutro = true' : ''}, usa lenguaje neutro/formal:
      - Evita adjetivos o participios generizados (usa infinitivos o formulaciones impersonales).
      - Prefiere "Hola, <Nombre>" y tratamiento de "usted".
      - Si corresponde, puedes preguntar con tacto por pronombres o forma de tratamiento preferida.
- Mantén español neutro (LatAm), tono profesional y empático.
- Si falta información clave, solicita 1–2 datos puntuales.
- Luego el cuerpo del correo listo para enviar.
`

    const user = `
Datos del ticket:
- Rol que responde: ${rol}
- Remitente (cliente): ${clienteNombre || '—'}
- Email del remitente: ${clienteEmail || '—'}
- Título: ${titulo}
- Estado actual: ${estado}
- Descripción/contexto: ${descripcion}

Instrucciones de personalización:
- Menciona al remitente por su nombre en el saludo.
- Si el nombre sugiere un tratamiento con alta confianza, úsalo; en caso contrario, usa neutro.
- Cierra con una despedida profesional y tu firma genérica de soporte (no inventes nombres reales).
`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    })

    if (!res.ok) {
      const msg = await res.text()
      console.error('OpenAI error:', msg)
      return NextResponse.json({ error: 'Error generando sugerencia' }, { status: 500 })
    }

    const data = await res.json()
    const sugerencia = data?.choices?.[0]?.message?.content?.trim()
      || 'No se pudo generar una sugerencia.'
    return NextResponse.json({ sugerencia })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error generando sugerencia' }, { status: 500 })
  }
}
