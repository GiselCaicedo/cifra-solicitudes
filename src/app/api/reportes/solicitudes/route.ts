// src/app/api/reportes/solicitudes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/requireAuth'

export async function GET(req: NextRequest) {
  // Solo admin y soporte pueden ver reportes
  const authResult = requireRole(req, ['admin', 'soporte'])
  if (authResult instanceof NextResponse) return authResult
  const { user } = authResult

  try {
    let whereClause = {}
    
    // Si es soporte, solo mostrar sus solicitudes
    if (user.rol === 'soporte') {
      whereClause = { soporteId: user.id }
    }

    // Obtener fechas para cálculos temporales
    const ahora = new Date()
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
    const inicioSemana = new Date(ahora.setDate(ahora.getDate() - ahora.getDay()))
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    const inicio30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Consultas básicas
    const [abiertas, enProceso, cerradas, total] = await Promise.all([
      prisma.solicitud.count({ where: { ...whereClause, estado: 'abierta' } }),
      prisma.solicitud.count({ where: { ...whereClause, estado: 'en_proceso' } }),
      prisma.solicitud.count({ where: { ...whereClause, estado: 'cerrada' } }),
      prisma.solicitud.count({ where: whereClause }),
    ])

    // Estadísticas adicionales para administradores
    let estadisticasExtras = {}
    
    if (user.rol === 'admin') {
      const [
        sinAsignar, 
        usuariosGrouped, 
        roles, 
        solicitudesHoy,
        solicitudesSemana,
        solicitudesMes,
        solicitudesRecientes,
        solicitudesUltimos30Dias
      ] = await Promise.all([
        // Solicitudes sin asignar
        prisma.solicitud.count({ where: { soporteId: null } }),
        
        // Agrupar usuarios por rolId y contarlos
        prisma.usuario.groupBy({
          by: ['rolId'],
          _count: { id: true }
        }),
        
        // Obtener información de roles
        prisma.rol.findMany({
          select: { id: true, nombre: true }
        }),
        
        // Solicitudes creadas hoy
        prisma.solicitud.count({
          where: {
            creadoEn: { gte: inicioHoy }
          }
        }),

        // Solicitudes de esta semana
        prisma.solicitud.count({
          where: {
            creadoEn: { gte: inicioSemana }
          }
        }),

        // Solicitudes de este mes
        prisma.solicitud.count({
          where: {
            creadoEn: { gte: inicioMes }
          }
        }),

        prisma.solicitud.count({
          where: {
            estado: { in: ['abierta', 'en_proceso'] },
            creadoEn: { 
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        }),

        prisma.solicitud.findMany({
          where: {
            creadoEn: { gte: inicio30Dias }
          },
          select: {
            id: true,
            estado: true,
            creadoEn: true,
            clienteId: true,
            soporteId: true
          }
        })
      ])

      const solicitudesCerradasRecientes = await prisma.solicitud.findMany({
        where: {
          estado: 'cerrada',
          creadoEn: { gte: inicio30Dias }
        },
        select: {
          creadoEn: true,
          actualizadoEn: true
        },
        take: 100 
      })

      const tiempoPromedioHoras = solicitudesCerradasRecientes.length > 0 
        ? solicitudesCerradasRecientes.reduce((acc, solicitud) => {
            const tiempoDiff = new Date(solicitud.actualizadoEn).getTime() - new Date(solicitud.creadoEn).getTime()
            return acc + (tiempoDiff / (1000 * 60 * 60)) // convertir a horas
          }, 0) / solicitudesCerradasRecientes.length
        : 0

      const usuariosPorRol = usuariosGrouped.map(grupo => {
        const rol = roles.find(r => r.id === grupo.rolId)
        return {
          rolId: grupo.rolId,
          rolNombre: rol?.nombre || 'Desconocido',
          cantidad: grupo._count.id
        }
      })

      const rolSoporte = roles.find(r => r.nombre.toLowerCase().includes('soporte'))
      let soporteActivo = []
      
      if (rolSoporte) {
        const usuariosSoporte = await prisma.usuario.findMany({
          where: { 
            rolId: rolSoporte.id
          },
          select: {
            id: true,
            nombre: true,
            email: true
          }
        })

        // Contar solicitudes por usuario de soporte
        soporteActivo = await Promise.all(
          usuariosSoporte.map(async (usuario) => {
            const count = await prisma.solicitud.count({
              where: {
                soporteId: usuario.id,
                creadoEn: { gte: inicioMes }
              }
            })
            return {
              ...usuario,
              solicitudesAtendidas: count
            }
          })
        )
      }

      // Análisis de tendencias por cliente (top 5)
      const solicitudesPorCliente = await prisma.solicitud.groupBy({
        by: ['clienteId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      })

      const clientesConNombres = await Promise.all(
        solicitudesPorCliente.map(async (item) => {
          const cliente = await prisma.usuario.findUnique({
            where: { id: item.clienteId },
            select: { nombre: true, email: true }
          })
          return {
            clienteId: item.clienteId,
            cliente: cliente?.nombre || 'Desconocido',
            email: cliente?.email || '',
            solicitudes: item._count.id
          }
        })
      )

      // Análisis temporal más detallado - últimos 7 días
      const fechasUltimos7Dias = Array.from({ length: 7 }, (_, i) => {
        const fecha = new Date()
        fecha.setDate(fecha.getDate() - (6 - i))
        fecha.setHours(0, 0, 0, 0)
        return fecha
      })

      const solicitudesPorDia = await Promise.all(
        fechasUltimos7Dias.map(async (fecha) => {
          const siguienteDia = new Date(fecha)
          siguienteDia.setDate(siguienteDia.getDate() + 1)
          
          const count = await prisma.solicitud.count({
            where: {
              creadoEn: {
                gte: fecha,
                lt: siguienteDia
              }
            }
          })
          
          return {
            fecha: fecha.toISOString().split('T')[0],
            dia: fecha.toLocaleDateString('es-ES', { weekday: 'short' }),
            solicitudes: count
          }
        })
      )

      estadisticasExtras = {
        sinAsignar,
        solicitudesHoy,
        solicitudesSemana,
        solicitudesMes,
        solicitudesRecientes,
        usuariosPorRol,
        tiempoPromedioRespuesta: Math.round(tiempoPromedioHoras * 100) / 100,
        soporteActivo: soporteActivo.sort((a, b) => b.solicitudesAtendidas - a.solicitudesAtendidas),
        clientesActivos: clientesConNombres,
        tendenciaDiaria: solicitudesPorDia,
        metricas: {
          tasaResolucion: total > 0 ? Math.round((cerradas / total) * 100) : 0,
          cargaTrabajo: abiertas + enProceso,
          eficienciaDiaria: solicitudesHoy,
          tendenciaSemanal: solicitudesSemana,
          rendimientoMensual: solicitudesMes,
          promedioRespuesta: tiempoPromedioHoras,
          solicitudesActivas: abiertas + enProceso,
          solicitudesPendientes: sinAsignar
        },
        distribucionEstados: {
          abierta: abiertas,
          en_proceso: enProceso,
          cerrada: cerradas
        }
      }
    } else if (user.rol === 'soporte') {
      // Estadísticas específicas para usuario de soporte
      const [
        solicitudesAsignadasHoy,
        solicitudesCerradasHoy,
        solicitudesUltimaSemana
      ] = await Promise.all([
        // Solicitudes asignadas hoy
        prisma.solicitud.count({
          where: {
            soporteId: user.id,
            creadoEn: { gte: inicioHoy }
          }
        }),

        // Solicitudes cerradas hoy
        prisma.solicitud.count({
          where: {
            soporteId: user.id,
            estado: 'cerrada',
            actualizadoEn: { gte: inicioHoy }
          }
        }),

        // Solicitudes de la última semana
        prisma.solicitud.count({
          where: {
            soporteId: user.id,
            creadoEn: { 
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ])

      estadisticasExtras = {
        solicitudesAsignadasHoy,
        solicitudesCerradasHoy,
        promedioDiario: Math.round(solicitudesUltimaSemana / 7),
        rendimiento: {
          productividad: solicitudesCerradasHoy,
          cargaActual: abiertas + enProceso,
          eficienciaDiaria: solicitudesAsignadasHoy > 0 ? 
            Math.round((solicitudesCerradasHoy / solicitudesAsignadasHoy) * 100) : 0
        }
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        resumen: {
          abiertas,
          enProceso,
          cerradas,
          total
        },
        fechaActualizacion: new Date().toISOString(),
        rol: user.rol,
        usuario: {
          id: user.id,
          nombre: user.nombre
        },
        ...estadisticasExtras
      }
    })
  } catch (error: any) {
    console.error('Error al generar reportes:', error)
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Error interno del servidor',
        mensaje: 'No se pudieron cargar los reportes. Intente nuevamente.',
        detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}