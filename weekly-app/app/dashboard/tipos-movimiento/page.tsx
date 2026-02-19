'use client'

import { useState, useEffect } from 'react'
import LayoutContainer from '@/components/layout/LayoutContainer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'

interface TipoMovimiento {
  id_tipo_movimiento: number
  nombre_tipo: string
  factor: number
  activo?: boolean
  descripcion?: string
}

const TIPOS_BASE = ['ENTRADA', 'SALIDA', 'AJUSTE', 'TRANSFERENCIA', 'DEVOLUCION', 'DEVOLUCIÓN']

export default function TiposMovimientoPage() {
  const [tipos, setTipos] = useState<TipoMovimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [tipoEditando, setTipoEditando] = useState<TipoMovimiento | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    nombre_tipo: '',
    factor: '1',
    descripcion: ''
  })
  const { showToast } = useToast()

  useEffect(() => {
    cargarTipos()
  }, [])

  const cargarTipos = async () => {
    try {
      setLoading(true)
      const data = await apiClient.get('/api/tipos-movimiento')
      setTipos(data)
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (tipo: TipoMovimiento) => {
    setTipoEditando(tipo)
    setFormData({
      nombre_tipo: tipo.nombre_tipo,
      factor: tipo.factor.toString(),
      descripcion: tipo.descripcion || ''
    })
    setModalAbierto(true)
  }

  const isTipoBase = (nombre: string) => TIPOS_BASE.includes((nombre || '').trim().toUpperCase())

  const handleToggleActivo = async (tipo: TipoMovimiento) => {
    try {
      if (isTipoBase(tipo.nombre_tipo)) {
        showToast('Los tipos base no se pueden desactivar', 'error')
        return
      }

      await apiClient.put(`/api/tipos-movimiento/${tipo.id_tipo_movimiento}`, {
        activo: !(tipo.activo ?? true)
      })
      showToast('Estado actualizado correctamente', 'success')
      await cargarTipos()
    } catch (error: any) {
      showToast(error.message, 'error')
    }
  }

  const handleDelete = async (tipo: TipoMovimiento) => {
    if (isTipoBase(tipo.nombre_tipo)) {
      showToast('Los tipos base no se pueden eliminar', 'error')
      return
    }

    const confirmed = window.confirm(`¿Eliminar tipo "${tipo.nombre_tipo}"?`)
    if (!confirmed) return

    try {
      await apiClient.delete(`/api/tipos-movimiento/${tipo.id_tipo_movimiento}`)
      showToast('Tipo eliminado correctamente', 'success')
      await cargarTipos()
    } catch (error: any) {
      showToast(error.message, 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const dataToSend = {
        ...formData,
        factor: parseInt(formData.factor)
      }

      if (tipoEditando) {
        await apiClient.put(`/api/tipos-movimiento/${tipoEditando.id_tipo_movimiento}`, dataToSend)
        showToast('Tipo actualizado correctamente', 'success')
      } else {
        await apiClient.post('/api/tipos-movimiento', dataToSend)
        showToast('Tipo creado correctamente', 'success')
      }
      
      setModalAbierto(false)
      cargarTipos()
    } catch (error: any) {
      showToast(error.message, 'error')
    }
  }

  const filteredTipos = tipos.filter(t => 
    t.nombre_tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      cell: (item: TipoMovimiento) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{item.nombre_tipo}</p>
          {item.descripcion && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.descripcion}</p>
          )}
        </div>
      )
    },
    {
      key: 'factor',
      header: 'Factor',
      cell: (item: TipoMovimiento) => (
        <div className="flex items-center gap-2">
          <Badge variant={item.factor === 1 ? 'success' : item.factor === -1 ? 'error' : 'warning'}>
            {item.factor === 1 ? 'Entrada (+1)' : item.factor === -1 ? 'Salida (-1)' : `Ajuste (${item.factor})`}
          </Badge>
          {isTipoBase(item.nombre_tipo) && <Badge variant="info">Base</Badge>}
          {(item.activo ?? true) ? <Badge variant="success">Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>}
        </div>
      )
    },
    {
      key: 'acciones',
      header: 'Acciones',
      cell: (item: TipoMovimiento) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleEdit(item)}>
            Editar
          </Button>
          {!isTipoBase(item.nombre_tipo) && (
            <Button variant="outline" size="sm" onClick={() => handleToggleActivo(item)}>
              {(item.activo ?? true) ? 'Desactivar' : 'Activar'}
            </Button>
          )}
          {!isTipoBase(item.nombre_tipo) && (
            <Button variant="danger" size="sm" onClick={() => handleDelete(item)}>
              Eliminar
            </Button>
          )}
        </div>
      )
    }
  ]

  return (
    <LayoutContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Tipos de Movimiento
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Configura los tipos de movimientos de inventario
            </p>
          </div>
          <Button 
            onClick={() => {
              setTipoEditando(null)
              setFormData({
                nombre_tipo: '',
                factor: '1',
                descripcion: ''
              })
              setModalAbierto(true)
            }}
            className="w-full sm:w-auto"
          >
            Nuevo Tipo
          </Button>
        </div>

        {/* Búsqueda */}
        <Card>
          <Input
            placeholder="Buscar tipos de movimiento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </Card>

        {/* Tabla */}
        <Card padding="none">
          <Table
            data={filteredTipos}
            columns={columns}
            loading={loading}
          />
        </Card>

        {/* Modal */}
        <Modal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          title={tipoEditando ? 'Editar Tipo de Movimiento' : 'Nuevo Tipo de Movimiento'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
              <Input
              label="Nombre del Tipo"
              value={formData.nombre_tipo}
              onChange={(e) => setFormData({ ...formData, nombre_tipo: e.target.value })}
              placeholder="Ej: ENTRADA, SALIDA, AJUSTE"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Factor
              </label>
              <select
                value={formData.factor}
                onChange={(e) => setFormData({ ...formData, factor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                required
              >
                <option value="1">Entrada (+1)</option>
                <option value="-1">Salida (-1)</option>
                <option value="0">Ajuste (0)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                El factor determina si suma o resta al inventario
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                placeholder="Descripción del tipo de movimiento..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setModalAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {tipoEditando ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </LayoutContainer>
  )
}
