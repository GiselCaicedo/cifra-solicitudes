// src/app/api/solicitudes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/requireAuth'
import { notifyEmailChange } from '@/lib/emailService'

const UpdateSchema = z.object({
  estado: z.enum(['abierta', 'en_proceso', 'cerrada']).optional(),
  respuesta: z.string().max(2000, 'Respuesta muy larga').optional(),
  soporteId: z.number().int().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Solo soporte y admin pueden actualizar solicitudes
  const authResult = requireRole(req, ['soporte', 'admin'])
  if (authResult instanceof NextResponse) return authResult
  const { user } = authResult

  try {
    // Await params before accessing its properties
    const { id: paramId } = await params
    const id = Number(paramId)
    if (isNaN(id)) {
      return NextResponse.json(
        { ok: false, error: 'ID de solicitud inválido' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const data = UpdateSchema.parse(body)

    // Solo admin puede asignar manualmente un soporte específico
    if (data.soporteId && user.rol !== 'admin') {
      return NextResponse.json(
        { ok: false, error: 'Solo el administrador puede asignar solicitudes a agentes de soporte' },
        { status: 403 }
      )
    }

    // Verificar que la solicitud existe y obtener valores actuales
    const solicitudActual = await prisma.solicitud.findUnique({
      where: { id },
      include: {
        cliente: { select: { nombre: true, email: true } },
        soporte: { select: { nombre: true, email: true } }
      }
    })

    if (!solicitudActual) {
      return NextResponse.json(
        { ok: false, error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    // Si es soporte, solo puede actualizar solicitudes asignadas a él o sin asignar
    if (user.rol === 'soporte') {
      if (solicitudActual.soporteId && solicitudActual.soporteId !== user.id) {
        return NextResponse.json(
          { ok: false, error: 'No puedes modificar una solicitud asignada a otro agente' },
          { status: 403 }
        )
      }
      
      // Si es soporte y está respondiendo/actualizando una solicitud sin asignar, se asigna automáticamente
      if (!solicitudActual.soporteId && (data.respuesta || data.estado)) {
        data.soporteId = user.id
      }
    }

    // Actualizar la solicitud
    const updated = await prisma.solicitud.update({
      where: { id },
      data,
      include: {
        cliente: { select: { nombre: true, email: true } },
        soporte: { select: { nombre: true, email: true } }
      }
    })

    // Crear registros de historial para cada cambio
    const historialPromises = []

    if (data.estado && data.estado !== solicitudActual.estado) {
      historialPromises.push(
        prisma.historialCambio.create({
          data: {
            solicitudId: id,
            campo: 'estado',
            valorAnterior: solicitudActual.estado,
            valorNuevo: data.estado,
            autorId: user.id
          }
        })
      )
    }

    if (data.respuesta && data.respuesta !== solicitudActual.respuesta) {
      historialPromises.push(
        prisma.historialCambio.create({
          data: {
            solicitudId: id,
            campo: 'respuesta',
            valorAnterior: solicitudActual.respuesta,
            valorNuevo: data.respuesta,
            autorId: user.id
          }
        })
      )
    }

    if (data.soporteId && data.soporteId !== solicitudActual.soporteId) {
      const soporteAnterior = solicitudActual.soporteId ? 
        await prisma.usuario.findUnique({ where: { id: solicitudActual.soporteId }, select: { nombre: true } }) : null
      const soporteNuevo = await prisma.usuario.findUnique({ where: { id: data.soporteId }, select: { nombre: true } })
      
      historialPromises.push(
        prisma.historialCambio.create({
          data: {
            solicitudId: id,
            campo: 'soporte_asignado',
            valorAnterior: soporteAnterior?.nombre || 'Sin asignar',
            valorNuevo: soporteNuevo?.nombre || 'Sin asignar',
            autorId: user.id
          }
        })
      )
    }

    // Ejecutar todas las inserciones de historial
    if (historialPromises.length > 0) {
      await Promise.all(historialPromises)
    }

    // 📧 ENVIAR NOTIFICACIONES POR EMAIL 📧
    try {
      // Verificar si hay cambios que ameriten notificación
      const hayaCambiosSignificativos = data.estado || data.respuesta || data.soporteId

      if (hayaCambiosSignificativos) {
        // Determinar el tipo de notificación según el estado
        if (data.estado === 'cerrada') {
          // Solicitud cerrada - notificación especial
          await notifyEmailChange('closed', {
            clienteEmail: updated.cliente.email,
            clienteNombre: updated.cliente.nombre,
            solicitudTitulo: updated.titulo,
            solicitudId: updated.id,
            soporteNombre: updated.soporte?.nombre,
            respuesta: data.respuesta
          })
          console.log('📧 Email de solicitud cerrada enviado al cliente')
        } else {
          // Actualización general (estado, respuesta o asignación)
          await notifyEmailChange('updated', {
            clienteEmail: updated.cliente.email,
            clienteNombre: updated.cliente.nombre,
            solicitudTitulo: updated.titulo,
            solicitudId: updated.id,
            soporteNombre: updated.soporte?.nombre,
            nuevoEstado: data.estado,
            respuesta: data.respuesta
          })
          console.log('📧 Email de actualización enviado al cliente')
        }
      }
    } catch (emailError) {
      console.error('📧 Error enviando notificación por email:', emailError)
      // No fallar la operación principal por error de email
      // El sistema continuará funcionando aunque falle el email
    }

    return NextResponse.json({ ok: true, data: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error al actualizar solicitud:', error)
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = requireRole(req, ['cliente', 'soporte', 'admin'])
  if (authResult instanceof NextResponse) return authResult
  const { user } = authResult

  try {
    // Await params before accessing its properties
    const { id: paramId } = await params
    const id = Number(paramId)
    if (isNaN(id)) {
      return NextResponse.json(
        { ok: false, error: 'ID de solicitud inválido' },
        { status: 400 }
      )
    }

    const solicitud = await prisma.solicitud.findUnique({
      where: { id },
      include: {
        cliente: { select: { nombre: true, email: true } },
        soporte: { select: { nombre: true, email: true } },
        historial: {
          include: {
            autor: { select: { nombre: true, email: true } }
          },
          orderBy: { fecha: 'desc' }
        }
      }
    })

    if (!solicitud) {
      return NextResponse.json(
        { ok: false, error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos de acceso
    if (user.rol === 'cliente' && solicitud.clienteId !== user.id) {
      return NextResponse.json(
        { ok: false, error: 'No tienes permiso para ver esta solicitud' },
        { status: 403 }
      )
    }

    if (user.rol === 'soporte' && solicitud.soporteId && solicitud.soporteId !== user.id) {
      return NextResponse.json(
        { ok: false, error: 'No tienes permiso para ver esta solicitud' },
        { status: 403 }
      )
    }

    return NextResponse.json({ ok: true, data: solicitud })
  } catch (error: any) {
    console.error('Error al obtener solicitud:', error)
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}