import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/requireAuth'

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req)
  if (authResult instanceof NextResponse) return authResult
  const { user: authUser } = authResult

  if (authUser.rol !== 'admin') {
    return NextResponse.json(
      { ok: false, error: 'Acceso denegado' },
      { status: 403 }
    )
  }

  try {
    const roles = await prisma.rol.findMany({
      select: {
        id: true,
        nombre: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json({ ok: true, data: roles })
  } catch (error: any) {
    console.error('Error al obtener roles:', error)
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}