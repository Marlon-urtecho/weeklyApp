'use client'

import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'

interface ProductoFormProps {
  productoId?: number
  onSuccess?: () => void
  onCancel?: () => void
}

export const ProductoForm: React.FC<ProductoFormProps> = ({
  productoId,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [categoriasOptions, setCategoriasOptions] = useState<Array<{ value: number; label: string }>>([])
  const [formData, setFormData] = useState({
    nombre: '',
    id_categoria: '',
    precio_contado: '',
    precio_credito: ''
  })
  const { showToast } = useToast()

  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoId])

  const cargarDatos = async () => {
    try {
      setLoadingData(true)

      const [categorias, producto] = await Promise.all([
        apiClient.get('/api/categorias?activas=true'),
        productoId ? apiClient.get(`/api/productos/${productoId}`) : Promise.resolve(null)
      ])

      const opciones = (Array.isArray(categorias) ? categorias : []).map((cat: any) => ({
        value: cat.id_categoria,
        label: cat.nombre_categoria
      }))
      setCategoriasOptions(opciones)

      if (producto) {
        setFormData({
          nombre: producto.nombre ?? '',
          id_categoria: String(producto.id_categoria ?? producto.categorias?.id_categoria ?? ''),
          precio_contado: String(producto.precio_contado ?? ''),
          precio_credito: String(producto.precio_credito ?? '')
        })
      }
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const idCategoria = parseInt(formData.id_categoria)
      const precioContado = parseFloat(formData.precio_contado)
      const precioCredito = parseFloat(formData.precio_credito)

      if (Number.isNaN(idCategoria) || Number.isNaN(precioContado) || Number.isNaN(precioCredito)) {
        throw new Error('Completa todos los campos obligatorios')
      }

      const dataToSend = {
        nombre: formData.nombre.trim(),
        id_categoria: idCategoria,
        precio_contado: precioContado,
        precio_credito: precioCredito
      }

      if (productoId) {
        await apiClient.put(`/api/productos/${productoId}`, dataToSend)
        showToast('Producto actualizado correctamente', 'success')
      } else {
        await apiClient.post('/api/productos', dataToSend)
        showToast('Producto creado correctamente', 'success')
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
        label="Nombre del Producto"
        value={formData.nombre}
        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
        placeholder="Ej: Televisor 50 pulgadas"
        required
      />

      <Select
        label="Categoría"
        options={categoriasOptions}
        value={formData.id_categoria}
        onChange={(value) => setFormData({ ...formData, id_categoria: value.toString() })}
        placeholder="Seleccionar categoría"
        required
        disabled={loadingData}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Precio Contado (Q)"
          type="number"
          step="0.01"
          min="0"
          value={formData.precio_contado}
          onChange={(e) => setFormData({ ...formData, precio_contado: e.target.value })}
          placeholder="0.00"
          required
        />

        <Input
          label="Precio Crédito (Q)"
          type="number"
          step="0.01"
          min="0"
          value={formData.precio_credito}
          onChange={(e) => setFormData({ ...formData, precio_credito: e.target.value })}
          placeholder="0.00"
          required
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={loading} disabled={loadingData}>
          {productoId ? 'Actualizar' : 'Crear Producto'}
        </Button>
      </div>
    </form>
  )
}
