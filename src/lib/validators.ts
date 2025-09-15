import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export const CreateSolicitudSchema = z.object({
  titulo: z.string().min(1),
  descripcion: z.string().min(1)
})

export const UpdateSolicitudSchema = z.object({
  estado: z.enum(['abierta','en_proceso','cerrada']).optional(),
  respuesta: z.string().optional(),
  soporteId: z.number().int().optional(),
})
