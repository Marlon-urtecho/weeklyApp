'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'

interface ClienteFormProps {
  clienteId?: number
  onSuccess?: () => void
  onCancel?: () => void
}

export const ClienteForm: React.FC<ClienteFormProps> = ({
  clienteId,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false)
  const [cargandoRutas, setCargandoRutas] = useState(true)
  const [rutas, setRutas] = useState<Array<{ value: number; label: string }>>([])
  const [formData, setFormData] = useState({
    codigo_cliente: '',
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    id_ruta: '',
    activo: true
  })
  const { showToast } = useToast()

  useEffect(() => {
    cargarRutas()
    if (clienteId) {
      cargarCliente()
    }
  }, [clienteId])

  const cargarRutas = async () => {
    try {
      const data = await apiClient.get('/api/rutas?activas=true')
      setRutas(data.map((r: any) => ({
        value: r.id_ruta,
        label: `${r.codigo_ruta} - ${r.nombre_ruta}`
      })))
    } catch (error: any) {
      showToast('Error al cargar rutas', 'error')
    } finally {
      setCargandoRutas(false)
    }
  }

  const cargarCliente = async () => {
    try {
      const data = await apiClient.get(`/api/clientes/${clienteId}`)
      setFormData({
        codigo_cliente: data.codigo_cliente,
        nombre: data.nombre,
        direccion: data.direccion || '',
        telefono: data.telefono || '',
        email: data.email || '',
        id_ruta: data.id_ruta?.toString() || '',
        activo: data.activo
      })
    } catch (error: any) {
      showToast(error.message, 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const idRuta = parseInt(formData.id_ruta, 10)
      if (Number.isNaN(idRuta)) {
        throw new Error('Debes seleccionar una ruta')
      }

      const dataToSend = {
        codigo_cliente: formData.codigo_cliente.trim(),
        nombre: formData.nombre.trim(),
        direccion: formData.direccion.trim() || null,
        telefono: formData.telefono.trim() || null,
        email: formData.email.trim() || null,
        id_ruta: idRuta,
        activo: formData.activo
      }

      if (clienteId) {
        await apiClient.put(`/api/clientes/${clienteId}`, dataToSend)
        showToast('Cliente actualizado correctamente', 'success')
      } else {
        await apiClient.post('/api/clientes', dataToSend)
        showToast('Cliente creado correctamente', 'success')
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Código de Cliente"
          value={formData.codigo_cliente}
          onChange={(e) => setFormData({ ...formData, codigo_cliente: e.target.value })}
          placeholder="Ej: CLT-001"
          required
        />

        <Input
          label="Nombre Completo"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="Nombre del cliente"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Teléfono"
          value={formData.telefono}
          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
          placeholder="Ej: 1234-5678"
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="cliente@email.com"
        />
      </div>

      <Input
        label="Dirección"
        value={formData.direccion}
        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
        placeholder="Dirección completa"
      />

      <Select
        label="Ruta"
        options={rutas}
        value={formData.id_ruta}
        onChange={(value) => setFormData({ ...formData, id_ruta: value.toString() })}
        placeholder={cargandoRutas ? 'Cargando rutas...' : 'Seleccionar ruta'}
        required
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
          Cliente activo
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {clienteId ? 'Actualizar' : 'Crear Cliente'}
        </Button>
      </div>
    </form>
  )
}
