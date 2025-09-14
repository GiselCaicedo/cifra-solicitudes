import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const [abiertas, enProceso, cerradas] = await Promise.all([
    prisma.solicitud.count({ where: { estado: 'abierta' } }),
    prisma.solicitud.count({ where: { estado: 'en_proceso' } }),
    prisma.solicitud.count({ where: { estado: 'cerrada' } }),
  ])
  return NextResponse.json({
    ok: true,
    data: { abiertas, enProceso, cerradas }
  })
}
