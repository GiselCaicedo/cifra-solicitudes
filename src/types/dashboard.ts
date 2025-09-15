
export interface Solicitud {
  id: number
  titulo: string
  descripcion: string
  estado: 'abierta' | 'en_proceso' | 'cerrada'
  creadoEn: string
  cliente: { nombre: string; email: string }
  soporte?: { nombre: string; email: string }
  respuesta?: string
}

export interface Reportes {
  resumen: {
    abiertas: number
    enProceso: number
    cerradas: number
    total: number
  }
}

export interface Usuario {
  id: number
  email: string
  nombre: string
  rol: {
    id: number
    nombre: string
  }
}

export type EstadoSolicitud = 'abierta' | 'en_proceso' | 'cerrada'
export type RolUsuario = 'admin' | 'soporte' | 'cliente'