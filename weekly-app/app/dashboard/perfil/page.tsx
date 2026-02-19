'use client'

import { useState, useEffect } from 'react'
import LayoutContainer from '@/components/layout/LayoutContainer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'

interface UserProfile {
  id_usuario: number
  nombre: string
  username: string
  activo: boolean
  created_at: string
  updated_at?: string
  roles?: Array<{
    id_rol: number
    nombre_rol: string
  }>
  vendedor?: {
    id_vendedor: number
    nombre: string
    telefono: string
    updated_at?: string
  }
}

export default function PerfilPage() {
  const { token, updateUser } = useAuth()
  const { showToast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [cambiandoPassword, setCambiandoPassword] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    username: '',
    telefono_vendedor: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordChangedAt, setPasswordChangedAt] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      cargarPerfil()
    }
  }, [token])

  const cargarPerfil = async () => {
    try {
      setLoading(true)
      // Asumiendo que tienes un endpoint para obtener el perfil del usuario actual
      const data = await apiClient.get('/api/usuarios/perfil')
      setProfile(data)
      setFormData({
        nombre: data.nombre || '',
        username: data.username || '',
        telefono_vendedor: data.vendedor?.telefono || ''
      })
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const updated = await apiClient.put('/api/usuarios/perfil', formData)
      setProfile(updated)
      setFormData({
        nombre: updated.nombre || '',
        username: updated.username || '',
        telefono_vendedor: updated.vendedor?.telefono || ''
      })
      updateUser({
        nombre: updated.nombre,
        username: updated.username,
        roles: updated.roles
      })
      showToast('Perfil actualizado correctamente', 'success')
      setEditando(false)
    } catch (error: any) {
      showToast(error.message, 'error')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error')
      return
    }

    try {
      await apiClient.post('/api/usuarios/perfil/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      showToast('Contraseña cambiada correctamente', 'success')
      setPasswordChangedAt(new Date().toISOString())
      setCambiandoPassword(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      showToast(error.message, 'error')
    }
  }

  if (loading) {
    return (
      <LayoutContainer>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LayoutContainer>
    )
  }

  const formatDateTime = (value?: string | null) => {
    if (!value) return '-'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '-'
    return parsed.toLocaleString()
  }

  const actividades = [
    profile?.created_at
      ? {
          id: 'created',
          title: 'Cuenta creada',
          detail: 'Alta de usuario en el sistema',
          date: profile.created_at
        }
      : null,
    profile?.updated_at
      ? {
          id: 'updated',
          title: 'Perfil actualizado',
          detail: 'Última actualización de datos de usuario',
          date: profile.updated_at
        }
      : null,
    profile?.vendedor?.updated_at
      ? {
          id: 'vendedor-updated',
          title: 'Datos de vendedor actualizados',
          detail: 'Actualización de información comercial',
          date: profile.vendedor.updated_at
        }
      : null,
    passwordChangedAt
      ? {
          id: 'password-updated',
          title: 'Contraseña cambiada',
          detail: 'Cambio realizado en esta sesión',
          date: passwordChangedAt
        }
      : null
  ]
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <LayoutContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Mi Perfil
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Gestiona tu información personal y configuración de cuenta
            </p>
          </div>
          {!editando && (
            <Button onClick={() => setEditando(true)} className="w-full sm:w-auto">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar Perfil
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Información básica */}
          <div className="lg:col-span-1 space-y-6">
            {/* Avatar y datos principales */}
            <Card>
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-4xl font-bold mb-4">
                  {profile?.nombre?.charAt(0) || 'U'}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {profile?.nombre}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  @{profile?.username}
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-3">
                  {profile?.roles?.map((rol) => (
                    <span
                      key={rol.id_rol}
                      className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs font-medium"
                    >
                      {rol.nombre_rol}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            {/* Información de cuenta */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Información de Cuenta
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Estado</span>
                  <span className={`text-sm font-medium ${
                    profile?.activo ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {profile?.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Miembro desde</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">ID Usuario</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white">
                    #{profile?.id_usuario}
                  </span>
                </div>
              </div>
            </Card>

            {/* Información de vendedor (si aplica) */}
            {profile?.vendedor && (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Información de Vendedor
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">ID Vendedor</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      #{profile.vendedor.id_vendedor}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Nombre</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {profile.vendedor.nombre}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Teléfono</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {profile.vendedor.telefono}
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Columna derecha - Formularios de edición */}
          <div className="lg:col-span-2 space-y-6">
            {/* Formulario de edición de perfil */}
            {editando ? (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Editar Información Personal
                </h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <Input
                    label="Nombre completo"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Tu nombre completo"
                    required
                  />
                  <Input
                    label="Usuario"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="usuario"
                    required
                  />
                  {profile?.vendedor && (
                    <Input
                      label="Teléfono de vendedor"
                      value={formData.telefono_vendedor}
                      onChange={(e) => setFormData({ ...formData, telefono_vendedor: e.target.value })}
                      placeholder="1234-5678"
                    />
                  )}
                  <div className="flex gap-3 pt-4">
                    <Button type="submit">
                      Guardar Cambios
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setEditando(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Card>
            ) : (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Información Personal
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Nombre completo
                      </label>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {profile?.nombre || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Nombre de usuario
                      </label>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        @{profile?.username}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Tipo de usuario
                      </label>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {profile?.vendedor ? 'Vendedor' : 'Usuario interno'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Teléfono
                      </label>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {profile?.vendedor?.telefono || 'No especificado'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Cambiar contraseña */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Seguridad
              </h3>
              
              {!cambiandoPassword ? (
                <Button variant="secondary" onClick={() => setCambiandoPassword(true)}>
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Cambiar Contraseña
                </Button>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <Input
                    label="Contraseña actual"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                  <Input
                    label="Nueva contraseña"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                  <Input
                    label="Confirmar nueva contraseña"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                  <div className="flex gap-3 pt-4">
                    <Button type="submit">
                      Cambiar Contraseña
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => {
                        setCambiandoPassword(false)
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        })
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
            </Card>

            {/* Actividad reciente */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Actividad Reciente
              </h3>
              {actividades.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sin actividad reciente disponible.
                </p>
              ) : (
                <div className="space-y-3">
                  {actividades.map((act: any, index) => (
                    <div
                      key={act.id}
                      className={`flex items-center justify-between py-2 ${
                        index < actividades.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{act.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{act.detail}</p>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{formatDateTime(act.date)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </LayoutContainer>
  )
}
