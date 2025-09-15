'use client'

import React from 'react'

interface ReportData {
  resumen: {
    abiertas: number
    enProceso: number
    cerradas: number
    total: number
  }
  sinAsignar?: number
  solicitudesHoy?: number
  usuariosPorRol?: Array<{
    rolId: number
    rolNombre: string
    cantidad: number
  }>
}

interface AdminReportsProps {
  reportes: ReportData
  userRole?: 'admin' | 'soporte'
}

// Iconos SVG
const Icons = {
  Open: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  InProgress: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Closed: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Total: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Unassigned: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Today: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Users: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  )
}

export default function AdminReports({ reportes, userRole = 'admin' }: AdminReportsProps) {
  const total = reportes.resumen.total
  const getPercentage = (value: number) => total > 0 ? Math.round((value / total) * 100) : 0

  const mainMetrics = [
    {
      label: 'Solicitudes Abiertas',
      value: reportes.resumen.abiertas,
      percentage: getPercentage(reportes.resumen.abiertas),
      icon: Icons.Open,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      status: 'Requieren Atención'
    },
    {
      label: 'En Proceso',
      value: reportes.resumen.enProceso,
      percentage: getPercentage(reportes.resumen.enProceso),
      icon: Icons.InProgress,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      status: 'Siendo Atendidas'
    },
    {
      label: 'Solicitudes Cerradas',
      value: reportes.resumen.cerradas,
      percentage: getPercentage(reportes.resumen.cerradas),
      icon: Icons.Closed,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      status: 'Completadas'
    },
    {
      label: 'Total de Solicitudes',
      value: reportes.resumen.total,
      percentage: 100,
      icon: Icons.Total,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      status: 'Sistema General'
    }
  ]

  const adminMetrics = userRole === 'admin' ? [
    {
      label: 'Sin Asignar',
      value: reportes.sinAsignar || 0,
      icon: Icons.Unassigned,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      status: 'Pendientes de Asignación'
    },
    {
      label: 'Solicitudes Hoy',
      value: reportes.solicitudesHoy || 0,
      icon: Icons.Today,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      status: 'Actividad del Día'
    }
  ] : []

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Panel de Reportes</h2>
            <p className="text-gray-600 mt-1">
              {userRole === 'admin' ? 'Vista completa del sistema' : 'Sus solicitudes asignadas'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Actualizado</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {mainMetrics.map((metric) => (
          <div key={metric.label} className="bg-white rounded-lg border duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div className={`${metric.bgColor} ${metric.color} p-2 rounded-lg mr-3`}>
                      <metric.icon />
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      {metric.label}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-gray-900">
                      {metric.value.toLocaleString()}
                    </p>

                    {/* Barra de porcentaje con bg-current */}
                    {metric.percentage < 100 && (
                      <div className={`${metric.color}`}>
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 overflow-hidden">
                            <div
                              className="h-2 rounded-full bg-current"
                              style={{ width: `${metric.percentage}%` }}
                              role="progressbar"
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={metric.percentage}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-600">
                            {metric.percentage}%
                          </span>
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-gray-500">
                      {metric.status}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* métricas adicionales solo para admin */}
      {userRole === 'admin' && adminMetrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminMetrics.map((metric) => (
            <div key={metric.label}
                 className={`bg-white rounded-lg border ${metric.borderColor} duration-200`}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`${metric.bgColor} ${metric.color} p-3 rounded-lg mr-4`}>
                      <metric.icon />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {metric.value.toLocaleString()}
                      </h3>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        {metric.label}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{metric.status}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
