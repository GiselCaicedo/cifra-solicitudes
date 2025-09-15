'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import AdminReports from '@/components/admin/AdminReports'
import AdminUsers from '@/components/admin/AdminUsers'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface Reportes { resumen: { abiertas: number; enProceso: number; cerradas: number; total: number } }
interface Usuario { id: number; email: string; nombre: string; rol: { id: number; nombre: string } }
type ModuleKey = 'solicitudes' | 'admin' | 'perfil' | 'inicio'
type AdminTab = 'reportes' | 'usuarios'

export default function AdminPage() {
  const { user, logout, token } = useAuth()
  const router = useRouter()

  const [reportes, setReportes] = useState<Reportes | null>(null)
  const [infoUsuarios, setInfoUsuarios] = useState<Usuario[] | null>(null)
  const [roles, setRoles] = useState<{ id: number; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<AdminTab>('reportes')
  const [usersModalOpen, setUsersModalOpen] = useState(false) 

  const handleNavigate = (module: ModuleKey) => {
    if (module === 'admin') router.push('/admin')
    if (module === 'solicitudes') router.push('/solicitudes')
  }

  const handleLogoClick = () => router.push('/solicitudes')

  useEffect(() => {
    if (!user || !token) { router.push('/login'); return }
    if (user.rol.nombre !== 'admin') { router.push('/solicitudes'); return }
    loadAdminData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token])

  const loadAdminData = async () => {
    if (!token) return
    try {
      const [infoUsuariosRes, reportesRes, rolesRes] = await Promise.all([
        fetch('/api/admin', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/reportes/solicitudes', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/roles', { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      if (rolesRes.ok) setRoles((await rolesRes.json()).data)
      if (infoUsuariosRes.ok) setInfoUsuarios((await infoUsuariosRes.json()).data)
      if (reportesRes.ok) setReportes((await reportesRes.json()).data)
    } catch (e) {
      console.error('Error cargando datos admin:', e)
    } finally { setLoading(false) }
  }

  const handleUsuariosChange = (updatedUsuarios: Usuario[]) => setInfoUsuarios(updatedUsuarios)

  if (!user) return null
  if (user.rol.nombre !== 'admin') {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página</p>
          <button onClick={() => router.push('/solicitudes')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Volver
          </button>
        </div>
      </div>
    )
  }

  if (loading) return <LoadingSpinner message="Cargando panel de administración..." />

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader
        userName={user.nombre}
        userRole={user.rol.nombre}
        onLogout={logout}
        onNavigate={handleNavigate}
        onLogoClick={handleLogoClick}
        activeModule="admin"
        reserveRightSidebar={usersModalOpen}  
      />

      <main className={`container mx-auto px-4 py-8 ${usersModalOpen ? 'lg:pr-[480px]' : ''}`}>
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('reportes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'reportes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reportes
              </button>
              <button
                onClick={() => setActiveTab('usuarios')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'usuarios'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Usuarios
              </button>
            </nav>
          </div>
        </div>

        <div className="min-h-96">
          {activeTab === 'reportes' && reportes && (
            <div className="fade-in">
              <AdminReports reportes={reportes} />
            </div>
          )}

          {activeTab === 'usuarios' && infoUsuarios && (
            <div className="fade-in">
              <AdminUsers
                usuarios={infoUsuarios}
                roles={roles}
                onUsuariosChange={handleUsuariosChange}
                onToggleModal={setUsersModalOpen}   
              />
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
