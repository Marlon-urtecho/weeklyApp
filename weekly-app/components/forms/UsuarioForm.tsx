'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'

interface UsuarioFormProps {
  usuarioId?: number
  onSuccess?: () => void
  onCancel?: () => void
}

export const UsuarioForm: React.FC<UsuarioFormProps> = ({
  usuarioId,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false)
  const [cargandoRoles, setCargandoRoles] = useState(true)
  const [roles, setRoles] = useState<Array<{ value: number; label: string }>>([])
  const [formData, setFormData] = useState({
    nombre: '',
    username: '',
    password: '',
    confirmPassword: '',
    activo: true,
    roles: [] as number[]
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { showToast } = useToast()

  useEffect(() => {
    cargarRoles()
    if (usuarioId) {
      cargarUsuario()
    }
  }, [usuarioId])

  const cargarRoles = async () => {
    try {
      const data = await apiClient.get('/api/roles')
      const rows = Array.isArray(data) ? data : []
      const unique = rows.filter(
        (r: any, i: number, arr: any[]) =>
          arr.findIndex((x: any) => String(x?.nombre_rol || '').toUpperCase() === String(r?.nombre_rol || '').toUpperCase()) === i
      )
      setRoles(unique.map((r: any) => ({
        value: r.id_rol,
        label: r.nombre_rol
      })))
    } catch (error: any) {
      showToast('Error al cargar roles', 'error')
    } finally {
      setCargandoRoles(false)
    }
  }

  const cargarUsuario = async () => {
    try {
      const data = await apiClient.get(`/api/usuarios/${usuarioId}`)
      setFormData({
        nombre: data.nombre,
        username: data.username,
        password: '',
        confirmPassword: '',
        activo: data.activo,
        roles: data.roles?.map((r: any) => r.id_rol) || []
      })
    } catch (error: any) {
      showToast(error.message, 'error')
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }

    if (!formData.username.trim()) {
      newErrors.username = 'El username es requerido'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Mínimo 3 caracteres'
    }

    if (!usuarioId) {
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida'
      } else if (formData.password.length < 6) {
        newErrors.password = 'Mínimo 6 caracteres'
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)

    try {
      const dataToSend = {
        nombre: formData.nombre,
        username: formData.username,
        activo: formData.activo,
        roles: formData.roles
      }

      if (!usuarioId) {
        Object.assign(dataToSend, { password: formData.password })
      }

      if (usuarioId) {
        await apiClient.put(`/api/usuarios/${usuarioId}`, dataToSend)
        showToast('Usuario actualizado correctamente', 'success')
      } else {
        await apiClient.post('/api/usuarios', dataToSend)
        showToast('Usuario creado correctamente', 'success')
      }
      onSuccess?.()
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (roleId: number) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleId)
        ? prev.roles.filter(id => id !== roleId)
        : [...prev.roles, roleId]
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre Completo"
        value={formData.nombre}
        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
        placeholder="Ej: Juan Pérez"
        error={errors.nombre}
        required
      />

      <Input
        label="Username"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        placeholder="Ej: jperez"
        error={errors.username}
        required
      />

      {!usuarioId && (
        <>
          <Input
            label="Contraseña"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            error={errors.password}
            required
          />

          <Input
            label="Confirmar Contraseña"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="••••••••"
            error={errors.confirmPassword}
            required
          />
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Roles
        </label>
        <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
          {cargandoRoles ? (
            <p className="text-center text-gray-500">Cargando roles...</p>
          ) : (
            roles.map((role) => (
              <label key={role.value} className="flex items-center space-x-2 p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                <input
                  type="checkbox"
                  checked={formData.roles.includes(role.value)}
                  onChange={() => handleRoleChange(role.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{role.label}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="activo"
          checked={formData.activo}
          onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="activo" className="text-sm text-gray-700 dark:text-gray-300">
          Usuario activo
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {usuarioId ? 'Actualizar' : 'Crear Usuario'}
        </Button>
      </div>
    </form>
  )
}
