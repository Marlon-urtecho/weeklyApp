'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'

interface AsignarRutaFormProps {
  rutaId: number
  rutaNombre: string
  onSuccess?: () => void
  onCancel?: () => void
}

export const AsignarRutaForm: React.FC<AsignarRutaFormProps> = ({
  rutaId,
  rutaNombre,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false)
  const [cargandoVendedores, setCargandoVendedores] = useState(true)
  const [vendedores, setVendedores] = useState<Array<{ value: number; label: string; disabled?: boolean }>>([])
  const [formData, setFormData] = useState({
    id_vendedor: ''
  })
  const { showToast } = useToast()

  useEffect(() => {
    cargarVendedoresDisponibles()
  }, [])

  const cargarVendedoresDisponibles = async () => {
    try {
      const [vendedoresData, rutaData] = await Promise.all([
        apiClient.get('/api/vendedores'),
        apiClient.get(`/api/rutas/${rutaId}`)
      ])

      const uniqueVendedoresMap = new Map<number, any>()
      ;(Array.isArray(vendedoresData) ? vendedoresData : []).forEach((v: any) => {
        const id = Number(v?.id_vendedor)
        if (!Number.isNaN(id) && !uniqueVendedoresMap.has(id)) {
          uniqueVendedoresMap.set(id, v)
        }
      })
      const vendedoresUnicos = Array.from(uniqueVendedoresMap.values()).sort((a: any, b: any) =>
        String(a?.nombre || '').localeCompare(String(b?.nombre || ''), 'es', { sensitivity: 'base' })
      )

      const rutaVendedores = new Set(
        Array.isArray(rutaData?.vendedores)
          ? rutaData.vendedores.map((rv: any) => Number(rv.id_vendedor))
          : []
      )

      const opciones = vendedoresUnicos.map((v: any) => {
        const rutasActivas = Array.isArray(v.ruta_vendedor)
          ? v.ruta_vendedor.filter((rv: any) => rv?.activo).length
          : 0
        const inactivo = !v?.activo
        const yaAsignado = rutaVendedores.has(Number(v.id_vendedor))
        const limiteAlcanzado = rutasActivas >= 5

        let suffix = `(${rutasActivas}/5 rutas)`
        if (inactivo) suffix += ' - Inactivo'
        else if (yaAsignado) suffix += ' - Ya asignado'
        else if (limiteAlcanzado) suffix += ' - Límite alcanzado'

        return {
          value: v.id_vendedor,
          label: `${v.nombre} ${suffix}`,
          disabled: inactivo || yaAsignado || limiteAlcanzado
        }
      })

      setVendedores(opciones)
    } catch (error: any) {
      showToast('Error al cargar vendedores', 'error')
    } finally {
      setCargandoVendedores(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selected = vendedores.find((v) => Number(v.value) === parseInt(formData.id_vendedor, 10))
      if (!selected || selected.disabled) {
        showToast('Selecciona un vendedor válido (activo y con menos de 5 rutas)', 'error')
        setLoading(false)
        return
      }

      await apiClient.post(`/api/vendedores/${parseInt(formData.id_vendedor, 10)}/rutas`, {
        id_ruta: rutaId
      })
      
      showToast('Vendedor asignado correctamente', 'success')
      onSuccess?.()
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ruta seleccionada: <span className="font-medium text-gray-900 dark:text-white">{rutaNombre}</span>
        </p>
      </div>

      <Select
        label="Seleccionar Vendedor"
        options={vendedores}
        value={formData.id_vendedor}
        onChange={(value) => setFormData({ id_vendedor: value.toString() })}
        placeholder={cargandoVendedores ? 'Cargando vendedores...' : 'Seleccionar vendedor'}
        required
      />

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={loading}>
          Asignar Ruta
        </Button>
      </div>
    </form>
  )
}
