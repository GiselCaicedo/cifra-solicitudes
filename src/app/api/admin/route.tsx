import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/requireAuth'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req)
  if (authResult instanceof NextResponse) return authResult
  const { user: authUser } = authResult


  console.log(authUser)

  // Verificar que sea admin
  if (authUser.rol !== 'admin') {
    return NextResponse.json(
      { ok: false, error: 'Acceso denegado' },
      { status: 403 }
    )
  }

  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json({ ok: true, data: usuarios })
  } catch (error: any) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const authResult = requireAuth(req)
  if (authResult instanceof NextResponse) return authResult
  const { user: authUser } = authResult

  // Verificar que sea admin
  if (authUser.rol !== 'admin') {
    return NextResponse.json(
      { ok: false, error: 'Acceso denegado' },
      { status: 403 }
    )
  }

  try {
    const { nombre, email, password, rolId } = await req.json()

    // Validaciones básicas
    if (!nombre || !email || !password || !rolId) {
      return NextResponse.json(
        { ok: false, error: 'Todos los campos son obligatorios' },
        { status: 400 }
      )
    }

    // Verificar que el email no exista
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: 'Ya existe un usuario con este email' },
        { status: 400 }
      )
    }

    // Verificar que el rol existe
    const rol = await prisma.rol.findUnique({
      where: { id: rolId }
    })

    if (!rol) {
      return NextResponse.json(
        { ok: false, error: 'Rol no válido' },
        { status: 400 }
      )
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rolId
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rolId: true
      }
    })

    return NextResponse.json({ ok: true, data: nuevoUsuario })
  } catch (error: any) {
    console.error('Error al crear usuario:', error)
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


