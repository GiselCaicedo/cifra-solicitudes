import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { signJwt } from '@/lib/auth'
import { LoginSchema } from '@/lib/validators'
import { ok, fail, bad, unauthorized } from '@/lib/http'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = LoginSchema.parse(body)

    const user = await prisma.usuario.findUnique({ where: { email }, include: { rol: true } })
    if (!user) return unauthorized('Credenciales inválidas')

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return unauthorized('Credenciales inválidas')

    const token = signJwt({ id: user.id, rol: user.rol.nombre })
    return ok({ token })
  } catch (e) {
    if (e instanceof Error && e.name === 'ZodError') return bad('Datos inválidos')
    return fail(e)
  }
}
