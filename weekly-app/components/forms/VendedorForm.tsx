'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'

interface VendedorFormProps {
  vendedorId?: number
  onSuccess?: () => void
  onCancel?: () => void
}

export const VendedorForm: React.FC<VendedorFormProps> = ({
  vendedorId,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [vendedores, setVendedores] = useState<any[]>([])
  const [formData, setFormData] = useState({
    id_usuario: '',
    nombre: '',
    telefono: '',
    activo: true
  })
  const { showToast } = useToast()

  useEffect(() => {
    const cargarData = async () => {
      try {
        setLoadingData(true)
        const [usuariosResult, vendedoresResult, vendedorResult] = await Promise.allSettled([
          apiClient.get('/api/usuarios'),
          apiClient.get('/api/vendedores'),
          vendedorId ? apiClient.get(`/api/vendedores/${vendedorId}`) : Promise.resolve(null)
        ])

        const usuariosLista =
          usuariosResult.status === 'fulfilled' && Array.isArray(usuariosResult.value)
            ? usuariosResult.value
            : []
        const vendedoresLista =
          vendedoresResult.status === 'fulfilled' && Array.isArray(vendedoresResult.value)
            ? vendedoresResult.value
            : []
        setUsuarios(usuariosLista)
        setVendedores(vendedoresLista)

        if (vendedorId && vendedorResult.status === 'fulfilled' && vendedorResult.value) {
          const vendedor = vendedorResult.value
          setFormData({
            id_usuario: String(vendedor?.id_usuario ?? ''),
            nombre: vendedor?.nombre ?? '',
            telefono: vendedor?.telefono ?? '',
            activo: Boolean(vendedor?.activo)
          })
        }
      } catch (error: any) {
        showToast(error.message || 'No se pudo cargar la información del formulario', 'error')
      } finally {
        setLoadingData(false)
      }
    }

    cargarData()
  }, [vendedorId, showToast])

  const usuariosOptions = useMemo(() => {
    const usados = new Set<number>(
      vendedores
        .filter((v) => !vendedorId || Number(v.id_vendedor) !== Number(vendedorId))
        .map((v) => Number(v.id_usuario))
        .filter((id) => !Number.isNaN(id))
    )

    const disponibles = usuarios
      .filter((u) => Boolean(u?.activo))
      .filter((u) => {
        const id = Number(u?.id_usuario)
        if (Number.isNaN(id)) return false
        return !usados.has(id) || id === Number(formData.id_usuario)
      })
      .map((u) => ({
        value: u.id_usuario,
        label: `${u.nombre} (@${u.username})`
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'))

    return [{ value: '', label: 'Sin usuario asociado' }, ...disponibles]
  }, [usuarios, vendedores, vendedorId, formData.id_usuario])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (vendedorId) {
        await apiClient.put(`/api/vendedores/${vendedorId}`, {
          nombre: formData.nombre.trim(),
          telefono: formData.telefono.trim(),
          activo: formData.activo
        })
        showToast('Vendedor actualizado correctamente', 'success')
      } else {
        await apiClient.post('/api/vendedores', {
          ...(formData.id_usuario ? { id_usuario: parseInt(formData.id_usuario, 10) } : {}),
          nombre: formData.nombre.trim(),
          telefono: formData.telefono.trim(),
          activo: formData.activo
        })
        showToast('Vendedor creado correctamente', 'success')
      }
      onSuccess?.()
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {loadingData && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando datos...</p>
      )}

      <Select
        label="Usuario"
        options={usuariosOptions}
        value={formData.id_usuario}
        onChange={(value) => setFormData({ ...formData, id_usuario: value.toString() })}
        placeholder="Seleccionar usuario"
        disabled={Boolean(vendedorId) || loadingData}
      />

      <Input
        label="Nombre del Vendedor"
        value={formData.nombre}
        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
        placeholder="Nombre completo"
        disabled={loadingData}
        required
      />

      <Input
        label="Teléfono"
        value={formData.telefono}
        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
        placeholder="Ej: 1234-5678"
        disabled={loadingData}
        required
      />

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="activo"
          checked={formData.activo}
          onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
          disabled={loadingData}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="activo" className="text-sm text-gray-700 dark:text-gray-300">
          Vendedor activo
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={loading} disabled={loadingData}>
          {vendedorId ? 'Actualizar' : 'Crear Vendedor'}
        </Button>
      </div>
    </form>
  )
}
