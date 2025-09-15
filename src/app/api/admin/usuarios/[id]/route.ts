import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/requireAuth'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(params.id) },
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
      }
    })

    if (!usuario) {
      return NextResponse.json(
        { ok: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true, data: usuario })
  } catch (error: any) {
    console.error('Error al obtener usuario:', error)
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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
    const { nombre, email, password, rolId } = await req.json()
    const userId = parseInt(params.id)

    // Verificar que el usuario existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { ok: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el email no esté en uso por otro usuario
    if (email !== existingUser.email) {
      const emailExists = await prisma.usuario.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json(
          { ok: false, error: 'Ya existe un usuario con este email' },
          { status: 400 }
        )
      }
    }

    // Preparar datos de actualización
    const updateData: any = {
      nombre,
      email,
      rolId
    }

    // Solo actualizar contraseña si se proporcionó una nueva
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Actualizar usuario
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        rolId: true
      }
    })

    return NextResponse.json({ ok: true, data: usuarioActualizado })
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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
    const userId = parseInt(params.id)

    // Verificar que el usuario existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { ok: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Evitar que el admin se elimine a sí mismo
    if (userId === authUser.id) {
      return NextResponse.json(
        { ok: false, error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    // Eliminar usuario
    await prisma.usuario.delete({
      where: { id: userId }
    })

    return NextResponse.json({ ok: true, message: 'Usuario eliminado correctamente' })
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error)
    
    // Si hay referencias de clave foránea, informar al usuario
    if (error.code === 'P2003') {
      return NextResponse.json(
        { ok: false, error: 'No se puede eliminar el usuario porque tiene registros asociados' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}