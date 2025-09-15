// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/requireAuth'

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req)
  if (authResult instanceof NextResponse) return authResult
  const { user: authUser } = authResult

  try {
    const user = await prisma.usuario.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: {
          select: {
            nombre: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true, data: user })
  } catch (error: any) {
    console.error('Error al obtener usuario:', error)
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}