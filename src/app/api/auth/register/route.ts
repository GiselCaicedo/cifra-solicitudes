// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { signJwt } from '@/lib/auth'

const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Nombre muy largo'),
  rol: z.enum(['cliente', 'soporte'], {
    errorMap: () => ({ message: 'El rol debe ser "cliente" o "soporte"' })
  }).optional().default('cliente')
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, nombre, rol } = RegisterSchema.parse(body)

    // Verificar si el email ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: 'El email ya está registrado' },
        { status: 409 }
      )
    }

    // Buscar el rol en la base de datos
    const rolRecord = await prisma.rol.findUnique({
      where: { nombre: rol }
    })

    if (!rolRecord) {
      return NextResponse.json(
        { ok: false, error: 'Rol no válido' },
        { status: 400 }
      )
    }

    // Crear el usuario
    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.usuario.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        rolId: rolRecord.id
      },
      include: {
        rol: true
      }
    })

    // Generar token JWT
    const token = signJwt({ id: user.id, rol: user.rol.nombre })

    // Devolver datos del usuario (sin password)
    const { password: _, ...userData } = user

    return NextResponse.json({
      ok: true,
      data: {
        user: userData,
        token
      }
    }, { status: 201 })

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error en registro:', error)
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}