'use client'

import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'

interface CategoriaFormProps {
  categoriaId?: number
  onSuccess?: () => void
  onCancel?: () => void
}

export const CategoriaForm: React.FC<CategoriaFormProps> = ({
  categoriaId,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre_categoria: '',
    descripcion: '',
    activo: true
  })
  const { showToast } = useToast()

  useEffect(() => {
    const cargarCategoria = async () => {
      if (!categoriaId) return
      try {
        const categoria = await apiClient.get(`/api/categorias/${categoriaId}`)
        setFormData({
          nombre_categoria: categoria?.nombre_categoria || '',
          descripcion: categoria?.descripcion || '',
          activo: Boolean(categoria?.activo)
        })
      } catch (error: any) {
        showToast(error.message || 'No se pudo cargar la categoría', 'error')
      }
    }

    cargarCategoria()
  }, [categoriaId, showToast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        nombre_categoria: formData.nombre_categoria.trim(),
        descripcion: formData.descripcion.trim() ? formData.descripcion.trim() : undefined,
        activo: formData.activo
      }

      if (categoriaId) {
        await apiClient.put(`/api/categorias/${categoriaId}`, payload)
        showToast('Categoría actualizada correctamente', 'success')
      } else {
        await apiClient.post('/api/categorias', payload)
        showToast('Categoría creada correctamente', 'success')
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
        label="Nombre de la Categoría"
        value={formData.nombre_categoria}
        onChange={(e) => setFormData({ ...formData, nombre_categoria: e.target.value })}
        placeholder="Ej: Electrónicos"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Descripción
        </label>
        <textarea
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Descripción de la categoría..."
        />
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
          Categoría activa
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {categoriaId ? 'Actualizar' : 'Crear Categoría'}
        </Button>
      </div>
    </form>
  )
}
