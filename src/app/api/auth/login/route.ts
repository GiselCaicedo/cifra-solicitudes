 
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { signJwt } from '@/lib/auth'

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = BodySchema.parse(body)

    const user = await prisma.usuario.findUnique({
      where: { email },
      include: { rol: true }
    })
    if (!user) return NextResponse.json({ ok: false, error: 'Credenciales inválidas' }, { status: 401 })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return NextResponse.json({ ok: false, error: 'Credenciales inválidas' }, { status: 401 })

    const token = signJwt({ id: user.id, rol: user.rol.nombre })
    return NextResponse.json({ ok: true, data: { token } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Error' }, { status: 400 })
  }
}
