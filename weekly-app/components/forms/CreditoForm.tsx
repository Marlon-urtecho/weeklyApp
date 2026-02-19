'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'
import { formatCurrency } from '@/lib/utils'

interface CreditoFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface ClienteOption {
  id_cliente: number
  nombre: string
  codigo_cliente: string
  activo: boolean
}

interface VendedorOption {
  id_vendedor: number
  nombre: string
  activo: boolean
}

interface ProductoOption {
  id_producto: number
  nombre: string
  precio_credito: number | string
  categorias?: {
    nombre_categoria?: string
  }
}

interface ItemForm {
  id_producto: string
  cantidad: string
  precio_unitario: string
}

const frecuenciaOptions = [
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINCENAL', label: 'Quincenal' },
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'DIAS', label: 'Cada X días' }
]

const toISODate = (date: Date) => {
  const tzOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffset).toISOString().split('T')[0]
}

export const CreditoForm: React.FC<CreditoFormProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [clientes, setClientes] = useState<ClienteOption[]>([])
  const [vendedores, setVendedores] = useState<VendedorOption[]>([])
  const [productos, setProductos] = useState<ProductoOption[]>([])
  const [items, setItems] = useState<ItemForm[]>([{ id_producto: '', cantidad: '1', precio_unitario: '' }])
  const [formData, setFormData] = useState({
    id_cliente: '',
    id_vendedor: '',
    cuota: '',
    frecuencia_pago: 'SEMANAL',
    frecuencia_dias: '7',
    numero_cuotas: '4',
    fecha_inicio: toISODate(new Date())
  })
  const [clienteQuery, setClienteQuery] = useState('')
  const [showClienteResults, setShowClienteResults] = useState(false)
  const [productoQueryByIndex, setProductoQueryByIndex] = useState<Record<number, string>>({})
  const [showProductoResultsByIndex, setShowProductoResultsByIndex] = useState<Record<number, boolean>>({})
  const clienteDropdownRef = useRef<HTMLDivElement | null>(null)
  const productoDropdownRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const [cuotaManual, setCuotaManual] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    cargarData()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(target)) {
        setShowClienteResults(false)
      }

      const clickedInsideProducto = Object.values(productoDropdownRefs.current).some(
        (node) => !!node && node.contains(target)
      )
      if (!clickedInsideProducto) {
        setShowProductoResultsByIndex({})
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const cargarData = async () => {
    try {
      setLoadingData(true)
      const [clientesResp, vendedoresResp, productosResp] = await Promise.all([
        apiClient.get('/api/clientes?activos=true'),
        apiClient.get('/api/vendedores?activos=true'),
        apiClient.get('/api/productos')
      ])

      setClientes((Array.isArray(clientesResp) ? clientesResp : []).filter((c) => c?.activo !== false))
      setVendedores((Array.isArray(vendedoresResp) ? vendedoresResp : []).filter((v) => v?.activo !== false))
      setProductos(Array.isArray(productosResp) ? productosResp : [])
    } catch (error: any) {
      showToast(error.message || 'Error cargando datos del formulario', 'error')
    } finally {
      setLoadingData(false)
    }
  }

  const productoMap = useMemo(() => {
    const map = new Map<number, ProductoOption>()
    productos.forEach((p) => map.set(Number(p.id_producto), p))
    return map
  }, [productos])

  const itemsNormalizados = useMemo(() => {
    return items
      .map((item) => {
        const idProducto = Number(item.id_producto)
        const cantidad = Number(item.cantidad)
        const precio = Number(item.precio_unitario)
        if (!idProducto || !cantidad || !precio) return null
        return {
          id_producto: idProducto,
          cantidad,
          precio_unitario: precio,
          subtotal: cantidad * precio
        }
      })
      .filter((x): x is { id_producto: number; cantidad: number; precio_unitario: number; subtotal: number } => !!x)
  }, [items])

  const montoTotal = useMemo(
    () => itemsNormalizados.reduce((acc, item) => acc + item.subtotal, 0),
    [itemsNormalizados]
  )

  const cuotaSugerida = useMemo(() => {
    const cuotas = Number(formData.numero_cuotas || 0)
    if (!cuotas || montoTotal <= 0) return 0
    return Number((montoTotal / cuotas).toFixed(2))
  }, [formData.numero_cuotas, montoTotal])

  useEffect(() => {
    if (!cuotaManual) {
      setFormData((prev) => ({ ...prev, cuota: cuotaSugerida > 0 ? cuotaSugerida.toFixed(2) : '' }))
    }
  }, [cuotaSugerida, cuotaManual])

  const fechaVencimiento = useMemo(() => {
    const fecha = new Date(formData.fecha_inicio)
    const cuotas = Number(formData.numero_cuotas || 0)
    if (!fecha.getTime() || cuotas <= 0) return null

    if (formData.frecuencia_pago === 'DIAS') {
      const dias = Number(formData.frecuencia_dias || 0)
      if (!dias || dias <= 0) return null
      fecha.setDate(fecha.getDate() + (dias * cuotas))
    } else if (formData.frecuencia_pago === 'SEMANAL') {
      fecha.setDate(fecha.getDate() + (7 * cuotas))
    } else if (formData.frecuencia_pago === 'QUINCENAL') {
      fecha.setDate(fecha.getDate() + (15 * cuotas))
    } else {
      fecha.setMonth(fecha.getMonth() + cuotas)
    }

    return fecha
  }, [formData.fecha_inicio, formData.frecuencia_pago, formData.frecuencia_dias, formData.numero_cuotas])

  const addItem = () => setItems((prev) => [...prev, { id_producto: '', cantidad: '1', precio_unitario: '' }])

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
    setProductoQueryByIndex((prev) => {
      const next: Record<number, string> = {}
      Object.entries(prev).forEach(([k, v]) => {
        const idx = Number(k)
        if (idx < index) next[idx] = v
        if (idx > index) next[idx - 1] = v
      })
      return next
    })
    setShowProductoResultsByIndex((prev) => {
      const next: Record<number, boolean> = {}
      Object.entries(prev).forEach(([k, v]) => {
        const idx = Number(k)
        if (idx < index) next[idx] = v
        if (idx > index) next[idx - 1] = v
      })
      return next
    })
  }

  const updateItem = (index: number, patch: Partial<ItemForm>) => {
    setItems((prev) => {
      const next = [...prev]
      const current = { ...next[index], ...patch }

      if (patch.id_producto !== undefined) {
        const producto = productoMap.get(Number(patch.id_producto))
        if (producto && !current.precio_unitario) {
          current.precio_unitario = Number(producto.precio_credito || 0).toFixed(2)
        }
      }

      next[index] = current
      return next
    })
  }

  const validate = () => {
    if (!formData.id_cliente || !formData.id_vendedor) {
      showToast('Selecciona cliente y vendedor', 'error')
      return false
    }
    if (itemsNormalizados.length === 0) {
      showToast('Debes agregar al menos un producto válido', 'error')
      return false
    }
    if (!formData.cuota || Number(formData.cuota) <= 0) {
      showToast('La cuota debe ser mayor a cero', 'error')
      return false
    }
    if (!fechaVencimiento) {
      showToast('Fecha de vencimiento inválida', 'error')
      return false
    }
    if (formData.frecuencia_pago === 'DIAS' && Number(formData.frecuencia_dias || 0) <= 0) {
      showToast('Ingresa una cantidad de días válida para la frecuencia', 'error')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    try {
      await apiClient.post('/api/creditos', {
        id_cliente: Number(formData.id_cliente),
        id_vendedor: Number(formData.id_vendedor),
        monto_total: Number(montoTotal.toFixed(2)),
        cuota: Number(formData.cuota),
        frecuencia_pago: formData.frecuencia_pago === 'DIAS'
          ? `DIAS_${Number(formData.frecuencia_dias)}`
          : formData.frecuencia_pago,
        numero_cuotas: Number(formData.numero_cuotas),
        fecha_inicio: new Date(formData.fecha_inicio).toISOString(),
        fecha_vencimiento: (fechaVencimiento as Date).toISOString(),
        productos: itemsNormalizados.map((item) => ({
          id_producto: item.id_producto,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario
        }))
      })

      showToast('Crédito creado correctamente', 'success')
      onSuccess?.()
    } catch (error: any) {
      showToast(error.message || 'Error al crear crédito', 'error')
    } finally {
      setLoading(false)
    }
  }

  const vendedorOptions = vendedores.map((v) => ({ value: String(v.id_vendedor), label: v.nombre }))
  const clientesFiltrados = useMemo(() => {
    const term = clienteQuery.trim().toLowerCase()
    if (!term) return clientes.slice(0, 15)
    return clientes
      .filter((c) =>
        c.nombre.toLowerCase().includes(term) ||
        c.codigo_cliente.toLowerCase().includes(term)
      )
      .slice(0, 30)
  }, [clienteQuery, clientes])

  const seleccionarCliente = (cliente: ClienteOption) => {
    setFormData((prev) => ({ ...prev, id_cliente: String(cliente.id_cliente) }))
    setClienteQuery(`${cliente.nombre} (${cliente.codigo_cliente})`)
    setShowClienteResults(false)
  }

  const getProductosFiltrados = (index: number) => {
    const term = (productoQueryByIndex[index] || '').trim().toLowerCase()
    if (!term) return productos.slice(0, 20)
    return productos
      .filter((p) =>
        p.nombre.toLowerCase().includes(term) ||
        (p.categorias?.nombre_categoria || '').toLowerCase().includes(term)
      )
      .slice(0, 40)
  }

  const seleccionarProducto = (index: number, producto: ProductoOption) => {
    updateItem(index, { id_producto: String(producto.id_producto) })
    setProductoQueryByIndex((prev) => ({
      ...prev,
      [index]: `${producto.nombre}${producto.categorias?.nombre_categoria ? ` - ${producto.categorias.nombre_categoria}` : ''}`
    }))
    setShowProductoResultsByIndex((prev) => ({ ...prev, [index]: false }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative" ref={clienteDropdownRef}>
          <Input
            label="Cliente"
            value={clienteQuery}
            onChange={(e) => {
              setClienteQuery(e.target.value)
              setShowClienteResults(true)
              if (!e.target.value.trim()) {
                setFormData((prev) => ({ ...prev, id_cliente: '' }))
              }
            }}
            onFocus={() => setShowClienteResults(true)}
            placeholder={loadingData ? 'Cargando clientes...' : 'Buscar cliente por nombre o código'}
            disabled={loadingData}
            required
          />
          {showClienteResults && !loadingData && (
            <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
              {clientesFiltrados.map((c) => (
                <button
                  key={c.id_cliente}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => seleccionarCliente(c)}
                >
                  {c.nombre} ({c.codigo_cliente})
                </button>
              ))}
              {clientesFiltrados.length === 0 && (
                <p className="px-3 py-2 text-sm text-gray-500">No se encontraron clientes</p>
              )}
            </div>
          )}
        </div>

        <Select
          label="Vendedor"
          options={vendedorOptions}
          value={formData.id_vendedor}
          onChange={(value) => setFormData((prev) => ({ ...prev, id_vendedor: String(value) }))}
          placeholder={loadingData ? 'Cargando vendedores...' : 'Seleccionar vendedor'}
          disabled={loadingData}
          required
        />

        <Select
          label="Frecuencia de pago"
          options={frecuenciaOptions}
          value={formData.frecuencia_pago}
          onChange={(value) => setFormData((prev) => ({ ...prev, frecuencia_pago: String(value) }))}
          required
        />

        {formData.frecuencia_pago === 'DIAS' && (
          <Input
            label="Cada cuántos días"
            type="number"
            min="1"
            value={formData.frecuencia_dias}
            onChange={(e) => setFormData((prev) => ({ ...prev, frecuencia_dias: e.target.value }))}
            required
          />
        )}

        <Input
          label="Número de cuotas"
          type="number"
          min="1"
          value={formData.numero_cuotas}
          onChange={(e) => setFormData((prev) => ({ ...prev, numero_cuotas: e.target.value }))}
          required
        />

        <Input
          label="Fecha de inicio"
          type="date"
          value={formData.fecha_inicio}
          onChange={(e) => setFormData((prev) => ({ ...prev, fecha_inicio: e.target.value }))}
          required
        />

        <Input
          label="Cuota"
          type="number"
          step="0.01"
          min="0.01"
          value={formData.cuota}
          onChange={(e) => {
            setCuotaManual(true)
            setFormData((prev) => ({ ...prev, cuota: e.target.value }))
          }}
          helper={`Sugerida: ${formatCurrency(cuotaSugerida)}`}
          required
        />
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Productos del crédito</h4>
          <Button type="button" variant="secondary" size="sm" onClick={addItem}>Agregar producto</Button>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {items.map((item, index) => {
            const producto = productoMap.get(Number(item.id_producto))
            return (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                <div className="md:col-span-6">
                  <div
                    className="relative"
                    ref={(el) => {
                      productoDropdownRefs.current[index] = el
                    }}
                  >
                    <Input
                      label="Producto"
                      value={productoQueryByIndex[index] || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setProductoQueryByIndex((prev) => ({ ...prev, [index]: val }))
                        setShowProductoResultsByIndex((prev) => ({ ...prev, [index]: true }))
                        if (!val.trim()) {
                          updateItem(index, { id_producto: '' })
                        }
                      }}
                      onFocus={() => setShowProductoResultsByIndex((prev) => ({ ...prev, [index]: true }))}
                      placeholder="Buscar producto por nombre o categoría"
                    />
                    {showProductoResultsByIndex[index] && (
                      <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
                        {getProductosFiltrados(index).map((p) => (
                          <button
                            key={`${index}-${p.id_producto}`}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => seleccionarProducto(index, p)}
                          >
                            {p.nombre}{p.categorias?.nombre_categoria ? ` - ${p.categorias.nombre_categoria}` : ''}
                          </button>
                        ))}
                        {getProductosFiltrados(index).length === 0 && (
                          <p className="px-3 py-2 text-sm text-gray-500">No se encontraron productos</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Cantidad"
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) => updateItem(index, { cantidad: e.target.value })}
                    required
                  />
                </div>
                <div className="md:col-span-3">
                  <Input
                    label="Precio crédito"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={item.precio_unitario}
                    onChange={(e) => updateItem(index, { precio_unitario: e.target.value })}
                    helper={producto ? `Sugerido: ${formatCurrency(Number(producto.precio_credito || 0))}` : undefined}
                    required
                  />
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    X
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
          <p className="text-xs text-blue-700 dark:text-blue-300">Total crédito</p>
          <p className="text-lg font-bold text-blue-800 dark:text-blue-200">{formatCurrency(montoTotal)}</p>
        </div>
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
          <p className="text-xs text-green-700 dark:text-green-300">Cuota final</p>
          <p className="text-lg font-bold text-green-800 dark:text-green-200">{formatCurrency(Number(formData.cuota || 0))}</p>
        </div>
        <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-3">
          <p className="text-xs text-purple-700 dark:text-purple-300">Vencimiento</p>
          <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
            {fechaVencimiento ? fechaVencimiento.toLocaleDateString() : '-'}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading} disabled={loadingData}>
          Guardar Crédito
        </Button>
      </div>
    </form>
  )
}

export default CreditoForm
