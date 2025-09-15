import { sendMail } from './mailer'
import { prisma } from './db'

export async function notifySolicitudCreada(solicitudId: number) {
  const s = await prisma.solicitud.findUnique({
    where: { id: solicitudId },
    include: { cliente: true }
  })
  if (!s) return
  await sendMail({
    to: s.cliente.email,
    subject: `Solicitud #${s.id} creada`,
    text: `Tu solicitud "${s.titulo}" fue creada con estado ${s.estado}.`
  })
}

export async function notifySolicitudActualizada(solicitudId: number) {
  const s = await prisma.solicitud.findUnique({
    where: { id: solicitudId },
    include: { cliente: true, soporte: true }
  })
  if (!s) return
  const destinatarios = [s.cliente.email, s.soporte?.email].filter(Boolean) as string[]
  if (destinatarios.length === 0) return
  await sendMail({
    to: destinatarios.join(','),
    subject: `Solicitud #${s.id} actualizada`,
    text: `La solicitud "${s.titulo}" ahora está en estado ${s.estado}. Respuesta: ${s.respuesta ?? '—'}`
  })
}
