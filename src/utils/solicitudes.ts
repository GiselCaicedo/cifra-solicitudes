import type { EstadoSolicitud, RolUsuario } from '@/types/dashboard'

export const getEstadoColor = (estado: EstadoSolicitud): string => {
  switch (estado) {
    case 'abierta': 
      return 'bg-red-100 text-red-800'
    case 'en_proceso': 
      return 'bg-yellow-100 text-yellow-800'
    case 'cerrada': 
      return 'bg-green-100 text-green-800'
    default: 
      return 'bg-gray-100 text-gray-800'
  }
}

export const getEstadoText = (estado: EstadoSolicitud): string => {
  switch (estado) {
    case 'abierta': 
      return 'Abierta'
    case 'en_proceso': 
      return 'En Proceso'
    case 'cerrada': 
      return 'Cerrada'
    default: 
      return estado
  }
}

export const getEstadoIcon = (estado: EstadoSolicitud): string => {
  switch (estado) {
    case 'abierta': 
      return '🔴'
    case 'en_proceso': 
      return '🟡'
    case 'cerrada': 
      return '🟢'
    default: 
      return '⚪'
  }
}

export const getRoleColor = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800'
    case 'soporte':
      return 'bg-blue-100 text-blue-800'
    case 'cliente':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const getSolicitudesDescription = (userRole: RolUsuario): string => {
  switch (userRole) {
    case 'cliente':
      return 'Tus solicitudes'
    case 'soporte':
      return 'Solicitudes asignadas y disponibles'
    case 'admin':
      return 'Todas las solicitudes del sistema'
    default:
      return 'Solicitudes'
  }
}

export const canManageSolicitudes = (userRole: string): boolean => {
  return userRole === 'soporte' || userRole === 'admin'
}

export const canCreateSolicitudes = (userRole: string): boolean => {
  return userRole === 'cliente'
}

export const isAdmin = (userRole: string): boolean => {
  return userRole === 'admin'
}