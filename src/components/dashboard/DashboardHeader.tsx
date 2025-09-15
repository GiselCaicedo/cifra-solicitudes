'use client'

import { Settings } from 'lucide-react'
import Image from 'next/image'

interface DashboardHeaderProps {
  userName: string
  userRole: string
  onLogout: () => void
  onNavigate?: (module: string) => void
  onLogoClick?: () => void 
  activeModule?: string
  /** Reserva espacio a la derecha (para sidebar de 480px) en lg+ */
  reserveRightSidebar?: boolean
}

export default function DashboardHeader({ 
  userName, 
  userRole, 
  onLogout, 
  onNavigate,
  onLogoClick,
  activeModule,
  reserveRightSidebar = false,
}: DashboardHeaderProps) {

  const allNavigationItems = [
    {
      id: 'solicitudes',
      label: 'Solicitudes',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'admin',
      label: 'Administración',
      icon: <Settings size={18} />,
      requiresAdmin: true
    }
  ]

  const navigationItems = allNavigationItems.filter(item => 
    !item.requiresAdmin || userRole === 'admin'
  )

  return (
    <header className="bg-white/95 border-b border-gray-200 w-full">
      {/* 👇 reservamos hueco derecho cuando hay sidebar abierto */}
      <div className={`w-full px-4 sm:px-6 lg:px-8 ${reserveRightSidebar ? 'lg:pr-[500px]' : ''}`}>
        <div className="flex items-center justify-between py-4 gap-4 lg:gap-8 w-full">
          
          <div 
            className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onLogoClick}
          >
            <Image
              src="/assets/img/logo.png"
              alt="Logo"
              width={100}
              height={100}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-slate-600 hidden sm:inline">Bienvenido,</span>
              <span className="font-medium text-slate-800 truncate">{userName}</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                {userRole}
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center justify-end flex-1 max-w-2xl">
            <div className="flex items-center space-x-4 xl:space-x-6">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={`
                    group flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 min-w-fit
                    ${activeModule === item.id 
                      ? ' text-green-700 border border-green-200' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  <span className={`transition-colors ${
                    activeModule === item.id ? 'text-green-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="whitespace-nowrap">{item.label}</span>
                  {activeModule === item.id && (
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  )}
                </button>
              ))}
            </div>
          </nav>

          <div className="flex items-center space-x-3 lg:space-x-4 flex-shrink-0">
           

            <button
              onClick={onLogout}
              className="group relative inline-flex items-center px-3 sm:px-4 py-1.5 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 transform hover:scale-105"
            >
              <svg className="w-4 h-4 mr-0 sm:mr-2 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>

        <div className="lg:hidden border-t border-gray-100">
          <nav className="flex items-center justify-around py-2 space-x-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                className={`
                  group flex flex-col items-center space-y-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 min-w-0 flex-1
                  ${activeModule === item.id 
                    ? 'bg-green-50 text-green-700' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                <span className={`transition-colors ${
                  activeModule === item.id ? 'text-green-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}>
                  {item.icon}
                </span>
                <span className="truncate text-center leading-tight">{item.label}</span>
                {activeModule === item.id && (
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
