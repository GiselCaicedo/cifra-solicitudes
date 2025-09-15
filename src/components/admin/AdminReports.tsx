'use client'

import React, { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'

interface ReportData {
  resumen: {
    abiertas: number
    enProceso: number
    cerradas: number
    total: number
  }
  sinAsignar?: number
  solicitudesHoy?: number
  solicitudesSemana?: number
  solicitudesMes?: number
  solicitudesRecientes?: number
  usuariosPorRol?: Array<{
    rolId: number
    rolNombre: string
    cantidad: number
  }>
  soporteActivo?: Array<{
    id: number
    nombre: string
    email: string
    solicitudesAtendidas: number
  }>
  metricas?: {
    tasaResolucion: number
    cargaTrabajo: number
    eficienciaDiaria: number
    tendenciaSemanal: number
    rendimientoMensual: number
  }
  tiempoPromedioRespuesta?: number
}

interface AdminReportsChartsProps {
  reportes: ReportData
  userRole?: 'admin' | 'soporte'
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  indigo: '#6366f1',
  teal: '#14b8a6',
  pink: '#ec4899',
  gray: '#6b7280'
}

const Icons = {
  Chart: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Pie: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
  ),
  Trend: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  )
}

function formatNumber(n?: number) {
  if (n === undefined || n === null) return '0'
  return new Intl.NumberFormat('es-ES').format(n)
}

function formatMinutes(min?: number) {
  if (!min && min !== 0) return '—'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export default function AdminReports({ reportes, userRole = 'admin' }: AdminReportsChartsProps) {
  const [selectedChart, setSelectedChart] = useState<'estados' | 'usuarios' | 'tendencia'>('estados')

  const estadosData = useMemo(
    () =>
      [
        { name: 'Abiertas', value: reportes?.resumen?.abiertas || 0, color: COLORS.danger },
        { name: 'En Proceso', value: reportes?.resumen?.enProceso || 0, color: COLORS.warning },
        { name: 'Cerradas', value: reportes?.resumen?.cerradas || 0, color: COLORS.success }
      ].filter(i => i.value > 0),
    [reportes]
  )

  const usuariosRolData = useMemo(
    () =>
      (reportes?.usuariosPorRol || []).map(rol => ({
        name: rol.rolNombre.charAt(0).toUpperCase() + rol.rolNombre.slice(1),
        value: rol.cantidad,
        color:
          rol.rolNombre === 'admin'
            ? COLORS.purple
            : rol.rolNombre === 'soporte'
            ? COLORS.primary
            : COLORS.indigo
      })),
    [reportes]
  )

  const soporteRendimientoData = useMemo(
    () =>
      (reportes?.soporteActivo || [])
        .slice(0, 8)
        .map(s => ({ name: s.nombre.split(' ')[0] || s.nombre, solicitudes: s.solicitudesAtendidas })),
    [reportes]
  )

  const tendenciaData = useMemo(
    () => [
      { periodo: 'Hoy', solicitudes: reportes?.solicitudesHoy || 0 },
      { periodo: 'Semana', solicitudes: reportes?.solicitudesSemana || 0 },
      { periodo: 'Mes', solicitudes: reportes?.solicitudesMes || 0 }
    ],
    [reportes]
  )

  const metricasData = useMemo(
    () =>
      reportes?.metricas
        ? [
            { name: 'Tasa Resolución', value: `${reportes.metricas.tasaResolucion}%`, color: COLORS.success },
            { name: 'Carga Trabajo', value: formatNumber(reportes.metricas.cargaTrabajo), color: COLORS.warning },
            { name: 'Eficiencia', value: formatNumber(reportes.metricas.eficienciaDiaria), color: COLORS.primary }
          ]
        : [],
    [reportes]
  )

  const kpisSecundarios = useMemo(
    () => [
      { label: 'Total', value: formatNumber(reportes?.resumen?.total || 0), color: COLORS.gray },
      { label: 'Sin asignar', value: formatNumber(reportes?.sinAsignar || 0), color: COLORS.pink },
      { label: 'Recientes', value: formatNumber(reportes?.solicitudesRecientes || 0), color: COLORS.teal },
      { label: 'T. Resp. Prom.', value: formatMinutes(reportes?.tiempoPromedioRespuesta), color: COLORS.indigo }
    ],
    [reportes]
  )

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg text-sm">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((item: any, i: number) => (
            <p key={i} className="flex items-center gap-2" style={{ color: item.color || item.fill }}>
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color || item.fill }} />
              <span>{item.name || item.dataKey}:</span>
              <span className="font-semibold">{formatNumber(item.value)}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (userRole !== 'admin') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center space-y-2">
        <div className="mx-auto inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600">
          <Icons.Chart />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Reportes Gráficos</h3>
        <p className="text-gray-600">Los reportes gráficos están disponibles solo para administradores</p>
      </div>
    )
  }

  const noData =
    !reportes ||
    (!estadosData.length && !usuariosRolData.length && !soporteRendimientoData.length && tendenciaData.every(t => t.solicitudes === 0))

  if (noData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-10 text-center space-y-3">
        <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 text-gray-500">
          <Icons.Pie />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Sin datos para mostrar</h3>
        <p className="text-gray-600">Aún no hay información suficiente para construir los reportes.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">Reportes Gráficos</h2>
            <p className="text-sm text-gray-600">Análisis visual de las solicitudes del sistema</p>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-thin">
            {[
              { key: 'estados', label: 'Estados' },
              { key: 'usuarios', label: 'Usuarios' },
              { key: 'tendencia', label: 'Tendencia' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedChart(tab.key as any)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedChart === (tab.key as any)
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={selectedChart === (tab.key as any)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {metricasData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {metricasData.map((m, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">{m.name}</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: m.color }}>
                {m.value}
              </p>
            </div>
          ))}
          {kpisSecundarios.map((k, i) => (
            <div key={`k-${i}`} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">{k.label}</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: k.color }}>
                {k.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedChart === 'estados' && estadosData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Estados</h3>
            <div className="h-[260px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estadosData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius="80%"
                    dataKey="value"
                  >
                    {estadosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {estadosData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedChart === 'estados' && soporteRendimientoData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento del Soporte (Mes)</h3>
            <div className="h-[260px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={soporteRendimientoData} margin={{ left: 4, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={40} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="solicitudes" name="Solicitudes" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedChart === 'usuarios' && usuariosRolData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Usuarios por Rol</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-[240px] sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={usuariosRolData} cx="50%" cy="50%" outerRadius="80%" dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {usuariosRolData.map((entry, index) => (
                        <Cell key={`cell-rol-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center space-y-3">
                {usuariosRolData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-gray-900">{item.name}</span>
                    </div>
                    <span className="text-lg font-bold" style={{ color: item.color }}>
                      {formatNumber(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedChart === 'tendencia' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencia de Solicitudes</h3>
            <div className="h-[260px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tendenciaData} margin={{ left: 4, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" name="Solicitudes" dataKey="solicitudes" stroke={COLORS.primary} strokeWidth={3} dot={{ fill: COLORS.primary, strokeWidth: 2, r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
