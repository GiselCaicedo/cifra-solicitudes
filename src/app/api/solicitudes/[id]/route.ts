import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/requireAuth'

const UpdateSchema = z.object({
  estado: z.enum(['abierta','en_proceso','cerrada']).optional(),
  respuesta: z.string().optional(),
  soporteId: z.number().int().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })

  const id = Number(params.id)
  const body = await req.json()
  const data = UpdateSchema.parse(body)

  const updated = await prisma.solicitud.update({
    where: { id },
    data
  })
  return NextResponse.json({ ok: true, data: updated })
}
