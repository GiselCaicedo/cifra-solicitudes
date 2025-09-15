import nodemailer from 'nodemailer'

interface EmailNotificationData {
  clienteEmail: string
  clienteNombre: string
  solicitudTitulo: string
  solicitudId: number
  soporteNombre?: string
  nuevoEstado?: string
  respuesta?: string
}

const createTransport = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, 
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    },
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  })
}

const createTransportAlternative = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    // Configuración de timeouts
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000
  })
}

const emailTemplates = {
  created: (data: EmailNotificationData) => ({
    subject: `Nueva solicitud creada: ${data.solicitudTitulo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Sistema de Soporte</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f8f9fa;">
          <h2 style="color: #333;">¡Hola ${data.clienteNombre}!</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px 0;">
            <p style="color: #666; margin: 0 0 15px 0;">Tu solicitud ha sido creada exitosamente:</p>
            
            <div style="border-left: 4px solid #28a745; padding-left: 15px; margin: 15px 0;">
              <h3 style="color: #333; margin: 0 0 5px 0;">${data.solicitudTitulo}</h3>
              <p style="color: #666; margin: 0;"><strong>ID:</strong> #${data.solicitudId}</p>
              <p style="color: #666; margin: 5px 0 0 0;"><strong>Estado:</strong> <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">ABIERTA</span></p>
            </div>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
            <p style="margin: 0; color: #1976d2;">
              <strong>¿Qué sigue?</strong><br>
              Nuestro equipo de soporte revisará tu solicitud y te contactaremos pronto. 
              Recibirás actualizaciones por email cuando haya cambios en tu solicitud.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666;">¿Tienes preguntas? Responde a este email o contáctanos.</p>
            <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} Sistema de Soporte</p>
          </div>
        </div>
      </div>
    `
  }),

  updated: (data: EmailNotificationData) => ({
    subject: `🔄 Actualización en tu solicitud: ${data.solicitudTitulo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Sistema de Soporte</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f8f9fa;">
          <h2 style="color: #333;">¡Hola ${data.clienteNombre}!</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px 0;">
            <p style="color: #666; margin: 0 0 15px 0;">Tu solicitud ha sido actualizada:</p>
            
            <div style="border-left: 4px solid #ffc107; padding-left: 15px; margin: 15px 0;">
              <h3 style="color: #333; margin: 0 0 5px 0;">${data.solicitudTitulo}</h3>
              <p style="color: #666; margin: 0;"><strong>ID:</strong> #${data.solicitudId}</p>
              ${data.nuevoEstado ? `<p style="color: #666; margin: 5px 0 0 0;"><strong>Estado:</strong> <span style="background: #ffc107; color: #333; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${data.nuevoEstado.toUpperCase()}</span></p>` : ''}
              ${data.soporteNombre ? `<p style="color: #666; margin: 5px 0 0 0;"><strong>Asignado a:</strong> ${data.soporteNombre}</p>` : ''}
            </div>
            
            ${data.respuesta ? `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4 style="color: #333; margin: 0 0 10px 0;">Nueva respuesta:</h4>
                <p style="color: #666; margin: 0; line-height: 1.5;">${data.respuesta}</p>
              </div>
            ` : ''}
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #2e7d32;">
              <strong>Buenas noticias!</strong><br>
              ${data.soporteNombre ? `${data.soporteNombre} está trabajando en tu solicitud.` : 'Tu solicitud está siendo procesada.'}
              Te mantendremos informado de cualquier progreso.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666;">¿Tienes preguntas? Responde a este email o contáctanos.</p>
            <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} Sistema de Soporte</p>
          </div>
        </div>
      </div>
    `
  }),

  closed: (data: EmailNotificationData) => ({
    subject: `✅ Solicitud cerrada: ${data.solicitudTitulo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Sistema de Soporte</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f8f9fa;">
          <h2 style="color: #333;">¡Hola ${data.clienteNombre}!</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px 0;">
            <p style="color: #666; margin: 0 0 15px 0;">Tu solicitud ha sido cerrada:</p>
            
            <div style="border-left: 4px solid #28a745; padding-left: 15px; margin: 15px 0;">
              <h3 style="color: #333; margin: 0 0 5px 0;">${data.solicitudTitulo}</h3>
              <p style="color: #666; margin: 0;"><strong>ID:</strong> #${data.solicitudId}</p>
              <p style="color: #666; margin: 5px 0 0 0;"><strong>Estado:</strong> <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">CERRADA</span></p>
              ${data.soporteNombre ? `<p style="color: #666; margin: 5px 0 0 0;"><strong>Resuelto por:</strong> ${data.soporteNombre}</p>` : ''}
            </div>
            
            ${data.respuesta ? `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4 style="color: #333; margin: 0 0 10px 0;">Respuesta final:</h4>
                <p style="color: #666; margin: 0; line-height: 1.5;">${data.respuesta}</p>
              </div>
            ` : ''}
          </div>
          
          <div style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #155724;">
              <strong>¡Listo!</strong><br>
              Tu solicitud ha sido resuelta exitosamente. Si tienes alguna pregunta adicional 
              o necesitas más ayuda, no dudes en crear una nueva solicitud.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666;">¿Cómo estuvo nuestro servicio? ¡Nos encantaría saber tu opinión!</p>
            <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} Sistema de Soporte</p>
          </div>
        </div>
      </div>
    `
  })
}

export async function notifyEmailChange(
  type: 'created' | 'updated' | 'closed',
  data: EmailNotificationData
): Promise<void> {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('📧 Email no configurado - Variables de entorno faltantes')
      return
    }

    let transporter = createTransport()
    const template = emailTemplates[type](data)

    const mailOptions = {
      from: {
        name: 'Sistema de Soporte',
        address: process.env.GMAIL_USER
      },
      to: data.clienteEmail,
      subject: template.subject,
      html: template.html
    }

    try {
      const info = await transporter.sendMail(mailOptions)
      console.log('Email enviado exitosamente:', {
        to: data.clienteEmail,
        type,
        messageId: info.messageId
      })
    } catch (primaryError: any) {
      console.log('⚠️ Error con transporter principal, intentando alternativo...')
      
      transporter = createTransportAlternative()
      const info = await transporter.sendMail(mailOptions)
      console.log('📧 Email enviado exitosamente (alternativo):', {
        to: data.clienteEmail,
        type,
        messageId: info.messageId
      })
    }

  } catch (error: any) {
    console.error('❌ Error enviando email:', {
      error: error.message,
      code: error.code,
      command: error.command
    })
  }
}

export async function notifySupportTeam(
  solicitudId: number,
  clienteNombre: string,
  titulo: string
): Promise<void> {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || !process.env.SUPPORT_EMAIL) {
      console.log('📧 Notificación a soporte no configurada')
      return
    }

    let transporter = createTransport()

    const mailOptions = {
      from: {
        name: 'Sistema de Soporte',
        address: process.env.GMAIL_USER
      },
      to: process.env.SUPPORT_EMAIL,
      subject: `Nueva solicitud de soporte #${solicitudId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Nueva solicitud de soporte</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <p><strong>Cliente:</strong> ${clienteNombre}</p>
            <p><strong>Título:</strong> ${titulo}</p>
            <p><strong>ID:</strong> #${solicitudId}</p>
            <p><strong>Estado:</strong> Abierta</p>
          </div>
          <p>Revisa el panel de administración para más detalles.</p>
        </div>
      `
    }

    try {
      await transporter.sendMail(mailOptions)
      console.log('Notificación enviada al equipo de soporte')
    } catch (primaryError) {
      console.log('Error con transporter principal, intentando alternativo...')
      transporter = createTransportAlternative()
      await transporter.sendMail(mailOptions)
      console.log('Noti enviada al equipo de soporte')
    }

  } catch (error: any) {
    console.error('❌ Error enviando notificación a soporte:', {
      error: error.message,
      code: error.code
    })
  }
}

export async function testEmailConnection(): Promise<boolean> {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return false
    }

    const transporter = createTransport()
    await transporter.verify()
    console.log('Conexión de email verificada exitosamente')
    return true
  } catch (error: any) {
    console.error('Error en la conexión de email:', error.message)
    
    // Intentar con configuración alternativa
    try {
      const transporter = createTransportAlternative()
      await transporter.verify()
      console.log('Conexión de email verificada (alternativo)')
      return true
    } catch (altError: any) {
      console.error('Error en conexión alternativa:', altError.message)
      return false
    }
  }
}