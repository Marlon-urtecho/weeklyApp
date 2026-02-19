'use client'

import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'

interface RutaFormProps {
  rutaId?: number
  onSuccess?: () => void
  onCancel?: () => void
}

export const RutaForm: React.FC<RutaFormProps> = ({
  rutaId,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    codigo_ruta: '',
    nombre_ruta: '',
    zona: '',
    activo: true
  })
  const { showToast } = useToast()

  useEffect(() => {
    const cargarRuta = async () => {
      if (!rutaId) return
      try {
        const ruta = await apiClient.get(`/api/rutas/${rutaId}`)
        setFormData({
          codigo_ruta: ruta?.codigo_ruta || '',
          nombre_ruta: ruta?.nombre_ruta || '',
          zona: ruta?.zona || '',
          activo: Boolean(ruta?.activo)
        })
      } catch (error: any) {
        showToast(error.message || 'No se pudo cargar la ruta', 'error')
      }
    }

    cargarRuta()
  }, [rutaId, showToast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (rutaId) {
        await apiClient.put(`/api/rutas/${rutaId}`, formData)
        showToast('Ruta actualizada correctamente', 'success')
      } else {
        await apiClient.post('/api/rutas', formData)
        showToast('Ruta creada correctamente', 'success')
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
      <Input
        label="Código de Ruta"
        value={formData.codigo_ruta}
        onChange={(e) => setFormData({ ...formData, codigo_ruta: e.target.value })}
        placeholder="Ej: RUT-001"
        required
      />

      <Input
        label="Nombre de la Ruta"
        value={formData.nombre_ruta}
        onChange={(e) => setFormData({ ...formData, nombre_ruta: e.target.value })}
        placeholder="Ej: Ruta Norte"
        required
      />

      <Input
        label="Zona"
        value={formData.zona}
        onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
        placeholder="Ej: Zona 1-5"
      />

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="activo"
          checked={formData.activo}
          onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="activo" className="text-sm text-gray-700 dark:text-gray-300">
          Ruta activa
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {rutaId ? 'Actualizar' : 'Crear Ruta'}
        </Button>
      </div>
    </form>
  )
}
