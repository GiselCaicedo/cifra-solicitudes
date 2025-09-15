'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

import DashboardHeader from '@/components/dashboard/DashboardHeader'
import SolicitudesList from '@/components/solicitudes/SolicitudesList'
import CreateSolicitudModal from '@/components/solicitudes/CreateSolicitudModal'
import ManageSolicitudModal from '@/components/solicitudes/ManageSolicitudModal'
import HistorialSolicitudModal from '@/components/solicitudes/HistorialSolicitudModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

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

interface Usuario {
  id: number
  email: string
  nombre: string
  rol: {
    id: number
    nombre: 'admin' | 'soporte' | 'cliente' | string
  }
}

type ModuleKey = 'solicitudes' | 'admin' | 'perfil' | 'inicio'

export default function DashboardPage() {
  const { user, logout, token } = useAuth()
  const router = useRouter()

  const handleNavigate = (module: ModuleKey) => {
    switch (module) {
      case 'admin':
        if (user?.rol.nombre === 'admin') {
          router.push('/admin')
        }
        break
      case 'solicitudes':
        router.push('/solicitudes')
        break
      default:
        router.push('/solicitudes')
    }
  }

  const handleLogoClick = () => {
    router.push('/solicitudes')
  }

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [soportes, setSoportes] = useState<Usuario[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null)

  // Estados para el historial
  const [historialSolicitud, setHistorialSolicitud] = useState<Solicitud | null>(null)
  const [historialData, setHistorialData] = useState<HistorialItem[]>([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)

  useEffect(() => {
    if (!user || !token) {
      router.push('/login')
      return
    }
    loadData()
  }, [user, token, router])

  const loadData = async () => {
    if (!token) return
    try {
      const solicitudesRes = await fetch('/api/solicitudes', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (solicitudesRes.ok) {
        const solicitudesData = await solicitudesRes.json()
        setSolicitudes(solicitudesData.data)
      }
      if (user?.rol.nombre === 'admin' || user?.rol.nombre === 'soporte') {
        const soportesRes = await fetch('/api/admin', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (soportesRes.ok) {
          const soportesData = await soportesRes.json()
          setSoportes(soportesData.data.filter((u: Usuario) => u.rol.nombre === 'soporte'))
        }
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSolicitud = async (titulo: string, descripcion: string) => {
    if (!token) return
    const response = await fetch('/api/solicitudes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ titulo, descripcion })
    })
    if (!response.ok) throw new Error('Error al crear la solicitud')
    await loadData()
  }

  const handleUpdateSolicitud = async (
    id: number,
    data: { estado?: 'abierta' | 'en_proceso' | 'cerrada'; respuesta?: string; soporteId?: number }
  ) => {
    if (!token) return
    const response = await fetch(`/api/solicitudes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Error al actualizar la solicitud')
    await loadData()
  }

  const handleGestionarSolicitud = (solicitud: Solicitud) => setSelectedSolicitud(solicitud)

  const handleVerHistorial = async (id: number) => {
    const solicitud = solicitudes.find(s => s.id === id)
    if (!solicitud || !token) return

    setHistorialSolicitud(solicitud)
    setLoadingHistorial(true)
    setHistorialData([]) // Limpiar datos anteriores

    try {
      const response = await fetch(`/api/solicitudes/${id}/historial`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const historialResponse = await response.json()
        setHistorialData(historialResponse.data || [])
      } else {
    
      }
    } catch (error) {
      console.error('Error cargando historial:', error)
      // Datos de ejemplo en caso de error
      setHistorialData([
        {
          id: 1,
          accion: 'creada',
          descripcion: 'Solicitud creada por el cliente',
          creadoEn: solicitud.creadoEn,
          usuario: { nombre: solicitud.cliente.nombre, email: solicitud.cliente.email, rol: 'cliente' }
        }
      ])
    } finally {
      setLoadingHistorial(false)
    }
  }

  const handleCloseHistorial = () => {
    setHistorialSolicitud(null)
    setHistorialData([])
  }

  if (!user) return null
  if (loading) return <LoadingSpinner message="Cargando dashboard..." />

  return (
    <div className={`min-h-screen bg-gray-100 ${selectedSolicitud || historialSolicitud ? 'lg:pr-96' : ''}`}>
      <DashboardHeader
        userName={user.nombre}
        userRole={user.rol.nombre}
        onLogout={logout}
        onNavigate={handleNavigate}
        onLogoClick={handleLogoClick}
        activeModule="solicitudes"
      />

      <main>
        <SolicitudesList
          solicitudes={solicitudes}
          userRole={user.rol.nombre}
          onGestionar={handleGestionarSolicitud}
          onNuevaSolicitud={() => setShowCreateForm(true)}
          onVerHistorial={handleVerHistorial}
        />
      </main>

      <CreateSolicitudModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateSolicitud}
      />

      <ManageSolicitudModal
        solicitud={selectedSolicitud}
        soporteUsers={soportes}
        currentUser={user.rol.nombre}
        onClose={() => setSelectedSolicitud(null)}
        onSubmit={handleUpdateSolicitud}
      />

      <HistorialSolicitudModal
        solicitud={historialSolicitud}
        historial={historialData}
        onClose={handleCloseHistorial}
        isLoading={loadingHistorial}
      />
    </div>
  )
}