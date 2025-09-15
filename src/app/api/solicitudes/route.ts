// src/app/api/solicitudes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/requireAuth'
import { notifyEmailChange, notifySupportTeam } from '@/lib/emailService'

const CreateSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido').max(200, 'Título muy largo'),
  descripcion: z.string().min(1, 'La descripción es requerida').max(1000, 'Descripción muy larga')
})

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req)
  if (authResult instanceof NextResponse) return authResult
  const { user } = authResult

  try {
    let solicitudes

    switch (user.rol) {
      case 'cliente':
        solicitudes = await prisma.solicitud.findMany({
          where: { clienteId: user.id },
          include: {
            cliente: { select: { nombre: true, email: true } },
            soporte: { select: { nombre: true, email: true } }
          },
          orderBy: { creadoEn: 'desc' }
        })
        break

      case 'soporte':
        solicitudes = await prisma.solicitud.findMany({
          where: {
            OR: [
              { soporteId: user.id },
              { soporteId: null }
            ]
          },
          include: {
            cliente: { select: { nombre: true, email: true } },
            soporte: { select: { nombre: true, email: true } }
          },
          orderBy: { creadoEn: 'desc' }
        })
        break

      case 'admin':
        solicitudes = await prisma.solicitud.findMany({
          include: {
            cliente: { select: { nombre: true, email: true } },
            soporte: { select: { nombre: true, email: true } }
          },
          orderBy: { creadoEn: 'desc' }
        })
        break

      default:
        return NextResponse.json(
          { ok: false, error: 'Rol no válido' },
          { status: 403 }
        )
    }

    return NextResponse.json({ ok: true, data: solicitudes })
  } catch (error: any) {
    console.error('Error al obtener solicitudes:', error)
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  // Solo clientes pueden crear solicitudes
  const authResult = requireRole(req, ['cliente'])
  if (authResult instanceof NextResponse) return authResult
  const { user } = authResult

  try {
    const body = await req.json()
    const { titulo, descripcion } = CreateSchema.parse(body)

    const created = await prisma.solicitud.create({
      data: {
        titulo,
        descripcion,
        estado: 'abierta',
        clienteId: user.id
      },
      include: {
        cliente: { select: { nombre: true, email: true } }
      }
    })

    // Crear registro en el historial
    await prisma.historialCambio.create({
      data: {
        solicitudId: created.id,
        campo: 'creacion',
        valorAnterior: null,
        valorNuevo: 'Solicitud creada',
        autorId: user.id
      }
    })

    // 📧 Enviar notificaciones por email
    try {
      // Notificar al cliente
      await notifyEmailChange('created', {
        clienteEmail: created.cliente.email,
        clienteNombre: created.cliente.nombre,
        solicitudTitulo: created.titulo,
        solicitudId: created.id
      })
      console.log('📧 Email de confirmación enviado al cliente')

      // Notificar al equipo de soporte
      await notifySupportTeam(created.id, created.cliente.nombre, created.titulo)
      console.log('📧 Notificación enviada al equipo de soporte')
      
    } catch (emailError) {
      console.log('📧 Error enviando notificaciones por email:', emailError)
      // No fallar la operación principal por error de email
    }

    return NextResponse.json({ ok: true, data: created }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error al crear solicitud:', error)
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}