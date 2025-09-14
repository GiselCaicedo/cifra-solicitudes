import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
  const roles = ['cliente','soporte','admin']
  await Promise.all(roles.map(nombre => prisma.rol.upsert({
    where: { nombre }, update: {}, create: { nombre }
  })))

  const hash = await bcrypt.hash('changeme', 10)
  const adminRol = await prisma.rol.findUnique({ where: { nombre: 'admin' } })
  if (adminRol) {
    await prisma.usuario.upsert({
      where: { email: 'admin@cifra.test' },
      update: {},
      create: { email:'admin@cifra.test', password:hash, nombre:'Admin', rolId: adminRol.id }
    })
  }
}
main().finally(()=>prisma.$disconnect())
