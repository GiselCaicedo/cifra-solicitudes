'use client'

import moment from 'moment'
import 'moment/locale/es'
import { useMemo, useState, useEffect } from 'react'
import DataTable, { TableColumn } from 'react-data-table-component'

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

interface SolicitudesListProps {
  solicitudes: Solicitud[]
  userRole: string
  onGestionar: (solicitud: Solicitud) => void
  onNuevaSolicitud: () => void
  onVerHistorial: (id: number) => void
}

interface Filtros {
  fechaDesde: string
  fechaHasta: string
  cliente: string
  soporte: string
  estado: string
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const m = window.matchMedia(query)
    const onChange = () => setMatches(m.matches)
    onChange()
    m.addEventListener?.('change', onChange)
    return () => m.removeEventListener?.('change', onChange)
  }, [query])
  return matches
}

export default function SolicitudesList({
  solicitudes,
  userRole,
  onGestionar,
  onNuevaSolicitud,
  onVerHistorial
}: SolicitudesListProps) {
  const [filtros, setFiltros] = useState<Filtros>({
    fechaDesde: '',
    fechaHasta: '',
    cliente: '',
    soporte: '',
    estado: ''
  })

  const isMobile = useMediaQuery('(max-width: 640px)')
  moment.locale('es')

  const handleFiltroChange = (campo: keyof Filtros, valor: string) =>
    setFiltros(prev => ({ ...prev, [campo]: valor }))

  const limpiarFiltros = () =>
    setFiltros({ fechaDesde: '', fechaHasta: '', cliente: '', soporte: '', estado: '' })

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'abierta': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
      case 'en_proceso': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20'
      case 'cerrada': return 'bg-slate-50 text-slate-700 ring-1 ring-slate-600/20'
      default: return 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20'
    }
  }
  const getEstadoText = (estado: string) =>
    estado === 'en_proceso' ? 'En Proceso' : estado.charAt(0).toUpperCase() + estado.slice(1)

  const getDescription = (role: string) => {
    switch (role) {
      case 'cliente': return 'Gestión de sus solicitudes de soporte técnico'
      case 'soporte': return 'Solicitudes asignadas y disponibles para atención'
      case 'admin': return 'Panel de administración de todas las solicitudes'
      default: return 'Sistema de gestión de solicitudes'
    }
  }

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter((s) => {
      const fechaS = moment(s.creadoEn)
      if (filtros.fechaDesde) {
        const desde = moment(filtros.fechaDesde, 'YYYY-MM-DD').startOf('day')
        if (fechaS.isBefore(desde)) return false
      }
      if (filtros.fechaHasta) {
        const hasta = moment(filtros.fechaHasta, 'YYYY-MM-DD').endOf('day')
        if (fechaS.isAfter(hasta)) return false
      }
      if (filtros.cliente) {
        const q = filtros.cliente.toLowerCase()
        if (!s.cliente.nombre.toLowerCase().includes(q) && !s.cliente.email.toLowerCase().includes(q)) return false
      }
      if (filtros.soporte) {
        const q = filtros.soporte.toLowerCase()
        if (!s.soporte) return false
        if (!s.soporte.nombre.toLowerCase().includes(q) && !s.soporte.email.toLowerCase().includes(q)) return false
      }
      if (filtros.estado && s.estado !== filtros.estado) return false
      return true
    })
  }, [solicitudes, filtros])

  const EstadoPill = ({ estado }: { estado: Solicitud['estado'] }) => (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getEstadoColor(estado)}`}>
      {getEstadoText(estado)}
    </span>
  )

  const FechaCell = ({ value }: { value: string }) => (
    <span className="font-medium text-slate-900">
      {moment(value).format('D [de] MMMM [de] YYYY')}
    </span>
  )

  const desktopCols: TableColumn<Solicitud>[] = [
    { name: 'ID', selector: r => r.id, sortable: true, width: '80px', cell: r => <span className="font-medium">#{r.id}</span> },
    { name: 'Estado', selector: r => r.estado, sortable: true, cell: r => <EstadoPill estado={r.estado} /> },
    { name: 'Título', selector: r => r.titulo, sortable: true, grow: 2, wrap: true },
    {
      name: 'Cliente', selector: r => r.cliente.nombre, sortable: true, wrap: true,
      cell: r => <div className="leading-tight">
        <div className="font-medium text-slate-900">{r.cliente.nombre}</div>
        <div className="text-xs text-slate-600 break-words">{r.cliente.email}</div>
      </div>
    },
    {
      name: 'Soporte', selector: r => r.soporte?.nombre ?? '', sortable: true, wrap: true,
      cell: r => r.soporte ? (
        <div className="leading-tight">
          <div className="font-medium text-slate-900">{r.soporte.nombre}</div>
          <div className="text-xs text-slate-600 break-words">{r.soporte.email}</div>
        </div>
      ) : <span className="text-slate-500 text-xs">—</span>
    },
    { name: 'Creado', selector: r => r.creadoEn, sortable: true, cell: r => <FechaCell value={r.creadoEn} /> },
    {
      name: 'Acciones',
      cell: r => (
        <div className="flex items-center justify-end gap-2">
          {userRole !== 'cliente' && (
            <div>
              <button
                onClick={() => onVerHistorial(r.id)}  // <-- antes: data.id
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium hover:bg-gray-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3M12 22a10 10 0 100-20 10 10 0 000 20z" />
                </svg>
              </button>
            </div>
          )}
          <button
            onClick={() => onGestionar(r)}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-slate-800"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      ),
      ignoreRowClick: true,
    }


  ]

  const mobileCols: TableColumn<Solicitud>[] = [
    { name: 'ID', selector: r => r.id, width: '64px', cell: r => <span className="font-medium">#{r.id}</span> },
    { name: 'Título', selector: r => r.titulo, grow: 2, wrap: true },
    {
      name: '',
      cell: r => (
        <div className="flex items-center justify-end gap-2">
          {userRole !== 'cliente' && (
            <div>
              <button
                onClick={() => onVerHistorial(data.id)}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium hover:bg-gray-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3M12 22a10 10 0 100-20 10 10 0 000 20z" />
                </svg>
                
              </button>
            </div>
          )}
          <button
            onClick={() => onGestionar(r)}
            className="rounded-md bg-gray-700 px-2.5 py-1.5 text-xs font-medium text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      ),
      ignoreRowClick: true,
    }

  ]

  const columns = isMobile ? mobileCols : desktopCols

  const Expandible = ({ data }: { data: Solicitud }) => (
    <div className="p-3 text-sm space-y-3">
      <div className="flex items-center gap-2">
        <EstadoPill estado={data.estado} />
      </div>
      <div className="text-slate-800">
        <span className="text-slate-500">Cliente:</span>{' '}
        <span className="font-medium">{data.cliente.nombre}</span>
        <div className="text-xs text-slate-600 break-words">{data.cliente.email}</div>
      </div>
      {data.soporte && (
        <div className="text-slate-800">
          <span className="text-slate-500">Soporte:</span>{' '}
          <span className="font-medium">{data.soporte.nombre}</span>
          <div className="text-xs text-slate-600 break-words">{data.soporte.email}</div>
        </div>
      )}
      <div className="text-slate-800">
        <span className="text-slate-500">Creado:</span>{' '}
        <FechaCell value={data.creadoEn} />
      </div>
      {data.descripcion && (
        <div>
          <div className="text-slate-500">Descripción</div>
          <p className="leading-relaxed text-slate-800">{data.descripcion}</p>
        </div>
      )}
      {data.respuesta && (
        <div>
          <div className="text-slate-500">Última respuesta</div>
          <p className="leading-relaxed text-slate-800">{data.respuesta}</p>
        </div>
      )}
      <div>
        <button
          onClick={() => onVerHistorial(data.id)}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium hover:bg-gray-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3M12 22a10 10 0 100-20 10 10 0 000 20z" />
          </svg>
          Ver historial de cambios
        </button>
      </div>
    </div>
  )

  const customStyles = {
    headCells: { style: { textTransform: 'uppercase', fontSize: 12, color: '#6b7280' } },
    rows: { style: { minHeight: '64px' } },
    cells: { style: { fontSize: 14, whiteSpace: 'normal' as const, lineHeight: '1.25rem' } },
    pagination: { style: { fontSize: 13 } },
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="border-b border-slate-200 bg-slate-50/50 px-10">
        <div className="px-8 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Solicitudes de Soporte</h1>
              <p className="mt-2 text-sm text-slate-600">{getDescription(userRole)}</p>
            </div>
            {userRole === 'cliente' && (
              <button
                onClick={onNuevaSolicitud}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Solicitud
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 bg-white px-10">
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Desde</label>
              <input
                type="date" value={filtros.fechaDesde}
                onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Hasta</label>
              <input
                type="date" value={filtros.fechaHasta}
                onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Cliente</label>
              <input
                type="text" placeholder="Buscar por nombre o email"
                value={filtros.cliente}
                onChange={(e) => handleFiltroChange('cliente', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {userRole === 'admin' && (
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">Agente Soporte</label>
                <input
                  type="text" placeholder="Buscar por nombre o email"
                  value={filtros.soporte}
                  onChange={(e) => handleFiltroChange('soporte', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            )}

            <div className={`lg:col-span-1 ${userRole !== 'admin' ? 'lg:col-span-2' : ''}`}>
              <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
              <select
                value={filtros.estado}
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="">Todos los estados</option>
                <option value="abierta">Abierta</option>
                <option value="en_proceso">En Proceso</option>
                <option value="cerrada">Cerrada</option>
              </select>
            </div>

            <div className="lg:col-span-1 flex items-end gap-2">
              <button
                onClick={limpiarFiltros}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-10 py-6">
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={solicitudesFiltradas}
              customStyles={customStyles}
              paginationPerPage={5}
              responsive
              highlightOnHover
              striped
              pagination
              paginationRowsPerPageOptions={[5, 10, 20, 50]}
              persistTableHead={!isMobile}
              fixedHeader={!isMobile}
              fixedHeaderScrollHeight={isMobile ? undefined : '60vh'}
              expandableRows={isMobile}
              expandableRowsComponent={Expandible}
              noDataComponent={
                <div className="text-slate-500 py-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-slate-900">No se encontraron solicitudes</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {solicitudes.length === 0
                      ? 'No hay solicitudes disponibles en el sistema.'
                      : 'No hay solicitudes que coincidan con los filtros aplicados.'}
                  </p>
                  {solicitudes.length > 0 && (
                    <button
                      onClick={limpiarFiltros}
                      className="mt-4 inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              }
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(.rdt_TableCell) { word-break: break-word; }
        :global(.rdt_TableHead .rdt_TableCol) { font-size: 12px; text-transform: uppercase; }
        @media (max-width: 640px) {
          :global(.rdt_TableHead .rdt_TableCol) { font-size: 11px; }
        }
      `}</style>
    </div>
  )
}