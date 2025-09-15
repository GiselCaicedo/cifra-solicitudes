'use client'

import { useEffect, useState } from 'react'
import moment from 'moment'
import 'moment/locale/es'

interface HistorialItem {
  id: number
  accion: 'creada' | 'asignada' | 'respuesta' | 'cambio_estado'
  descripcion: string
  creadoEn: string
  usuario: { nombre: string; email: string; rol?: string }
  detalles?: {
    estadoAnterior?: string
    estadoNuevo?: string
    respuesta?: string
    soporteAsignado?: string
  }
}

interface Solicitud {
  id: number
  titulo: string
  descripcion: string
  estado: 'abierta' | 'en_proceso' | 'cerrada'
  creadoEn: string
  cliente: { nombre: string; email: string }
  soporte?: { nombre: string; email: string }
  respuesta?: string
}

interface Props {
  solicitud: Solicitud | null
  historial: HistorialItem[]
  onClose: () => void
  isLoading?: boolean
}

export default function HistorialSolicitudModal({
  solicitud,
  historial,
  onClose,
  isLoading = false
}: Props) {
  const [isVisible, setIsVisible] = useState(false)

  moment.locale('es')

  useEffect(() => {
    setIsVisible(!!solicitud)
  }, [solicitud])

  if (!solicitud) return null

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'abierta':
        return { label: 'Abierta', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' }
      case 'en_proceso':
        return { label: 'En Proceso', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500' }
      case 'cerrada':
        return { label: 'Cerrada', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500' }
      default:
        return { label: 'Desconocido', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-500' }
    }
  }

  const getAccionIcon = (accion: string) => {
    switch (accion) {
      case 'creada':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        )
      case 'asignada':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
            <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )
      case 'respuesta':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
        )
      case 'cambio_estado':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
            <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
    }
  }

  const formatearFecha = (fecha: string) => {
    const m = moment(fecha)
    return { relativa: m.fromNow(), completa: m.format('D [de] MMMM [de] YYYY [a las] HH:mm') }
  }

  const estadoConfig = getEstadoConfig(solicitud.estado)

  return (
    <>
      <div className="fixed inset-0 transition-opacity duration-300 z-40" onClick={handleClose} />
      <div className={`fixed top-0 right-0 h-full w-96 bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="bg-gray-700 px-6 py-5 text-white border-b border-slate-600">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold mb-2 truncate">Historial de Cambios</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="bg-gray-400 bg-opacity-20 px-3 py-1 rounded-full text-xs font-semibold">ID #{solicitud.id}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${estadoConfig.dot}`} />
                  <span className="text-xs font-medium text-gray-200">{estadoConfig.label.toUpperCase()}</span>
                </div>
                <div className="text-gray-300 text-xs">
                  {new Date(solicitud.creadoEn).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            <button onClick={handleClose} className="text-white hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-white hover:bg-opacity-10" aria-label="Cerrar" title="Cerrar">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Info solicitud */}
          <div className="p-6 border-b border-gray-100">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-lg border-l-4 border-slate-400">
              <h4 className="font-semibold text-slate-900 mb-2 text-sm truncate">{solicitud.titulo}</h4>
              <p className="text-slate-700 text-xs leading-relaxed line-clamp-3">{solicitud.descripcion}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cliente</div>
                <div className="text-sm font-semibold text-gray-900 truncate">{solicitud.cliente.nombre}</div>
                <div className="text-xs text-gray-600 truncate">{solicitud.cliente.email}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Agente</div>
                {solicitud.soporte ? (
                  <div>
                    <div className="text-sm font-semibold text-emerald-700 truncate">{solicitud.soporte.nombre}</div>
                    <div className="text-xs text-emerald-600">Asignado</div>
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-orange-600">Sin asignar</div>
                )}
              </div>
            </div>
          </div>

          {/* Historial */}
          <div className="p-6">
          

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="h-8 w-8 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : historial.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="mt-4 text-sm font-medium text-gray-900">Sin historial</h3>
                <p className="mt-2 text-xs text-gray-500">No hay eventos registrados para esta solicitud.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {historial.map((item, index) => {
                  const fecha = formatearFecha(item.creadoEn)
                  const esUltimo = index === historial.length - 1
                  return (
                    <div key={item.id} className="relative flex gap-4">
                      {!esUltimo && <div className="absolute left-4 top-8 h-full w-px bg-gray-200" />}
                      {getAccionIcon(item.accion)}
                      <div className="flex-1 min-w-0">
                        <div className="bg-white border-b rounded-lg p-4 duration-200">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h5 className="text-sm font-semibold text-gray-900 leading-tight">{item.descripcion}</h5>
                            <div className="text-right flex-shrink-0">
                              <div className="text-xs font-medium text-gray-900" title={fecha.completa}>{fecha.relativa}</div>
                              <div className="text-xs text-gray-500">{moment(item.creadoEn).format('HH:mm')}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
                              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <div className="text-xs text-gray-600">
                              <span className="font-medium text-gray-800">{item.usuario.nombre}</span>
                              {item.usuario.rol && (
                                <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{item.usuario.rol}</span>
                              )}
                            </div>
                          </div>

                          {item.detalles && (
                            <div className="space-y-2">
                              {item.detalles.estadoAnterior && item.detalles.estadoNuevo && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-gray-500">Estado:</span>
                                  <span className={`px-2 py-1 rounded-full font-medium ${getEstadoConfig(item.detalles.estadoAnterior).color} ${getEstadoConfig(item.detalles.estadoAnterior).bg}`}>
                                    {getEstadoConfig(item.detalles.estadoAnterior).label}
                                  </span>
                                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                  <span className={`px-2 py-1 rounded-full font-medium ${getEstadoConfig(item.detalles.estadoNuevo).color} ${getEstadoConfig(item.detalles.estadoNuevo).bg}`}>
                                    {getEstadoConfig(item.detalles.estadoNuevo).label}
                                  </span>
                                </div>
                              )}

                              {item.detalles.soporteAsignado && (
                                <div className="text-xs">
                                  <span className="text-gray-500">Asignado a:</span>
                                  <span className="ml-1 font-medium text-purple-700">{item.detalles.soporteAsignado}</span>
                                </div>
                              )}

                              {item.detalles.respuesta && (
                                <div className="mt-2 p-3 bg-gray-50 rounded border-l-2 border-emerald-400">
                                  <div className="text-xs text-gray-500 mb-1">Respuesta:</div>
                                  <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap line-clamp-4">{item.detalles.respuesta}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <button onClick={handleClose} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200">
            Cerrar
          </button>
        </div>
      </div>

      <style jsx>{`
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-4 { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </>
  )
}
