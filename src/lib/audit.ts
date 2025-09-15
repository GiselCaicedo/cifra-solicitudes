import { prisma } from '@/lib/db'

type Author = { id: number }

export async function logChange(
  solicitudId: number,
  campo: string,
  valorAnterior: string | null,
  valorNuevo: string | null,
  autor: Author
) {
  await prisma.historialCambio.create({
    data: {
      solicitudId,
      campo,
      valorAnterior: valorAnterior ?? undefined,
      valorNuevo: valorNuevo ?? undefined,
      autorId: autor.id,
    }
  })
}
