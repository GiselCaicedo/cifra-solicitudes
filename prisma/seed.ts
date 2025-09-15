// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // 1) Roles
  const roles = ['cliente', 'soporte', 'admin'] as const
  console.log('Creando roles...')
  for (const nombre of roles) {
    await prisma.rol.upsert({
      where: { nombre },
      update: {},
      create: { nombre }
    })
  }

  const [clienteRol, soporteRol, adminRol] = await Promise.all([
    prisma.rol.findUnique({ where: { nombre: 'cliente' } }),
    prisma.rol.findUnique({ where: { nombre: 'soporte' } }),
    prisma.rol.findUnique({ where: { nombre: 'admin' } })
  ])
  if (!clienteRol || !soporteRol || !adminRol) {
    throw new Error('No se pudieron obtener los roles')
  }

  const hash = await bcrypt.hash('changeme', 12)

  // 2) Usuarios
  console.log('Creando usuarios...')

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@cifra.test' },
    update: {},
    create: {
      email: 'admin@cifra.test',
      password: hash,
      nombre: 'Administrador Sistema',
      rolId: adminRol.id
    }
  })

  // 6 soportes
  const soporteEmails = [
    { email: 'soporte1@cifra.test', nombre: 'Ana García - Soporte' },
    { email: 'soporte2@cifra.test', nombre: 'Carlos López - Soporte' },
    { email: 'soporte3@cifra.test', nombre: 'Luis Torres - Soporte' },
    { email: 'soporte4@cifra.test', nombre: 'Valeria Ruiz - Soporte' },
    { email: 'soporte5@cifra.test', nombre: 'Diego Fernández - Soporte' },
    { email: 'soporte6@cifra.test', nombre: 'Sofía Gómez - Soporte' }
  ]

  const soportes = await Promise.all(
    soporteEmails.map((s) =>
      prisma.usuario.upsert({
        where: { email: s.email },
        update: {},
        create: { email: s.email, password: hash, nombre: s.nombre, rolId: soporteRol.id }
      })
    )
  )

  // 1 cliente (el que pediste)
  const cliente = await prisma.usuario.upsert({
    where: { email: 'giselcaicedosoler@gmail.com' },
    update: {},
    create: {
      email: 'giselcaicedosoler@gmail.com',
      password: hash,
      nombre: 'Gisel Caicedo Soler',
      rolId: clienteRol.id
    }
  })

  // Ayuditas
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
  const estados: Array<'abierta' | 'en_proceso' | 'cerrada'> = ['abierta', 'en_proceso', 'cerrada']

  console.log('Creando solicitudes de ejemplo...')

  // 3) Definimos 18 solicitudes variadas
  const plantillas = [
    { titulo: 'Error 500 en facturación', descripcion: 'No puedo generar facturas desde ayer.' },
    { titulo: 'Exportación a Excel', descripcion: 'Solicito exportar reportes a XLSX.' },
    { titulo: 'Desfase de inventario', descripcion: 'Stock no se actualiza tras ventas.' },
    { titulo: 'Acceso denegado', descripcion: 'Mensaje: usuario no existe al iniciar sesión.' },
    { titulo: 'Capacitación módulo de reportes', descripcion: 'Requiero sesión de una hora.' },
    { titulo: 'Integración con pasarela de pagos', descripcion: 'Falla al procesar tarjetas.' },
    { titulo: 'Lentitud general', descripcion: 'El dashboard tarda más de 30s en cargar.' },
    { titulo: 'Corrección de RUT en PDF', descripcion: 'Formato sale cortado en impresión.' },
    { titulo: 'Notificaciones por correo', descripcion: 'No llegan al crear nuevas órdenes.' },
    { titulo: 'Permisos por rol', descripcion: 'Un cliente puede ver más de lo debido.' },
    { titulo: 'API ventas v2', descripcion: 'Necesito endpoint para consolidado mensual.' },
    { titulo: 'Respaldo de base de datos', descripcion: 'Configurar backup diario 02:00.' },
    { titulo: 'Soporte móvil', descripcion: 'La app Android se cierra al abrir inventario.' },
    { titulo: 'Conector contable', descripcion: 'Exportación a Siigo presenta errores.' },
    { titulo: 'Campos personalizados', descripcion: 'Agregar campo “Centro de costo”.' },
    { titulo: 'Multiempresa', descripcion: 'Habilitar segunda sede con mismo login.' },
    { titulo: 'Captcha en login', descripcion: 'Solicitan captcha para mayor seguridad.' },
    { titulo: 'Recordatorios de pago', descripcion: 'Programar emails automáticos a 7 días.' }
  ]

  // Algunas asignadas, otras no. Un pequeño patrón: 2 de cada 3 asignadas.
  const solicitudesCreadas = []
  for (let i = 0; i < plantillas.length; i++) {
    const base = plantillas[i]
    const estado = pick(estados)
    const asignada = i % 3 !== 0 // true para la mayoría
    const soporte = asignada ? soportes[i % soportes.length] : null

    const solicitud = await prisma.solicitud.create({
      data: {
        titulo: base.titulo,
        descripcion: base.descripcion,
        estado,
        clienteId: cliente.id,
        soporteId: soporte ? soporte.id : null
      }
    })
    solicitudesCreadas.push(solicitud)

    // Historial: creación
    await prisma.historialCambio.create({
      data: {
        solicitudId: solicitud.id,
        campo: 'creacion',
        valorAnterior: null,
        valorNuevo: 'Solicitud creada',
        autorId: cliente.id
      }
    })

    // Historial: asignación (si aplica)
    if (soporte) {
      await prisma.historialCambio.create({
        data: {
          solicitudId: solicitud.id,
          campo: 'soporte_asignado',
          valorAnterior: 'Sin asignar',
          valorNuevo: `Asignado a soporte (${soporte.nombre})`,
          autorId: admin.id
        }
      })
    }

    // Historial: estados
    if (estado === 'en_proceso' || estado === 'cerrada') {
      await prisma.historialCambio.create({
        data: {
          solicitudId: solicitud.id,
          campo: 'estado',
          valorAnterior: 'abierta',
          valorNuevo: 'en_proceso',
          autorId: (soporte?.id ?? admin.id)
        }
      })
    }
    if (estado === 'cerrada') {
      await prisma.historialCambio.create({
        data: {
          solicitudId: solicitud.id,
          campo: 'estado',
          valorAnterior: 'en_proceso',
          valorNuevo: 'cerrada',
          autorId: (soporte?.id ?? admin.id)
        }
      })
      await prisma.solicitud.update({
        where: { id: solicitud.id },
        data: {
          respuesta: 'Problema solucionado. Se realizaron las configuraciones necesarias.'
        }
      })
    }
  }

  console.log('✅ Seed completado exitosamente!')
  console.log('\n📋 Usuarios creados:')
  console.log('👤 Admin: admin@cifra.test / changeme')
  soportes.forEach((s, idx) => {
    console.log(`🛠️  Soporte ${idx + 1}: ${s.email} / changeme`)
  })
  console.log(`👥 Cliente: ${cliente.email} / changeme`)
  console.log(`\n🎯 Solicitudes: ${solicitudesCreadas.length} solicitudes de ejemplo creadas`)
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
