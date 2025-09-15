import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/requireAuth'

type Accion = 'creada' | 'asignada' | 'respuesta' | 'cambio_estado'

/** Mapea el modelo Prisma -> shape del modal */
function mapHistorialItem(h: {
  id: number
  campo: string
  valorAnterior: string | null
  valorNuevo: string | null
  fecha: Date
  autor: { nombre: string; email: string; rol?: { nombre: string } | null }
}) {
  let accion: Accion = 'respuesta'
  let descripcion = ''
  const detalles: {
    estadoAnterior?: string
    estadoNuevo?: string
    respuesta?: string
    soporteAsignado?: string
  } = {}

  switch (h.campo) {
    case 'estado':
      accion = 'cambio_estado'
      descripcion = `Estado cambiado de ${h.valorAnterior ?? '—'} a ${h.valorNuevo ?? '—'}`
      detalles.estadoAnterior = h.valorAnterior ?? undefined
      detalles.estadoNuevo = h.valorNuevo ?? undefined
      break
    case 'respuesta':
      accion = 'respuesta'
      descripcion = 'Se registró/actualizó una respuesta'
      detalles.respuesta = h.valorNuevo ?? undefined
      break
    case 'soporte_asignado':
      accion = 'asignada'
      descripcion = `Solicitud asignada a ${h.valorNuevo ?? 'Sin asignar'}`
      detalles.soporteAsignado = h.valorNuevo ?? undefined
      break
    case 'creada':
      accion = 'creada'
      descripcion = 'Solicitud creada'
      break
    default:
      descripcion = `Cambio en ${h.campo}`
  }

  return {
    id: h.id,
    accion,
    descripcion,
    creadoEn: h.fecha.toISOString(),
    usuario: {
      nombre: h.autor.nombre,
      email: h.autor.email,
      rol: h.autor.rol?.nombre,
    },
    detalles,
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = requireRole(req, ['cliente', 'soporte', 'admin'])
  if (authResult instanceof NextResponse) return authResult
  const { user } = authResult

  try {
    const { id: paramId } = await params
    const id = Number(paramId)
    if (isNaN(id)) {
      return NextResponse.json({ ok: false, error: 'ID de solicitud inválido' }, { status: 400 })
    }

    const solicitud = await prisma.solicitud.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nombre: true, email: true } },
        soporte: { select: { id: true, nombre: true, email: true } },
        historial: {
          include: {
            autor: {
              select: {
                nombre: true,
                email: true,
                rol: { select: { nombre: true } },
              },
            },
          },
          orderBy: { fecha: 'desc' },
        },
      },
    })

    if (!solicitud) {
      return NextResponse.json({ ok: false, error: 'Solicitud no encontrada' }, { status: 404 })
    }

    // Permisos:
    // - Cliente: solo su propia solicitud
    if (user.rol === 'cliente' && solicitud.cliente.id !== user.id) {
      return NextResponse.json({ ok: false, error: 'No tienes permiso para ver esta solicitud' }, { status: 403 })
    }
    // - Soporte: si está asignada a otro, no puede verla. Si no tiene soporte asignado, puede verla.
    if (user.rol === 'soporte' && solicitud.soporte?.id && solicitud.soporte.id !== user.id) {
      return NextResponse.json({ ok: false, error: 'No tienes permiso para ver esta solicitud' }, { status: 403 })
    }

    // Mapear historial a lo que espera el modal
    const historialUI = solicitud.historial.map(mapHistorialItem)

    // (Opcional pero útil) Agregar un evento inicial "creada" al final si no existe
    const yaTieneCreada = historialUI.some(h => h.accion === 'creada')
    if (!yaTieneCreada) {
      historialUI.push({
        id: 0, // id sintético solo para UI
        accion: 'creada',
        descripcion: 'Solicitud creada por el cliente',
        creadoEn: solicitud.creadoEn.toISOString(),
        usuario: {
          nombre: solicitud.cliente.nombre,
          email: solicitud.cliente.email,
          rol: 'cliente',
        },
      })
    }

    // Devolvemos solo el arreglo (tu front hace setHistorialData(res.data))
    return NextResponse.json({ ok: true, data: historialUI })
  } catch (error) {
    console.error('Error al obtener historial:', error)
    return NextResponse.json({ ok: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
