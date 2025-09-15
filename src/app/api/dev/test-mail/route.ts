import { NextResponse } from 'next/server'
import { sendMail } from '@/lib/mailer'

export async function POST() {
  try {
    await sendMail({
      to: 'giselcaicedosoler@gmail.com',
      subject: 'Prueba CIFRA',
      text: 'Hola! Este es un correo de prueba.'
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Error enviando mail' }, { status: 500 })
  }
}
