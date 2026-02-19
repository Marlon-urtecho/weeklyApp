'use client'

import { useEffect, useMemo, useState } from 'react'
import LayoutContainer from '@/components/layout/LayoutContainer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'
import { UsuarioForm } from '@/components/forms/UsuarioForm'
import { useAuth } from '@/contexts/AuthContext'

interface Rol {
  id_rol: number
  nombre_rol: string
}

interface Usuario {
  id_usuario: number
  nombre: string
  username: string
  activo: boolean
  roles?: Rol[]
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const { showToast } = useToast()
  const { user } = useAuth()

  const roleNames = (user?.roles || []).map((r) => (r.nombre_rol || '').toUpperCase().trim())
  const canManageUsers = roleNames.some((r) => r.includes('ADMIN'))

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const cargarUsuarios = async () => {
    try {
      setLoading(true)
      const data = await apiClient.get('/api/usuarios')
      setUsuarios(Array.isArray(data) ? data : [])
    } catch (error: any) {
      showToast(error.message || 'No se pudieron cargar los usuarios', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (usuarioItem: Usuario) => {
    try {
      await apiClient.put(`/api/usuarios/${usuarioItem.id_usuario}`, {
        activo: !usuarioItem.activo
      })
      showToast(`Usuario ${!usuarioItem.activo ? 'activado' : 'desactivado'} correctamente`, 'success')
      cargarUsuarios()
    } catch (error: any) {
      showToast(error.message || 'No se pudo actualizar el usuario', 'error')
    }
  }

  const filteredUsuarios = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return usuarios.filter((u) =>
      (u.nombre || '').toLowerCase().includes(term) ||
      (u.username || '').toLowerCase().includes(term) ||
      (u.roles || []).some((r) => (r.nombre_rol || '').toLowerCase().includes(term))
    )
  }, [usuarios, searchTerm])

  const columns = [
    {
      key: 'usuario',
      header: 'Usuario',
      cell: (item: Usuario) => (
        <div>
          <p className="font-medium">{item.nombre}</p>
          <p className="text-xs text-gray-500">@{item.username}</p>
        </div>
      )
    },
    {
      key: 'roles',
      header: 'Roles',
      cell: (item: Usuario) => (
        <div className="flex flex-wrap gap-1">
          {(item.roles || []).length === 0 && <Badge variant="secondary">Sin rol</Badge>}
          {(item.roles || []).map((r) => (
            <Badge key={`${item.id_usuario}-${r.id_rol}`} variant="info">
              {r.nombre_rol}
            </Badge>
          ))}
        </div>
      )
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (item: Usuario) => (
        <Badge variant={item.activo ? 'success' : 'error'}>
          {item.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'acciones',
      header: 'Acciones',
      cell: (item: Usuario) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setUsuarioEditando(item)
              setModalAbierto(true)
            }}
            disabled={!canManageUsers}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant={item.activo ? 'danger' : 'success'}
            onClick={() => handleToggleStatus(item)}
            disabled={!canManageUsers}
          >
            {item.activo ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      )
    }
  ]

  return (
    <LayoutContainer>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Gestión de cuentas y roles para pruebas de permisos
            </p>
          </div>
          <Button
            onClick={() => {
              setUsuarioEditando(null)
              setModalAbierto(true)
            }}
            disabled={!canManageUsers}
          >
            Nuevo Usuario
          </Button>
        </div>

        {!canManageUsers && (
          <Card>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Solo el rol ADMIN puede crear o editar usuarios.
            </p>
          </Card>
        )}

        <Card>
          <Input
            placeholder="Buscar por nombre, usuario o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Card>

        <Card>
          <Table
            data={filteredUsuarios}
            columns={columns}
            loading={loading}
            emptyMessage="No hay usuarios registrados"
          />
        </Card>

        <Modal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          title={usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}
          size="lg"
        >
          <UsuarioForm
            usuarioId={usuarioEditando?.id_usuario}
            onSuccess={() => {
              setModalAbierto(false)
              cargarUsuarios()
            }}
            onCancel={() => setModalAbierto(false)}
          />
        </Modal>
      </div>
    </LayoutContainer>
  )
}
