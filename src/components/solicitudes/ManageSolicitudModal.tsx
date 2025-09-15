'use client'

import { useState, useEffect } from 'react'

interface Solicitud {
  id: number
  titulo: string
  descripcion: string
  estado: 'abierta' | 'en_proceso' | 'cerrada'
  creadoEn: string
  cliente: { nombre: string; email: string }
  soporte?: { id: number; nombre: string; email: string }
  respuesta?: string
}

interface Usuario {
  id: number
  nombre: string
  email: string
  rol: { id: number; nombre: string }
}

interface ManageSolicitudModalProps {
  solicitud: Solicitud | null
  currentUser: 'admin' | 'soporte' | string
  soporteUsers?: Usuario[]
  onClose: () => void
  onSubmit: (id: number, data: {
    estado?: 'abierta' | 'en_proceso' | 'cerrada'
    respuesta?: string
    soporteId?: number
  }) => Promise<void>
}

export default function ManageSolicitudModal({
  solicitud,
  currentUser,
  soporteUsers = [],
  onClose,
  onSubmit
}: ManageSolicitudModalProps) {
  const [estado, setEstado] = useState<'abierta' | 'en_proceso' | 'cerrada'>('abierta')
  const [respuesta, setRespuesta] = useState('')
  const [soporteId, setSoporteId] = useState<number | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)

  useEffect(() => {
    if (solicitud) {
      setEstado(solicitud.estado)
      setRespuesta(solicitud.respuesta || '')
      setSoporteId(solicitud.soporte?.id || undefined)
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [solicitud])

  if (!solicitud) return null

  const isAdmin = currentUser === 'admin'
  const isSoporte = currentUser === 'soporte'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const submitData: {
        estado: 'abierta' | 'en_proceso' | 'cerrada'
        respuesta?: string
        soporteId?: number
      } = { estado }
      if (respuesta.trim()) submitData.respuesta = respuesta.trim()
      if (isAdmin && soporteId) submitData.soporteId = soporteId
      await onSubmit(solicitud.id, submitData)
      handleClose()
    } catch (error) {
      console.error('Error updating solicitud:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      setEstado('abierta')
      setRespuesta('')
      setSoporteId(undefined)
      setSuggestError(null)
      onClose()
    }, 300)
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

  const estadoConfig = getEstadoConfig(solicitud.estado)

  const handleSuggest = async () => {
    if (!solicitud) return
    setIsSuggesting(true)
    setSuggestError(null)
    try {
      const rol = isAdmin ? 'admin' : (isSoporte ? 'soporte' : 'otro')

      const res = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rol,
          clienteNombre: solicitud.cliente.nombre,
          titulo: solicitud.titulo,
          descripcion: solicitud.descripcion,
          estado
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'No se pudo generar la sugerencia')
      }

      const data: { sugerencia?: string } = await res.json()
      if (data.sugerencia) {
        setRespuesta((prev) => {
          // Si ya hay texto, preserva y separa
          const base = prev?.trim() ? `${prev.trim()}\n\n---\n` : ''
          return `${base}${data.sugerencia}`
        })
      } else {
        setSuggestError('No recibimos contenido de la IA.')
      }
    } catch (e: any) {
      console.error('Error sugiriendo respuesta:', e)
      setSuggestError(e?.message || 'Error generando sugerencia')
    } finally {
      setIsSuggesting(false)
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 transition-opacity duration-300 z-40 `}
        onClick={handleClose}
      />
      <div className={`fixed top-0 right-0 h-full w-96 bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}>

        <div className="bg-gray-700 px-6 py-5 text-white border-b border-slate-600">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold mb-2 truncate">{solicitud.titulo}</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="bg-gray-400 bg-opacity-20 px-3 py-1 rounded-full text-xs font-semibold">ID #{solicitud.id}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${estadoConfig.dot}`}></div>
                  <span className="text-xs font-medium text-gray-200">{estadoConfig.label.toUpperCase()}</span>
                </div>
                <div className="text-gray-300 text-xs">
                  {new Date(solicitud.creadoEn).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-white hover:bg-opacity-10"
              aria-label="Cerrar"
              title="Cerrar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="p-6 border-b border-gray-100">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-lg border-l-4 border-emerald-400">
                <h4 className="font-semibold text-emerald-900 mb-2 text-sm">Detalle Solicitud</h4>
                <p className="text-emerald-800 text-xs leading-relaxed whitespace-pre-wrap">{solicitud.descripcion}</p>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cliente</div>
                  <div className="text-sm font-semibold text-gray-900">{solicitud.cliente.nombre}</div>
                  <div className="text-xs text-gray-600">{solicitud.cliente.email}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Agente Asignado</div>
                  {solicitud.soporte ? (
                    <div>
                      <div className="text-sm font-semibold text-emerald-700">{solicitud.soporte.nombre}</div>
                      <div className="text-xs text-emerald-600">Asignado</div>
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-orange-600">Sin asignar</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* Admin: asignar soporte */}
            {isAdmin && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    Asignar Agente de Soporte
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={soporteId || ''}
                    onChange={(e) => setSoporteId(e.target.value ? Number(e.target.value) : undefined)}
                    className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white text-sm text-gray-900`}
                    disabled={isSubmitting}
                  >
                    <option value="" disabled className="text-gray-600">Seleccionar agente de soporte...</option>
                    {soporteUsers.map((user) => (
                      <option key={user.id} value={user.id} className="text-gray-900">
                        {user.nombre} ({user.email})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 flex items-start gap-1">
                  <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>También se asigna automáticamente cuando un agente responde</span>
                </p>
              </div>
            )}

            {/* Estado */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Estado de la Solicitud
                </span>
              </label>
              <div className="relative">
                <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-sm text-gray-900 appearance-none"
                    disabled={isSubmitting}
                  >
                    <option value="abierta">Abierta</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="cerrada">Cerrada</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Respuesta + Sugerir con IA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-800">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                    </svg>
                    Respuesta al Cliente
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleSuggest}
                  disabled={isSubmitting || isSuggesting}
                  className="px-3 py-1.5 border border-emerald-600 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-50 transition-all disabled:opacity-50 flex items-center gap-2"
                  title="Generar sugerencia con IA"
                >
                  {isSuggesting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25"/>
                        <path d="M4 12a8 8 0 018-8" fill="currentColor" className="opacity-75"/>
                      </svg>
                      Generando...
                    </>
                  ) : (
                    <>
                      Sugerir con IA
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={6}
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 resize-none bg-white text-sm text-gray-900 placeholder-gray-600"
                placeholder="Escribe tu respuesta detallada aquí..."
                disabled={isSubmitting}
              />
              <div className="text-xs text-gray-500 space-y-1">
                <p className="flex items-start gap-1">
                  <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  <span>Esta respuesta será enviada por correo al cliente</span>
                </p>
                {isSoporte && !solicitud.soporte && (
                  <p className="text-blue-600 font-medium flex items-start gap-1">
                    <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Al responder te asignarás automáticamente a esta solicitud</span>
                  </p>
                )}
                {suggestError && (
                  <p className="text-red-600 font-medium">{suggestError}</p>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Actualizar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
