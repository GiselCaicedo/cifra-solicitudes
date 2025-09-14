import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/requireAuth'

const CreateSchema = z.object({
  titulo: z.string().min(1),
  descripcion: z.string().min(1)
})

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  // TODO: filtrar según rol (cliente ve solo suyas; soporte/admin ven todas)
  const list = await prisma.solicitud.findMany({ orderBy: { id: 'desc' } })
  return NextResponse.json({ ok: true, data: list })
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { titulo, descripcion } = CreateSchema.parse(body)

  // Por ahora, asumimos que el usuario actual es el cliente
  const created = await prisma.solicitud.create({
    data: { titulo, descripcion, estado: 'abierta', clienteId: user.id }
  })

  return NextResponse.json({ ok: true, data: created }, { status: 201 })
}
