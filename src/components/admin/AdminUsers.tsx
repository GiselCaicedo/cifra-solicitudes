'use client'

import { useEffect, useMemo, useState } from 'react'
import DataTable, { TableColumn } from 'react-data-table-component'
import { Plus, Edit, Trash2, X, Save, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface Rol { id: number; nombre: string }
interface Usuario {
  id: number; email: string; nombre: string;
  rol: { id: number; nombre: string }
  fechaCreacion?: string; ultimoAcceso?: string
}

interface AdminUsersProps {
  usuarios: Usuario[]
  roles: Rol[]
  onUsuariosChange?: (usuarios: Usuario[]) => void
  onToggleModal?: (open: boolean) => void
}

interface UserForm { id?: number; nombre: string; email: string; rolId: number; password?: string }

/* --- Hook: media query para detectar móvil --- */
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

export default function AdminUsers({
  usuarios: initialUsuarios,
  roles = [],
  onUsuariosChange,
  onToggleModal
}: AdminUsersProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios || [])
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<'all' | string>('all')

  const { token } = useAuth()

  const [formData, setFormData] = useState<UserForm>({
    nombre: '', email: '', rolId: roles.length > 0 ? roles[0].id : 1, password: ''
  })

  useEffect(() => {
    if (roles.length > 0 && formData.rolId === 1 && !roles.find(r => r.id === 1)) {
      setFormData(prev => ({ ...prev, rolId: roles[0].id }))
    }
  }, [roles, formData.rolId])

  const updateUsuarios = (newUsuarios: Usuario[]) => {
    setUsuarios(newUsuarios)
    onUsuariosChange?.(newUsuarios)
  }

  const getRolePill = (role: string) => {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border'
    switch (role.toLowerCase()) {
      case 'admin': return base + ' bg-purple-50 text-purple-700 border-purple-200'
      case 'soporte': return base + ' bg-blue-50 text-blue-700 border-blue-200'
      case 'cliente': return base + ' bg-gray-50 text-gray-700 border-gray-200'
      default: return base + ' bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const resetForm = () => {
    setFormData({ nombre: '', email: '', rolId: roles.length > 0 ? roles[0].id : 1, password: '' })
    setEditingUser(null)
  }

  const openCreateModal = () => { resetForm(); setShowModal(true); onToggleModal?.(true) }
  const openEditModal = (u: Usuario) => {
    setFormData({ id: u.id, nombre: u.nombre, email: u.email, rolId: u.rol.id, password: '' })
    setEditingUser(u); setShowModal(true); onToggleModal?.(true)
  }
  const closeModal = () => { setShowModal(false); resetForm(); onToggleModal?.(false) }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: name === 'rolId' ? parseInt(value) : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const url = editingUser ? `/api/admin/usuarios/${editingUser.id}` : '/api/admin/'
      const method = editingUser ? 'PUT' : 'POST'
      const submitData = editingUser && !formData.password ? { ...formData, password: undefined } : formData
      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(submitData),
      })
      const result = await response.json()
      if (result.ok) {
        if (editingUser) {
          const updated = usuarios.map(u =>
            u.id === editingUser.id ? { ...result.data, rol: roles.find(r => r.id === result.data.rolId) || u.rol } : u
          )
          updateUsuarios(updated)
        } else {
          const newUser = { ...result.data, rol: roles.find(r => r.id === result.data.rolId) || roles[0] }
          updateUsuarios([...(usuarios || []), newUser])
        }
        closeModal()
      } else alert(result.error || 'Error al guardar usuario')
    } catch (err) {
      console.error('Error:', err); alert('Error al guardar usuario')
    } finally { setLoading(false) }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.ok) updateUsuarios((usuarios || []).filter(u => u.id !== userId))
      else alert(result.error || 'Error al eliminar usuario')
    } catch (err) { console.error('Error:', err); alert('Error al eliminar usuario') }
    finally { setLoading(false) }
  }

  // Filtro simple (cliente)
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return (usuarios || []).filter(u => {
      const matchesQ = !q || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      const matchesRole = selectedRole === 'all' || u.rol.nombre === selectedRole
      return matchesQ && matchesRole
    })
  }, [usuarios, searchTerm, selectedRole])

  /* --- Responsive columns --- */
  const isMobile = useMediaQuery('(max-width: 640px)')

  const RolePill = ({ nombre }: { nombre: string }) => (
    <span className={getRolePill(nombre)}>
      {nombre.charAt(0).toUpperCase() + nombre.slice(1)}
    </span>
  )

  const desktopColumns: TableColumn<Usuario>[] = [
    {
      name: 'ID',
      selector: row => row.id,
      sortable: true,
      width: '90px',
      cell: row => <span className="font-medium text-gray-900">#{row.id}</span>,
    },
    {
      name: 'Nombre',
      selector: row => row.nombre,
      sortable: true,
      grow: 2,
      wrap: true,
    },
    {
      name: 'Email',
      selector: row => row.email,
      sortable: true,
      grow: 2,
      wrap: true,
      cell: row => <span className="text-gray-800 break-words">{row.email}</span>,
    },
    {
      name: 'Rol',
      selector: row => row.rol.nombre,
      sortable: true,
      cell: row => <RolePill nombre={row.rol.nombre} />,
    },
    {
      name: 'Acciones',
      cell: row => (
        <div className="flex items-center justify-end gap-2 w-full overflow-visible">
          <button onClick={() => openEditModal(row)} className="inline-flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar usuario">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(row.id)} className="inline-flex items-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar usuario">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
    }
  ]

  const mobileColumns: TableColumn<Usuario>[] = [
    {
      name: 'ID',
      selector: row => row.id,
      width: '70px',
      cell: row => <span className="font-medium text-gray-900">#{row.id}</span>,
    },
    {
      name: 'Nombre',
      selector: row => row.nombre,
      grow: 3,
      wrap: true,
    },
    {
      name: 'Acciones',
      cell: row => (
        <div className="flex items-center justify-end gap-2 w-full">
          <button onClick={() => openEditModal(row)} className="p-2 text-blue-600" title="Editar"><Edit className="h-4 w-4" /></button>
          <button onClick={() => handleDelete(row.id)} className="p-2 text-red-600" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
      ignoreRowClick: true,
    }
  ]

  const columns = isMobile ? mobileColumns : desktopColumns

  // Expandible (para móvil: muestra Email y Rol)
  const Expandible = ({ data }: { data: Usuario }) => (
    <div className="p-3 text-sm space-y-2">
      <div><span className="text-gray-500">Email:</span> <span className="break-words">{data.email}</span></div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500">Rol:</span> <RolePill nombre={data.rol.nombre} />
      </div>
    </div>
  )

  // Estilos: permitir wrap en celdas
  const customStyles = {
    headCells: { style: { textTransform: 'uppercase', fontSize: 12, color: '#6b7280' } },
    rows: { style: { minHeight: '52px' } },
    cells: { style: { fontSize: 14, whiteSpace: 'normal' as const, lineHeight: '1.25rem' } },
    pagination: { style: { fontSize: 13 } },
  }

  if (!roles || roles.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex justify-center items-center">
          <div className="text-gray-500">Cargando roles...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header + filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Gestión de Usuarios</h2>
            <p className="text-sm text-gray-600">Administra los usuarios del sistema</p>
          </div>
          {isMobile ? (
            <button
              onClick={openCreateModal}
              aria-label="Nuevo usuario"
              title="Nuevo usuario"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </button>
          )}

        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none"><path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" /></svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o email"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder:text-gray-600 focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>
          <div className="sm:w-56">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:border-gray-400"
            >
              <option value="all">Todos los roles</option>
              {roles.map(r => (
                <option key={r.id} value={r.nombre}>{r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Fallback: si algo se desborda, scroll horizontal */}
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filtered}
            customStyles={customStyles}
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
              <div className="text-gray-500 py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No se encontraron usuarios</p>
                <p className="text-sm">Ajusta los filtros o crea un usuario</p>
              </div>
            }
          />
        </div>
      </div>

      {/* Modal lateral */}
      {showModal && (
        <>
          <div className="modal-overlay lg:hidden" onClick={closeModal} aria-hidden="true"></div>
          <div className={`modal-sidebar ${showModal ? 'modal-sidebar-open' : ''}`} role="dialog" aria-modal="true">
            <div className="h-full border-l flex flex-col bg-white">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                <h3 className="text-lg font-semibold text-gray-900">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"><X className="h-5 w-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto bg-white">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
                    <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange}
                      required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder:text-gray-600 focus:outline-none focus:border-gray-400"
                      placeholder="Nombre completo" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder:text-gray-600 focus:outline-none focus:border-gray-400"
                      placeholder="usuario@ejemplo.com" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña {editingUser && <span className="text-gray-500 font-normal">(opcional para mantener actual)</span>}
                    </label>
                    <input type="password" name="password" value={formData.password} onChange={handleInputChange} required={!editingUser}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder:text-gray-600 focus:outline-none focus:border-gray-400"
                      placeholder={editingUser ? 'Dejar vacío para mantener' : 'Mínimo 6 caracteres'} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rol del usuario</label>
                    <select name="rolId" value={formData.rolId} onChange={handleInputChange} required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:border-gray-400">
                      {roles.map(rol => <option key={rol.id} value={rol.id}>{rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1)}</option>)}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
                    <button type="submit" disabled={loading} className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors">
                      <Save className="h-4 w-4 mr-2" /> {loading ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear Usuario'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .modal-overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,.4); z-index: 50; backdrop-filter: blur(2px); }
        .modal-sidebar { position: fixed; top: 0; right: 0; bottom: 0; width: 480px; max-width: 90vw; background: white; margin-left: 10px; z-index: 51; transform: translateX(100%); transition: transform .3s cubic-bezier(.4,0,.2,1); }
        .modal-sidebar-open { transform: translateX(0); }
        .modal-sidebar .overflow-y-auto { scrollbar-width: thin; scrollbar-color: #cbd5e0 #f7fafc; }
        .modal-sidebar .overflow-y-auto::-webkit-scrollbar { width: 6px; }
        .modal-sidebar .overflow-y-auto::-webkit-scrollbar-track { background: #f7fafc; }
        .modal-sidebar .overflow-y-auto::-webkit-scrollbar-thumb { background-color: #cbd5e0; border-radius: 3px; }
        @media (max-width: 640px) { .modal-sidebar { width: 100vw; max-width: 100vw; } }
        /* Placeholder con mejor contraste global */
        :global(input::placeholder) { color: #4b5563; }
        /* Mejora legibilidad de celdas largas (emails) */
        :global(.rdt_TableCell) { word-break: break-word; }
      `}</style>
    </>
  )
}
