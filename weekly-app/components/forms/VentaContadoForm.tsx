'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { apiClient } from '@/lib/api/client'
import { useToast } from '@/contexts/ToastContext'

interface VentaContadoFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface VendedorItem {
  id_vendedor: number
  nombre: string
  activo: boolean
}

interface ClienteItem {
  id_cliente: number
  nombre: string
  codigo_cliente: string
  activo: boolean
}

interface InventarioItem {
  id_producto: number
  stock_disponible: number
  nombre_producto: string
  categoria?: string
}

interface ProductoItem {
  id_producto: number
  nombre: string
  precio_contado?: number
  categorias?: {
    nombre_categoria?: string
  }
}

interface LineaVenta {
  id_producto: string
  cantidad: string
}

export default function VentaContadoForm({ onSuccess, onCancel }: VentaContadoFormProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [loadingInventario, setLoadingInventario] = useState(false)
  const [vendedores, setVendedores] = useState<VendedorItem[]>([])
  const [clientes, setClientes] = useState<ClienteItem[]>([])
  const [productos, setProductos] = useState<ProductoItem[]>([])
  const [inventario, setInventario] = useState<InventarioItem[]>([])
  const [idVendedor, setIdVendedor] = useState('')
  const [idCliente, setIdCliente] = useState('')
  const [clienteQuery, setClienteQuery] = useState('')
  const [showClienteResults, setShowClienteResults] = useState(false)
  const [productoQueryByIndex, setProductoQueryByIndex] = useState<Record<number, string>>({})
  const [showProductoResultsByIndex, setShowProductoResultsByIndex] = useState<Record<number, boolean>>({})
  const clienteDropdownRef = useRef<HTMLDivElement | null>(null)
  const productoDropdownRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const [lineas, setLineas] = useState<LineaVenta[]>([{ id_producto: '', cantidad: '1' }])
  const { showToast } = useToast()

  useEffect(() => {
    cargarBase()
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

  useEffect(() => {
    if (idVendedor) {
      cargarInventarioVendedor(Number(idVendedor))
    } else {
      setInventario([])
    }
  }, [idVendedor])

  const cargarBase = async () => {
    try {
      setLoadingData(true)
      const [vendedoresResp, clientesResp, productosResp] = await Promise.all([
        apiClient.get('/api/vendedores?activos=true'),
        apiClient.get('/api/clientes?activos=true'),
        apiClient.get('/api/productos')
      ])
      setVendedores((Array.isArray(vendedoresResp) ? vendedoresResp : []).filter((v) => v?.activo !== false))
      setClientes((Array.isArray(clientesResp) ? clientesResp : []).filter((c) => c?.activo !== false))
      setProductos(Array.isArray(productosResp) ? productosResp : [])
    } catch (error: any) {
      showToast(error.message || 'Error cargando datos', 'error')
    } finally {
      setLoadingData(false)
    }
  }

  const cargarInventarioVendedor = async (id: number) => {
    try {
      setLoadingInventario(true)
      const resp = await apiClient.get(`/api/inventario/vendedor/${id}`)
      const rows = Array.isArray(resp) ? resp : []
      setInventario(rows.map((r: any) => ({
        id_producto: Number(r?.id_producto),
        stock_disponible: Number(r?.cantidad || 0),
        nombre_producto: r?.productos?.nombre || `Producto ${r?.id_producto}`,
        categoria: r?.productos?.categorias?.nombre_categoria
      })))
    } catch (error: any) {
      showToast(error.message || 'Error cargando inventario del vendedor', 'error')
      setInventario([])
    } finally {
      setLoadingInventario(false)
    }
  }

  const inventarioMap = useMemo(() => {
    const map = new Map<number, InventarioItem>()
    inventario.forEach((it) => map.set(it.id_producto, it))
    return map
  }, [inventario])

  const addLinea = () => {
    setLineas((prev) => [...prev, { id_producto: '', cantidad: '1' }])
  }
  const removeLinea = (index: number) => {
    setLineas((prev) => prev.filter((_, i) => i !== index))
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
  const updateLinea = (index: number, patch: Partial<LineaVenta>) => {
    setLineas((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const lineasNormalizadas = useMemo(() => {
    return lineas
      .map((l) => ({ id_producto: Number(l.id_producto), cantidad: Number(l.cantidad) }))
      .filter((l) => l.id_producto > 0 && l.cantidad > 0)
  }, [lineas])

  const validate = () => {
    if (!idVendedor) {
      showToast('Selecciona vendedor', 'error')
      return false
    }
    if (!lineasNormalizadas.length) {
      showToast('Debes agregar al menos un producto', 'error')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await apiClient.post(`/api/inventario/vendedor/${idVendedor}/venta-contado`, {
        id_cliente: idCliente ? Number(idCliente) : undefined,
        productos: lineasNormalizadas
      })
      showToast('Venta al contado registrada', 'success')
      onSuccess?.()
    } catch (error: any) {
      showToast(error.message || 'No se pudo registrar la venta al contado', 'error')
    } finally {
      setLoading(false)
    }
  }

  const clientesFiltrados = useMemo(() => {
    const term = clienteQuery.trim().toLowerCase()
    if (!term) return clientes.slice(0, 12)
    return clientes
      .filter((c) =>
        c.nombre.toLowerCase().includes(term) ||
        c.codigo_cliente.toLowerCase().includes(term)
      )
      .slice(0, 20)
  }, [clienteQuery, clientes])

  const seleccionarCliente = (cliente: ClienteItem | null) => {
    if (!cliente) {
      setIdCliente('')
      setClienteQuery('')
      setShowClienteResults(false)
      return
    }
    setIdCliente(String(cliente.id_cliente))
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
      .slice(0, 30)
  }

  const seleccionarProducto = (index: number, producto: ProductoItem) => {
    updateLinea(index, { id_producto: String(producto.id_producto) })
    setProductoQueryByIndex((prev) => ({
      ...prev,
      [index]: `${producto.nombre}${producto.categorias?.nombre_categoria ? ` - ${producto.categorias.nombre_categoria}` : ''}`
    }))
    setShowProductoResultsByIndex((prev) => ({ ...prev, [index]: false }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Vendedor"
          options={vendedores.map((v) => ({ value: String(v.id_vendedor), label: v.nombre }))}
          value={idVendedor}
          onChange={(value) => setIdVendedor(String(value))}
          placeholder={loadingData ? 'Cargando vendedores...' : 'Seleccionar vendedor'}
          disabled={loadingData}
          required
        />

        <div className="relative" ref={clienteDropdownRef}>
          <Input
            label="Cliente (opcional)"
            value={clienteQuery}
            onChange={(e) => {
              setClienteQuery(e.target.value)
              setShowClienteResults(true)
              if (!e.target.value.trim()) setIdCliente('')
            }}
            onFocus={() => setShowClienteResults(true)}
            placeholder="Buscar por nombre o código"
            disabled={loadingData}
          />
          {showClienteResults && !loadingData && (
            <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => seleccionarCliente(null)}
              >
                Sin cliente específico
              </button>
              {clientesFiltrados.map((cliente) => (
                <button
                  key={cliente.id_cliente}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => seleccionarCliente(cliente)}
                >
                  {cliente.nombre} ({cliente.codigo_cliente})
                </button>
              ))}
              {clientesFiltrados.length === 0 && (
                <p className="px-3 py-2 text-sm text-gray-500">No se encontraron clientes</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Productos a vender</h4>
          <Button type="button" variant="secondary" size="sm" onClick={addLinea} disabled={!idVendedor || loadingInventario}>
            Agregar
          </Button>
        </div>

        {loadingInventario && <p className="text-sm text-gray-500">Cargando inventario...</p>}
        {!loadingInventario && idVendedor && inventario.length === 0 && (
          <p className="text-sm text-gray-500">Este vendedor no tiene inventario asignado. Igual puedes registrar la venta.</p>
        )}

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {lineas.map((linea, index) => {
            const stock = inventarioMap.get(Number(linea.id_producto))?.stock_disponible || 0
            return (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                <div className="md:col-span-8">
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
                          updateLinea(index, { id_producto: '' })
                        }
                      }}
                      onFocus={() => setShowProductoResultsByIndex((prev) => ({ ...prev, [index]: true }))}
                      placeholder="Buscar producto por nombre o categoría"
                      disabled={!idVendedor || loadingInventario || productos.length === 0}
                    />
                    {showProductoResultsByIndex[index] && (
                      <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
                        {getProductosFiltrados(index).map((p) => {
                          const stockActual = inventarioMap.get(p.id_producto)?.stock_disponible || 0
                          return (
                            <button
                              key={`${index}-${p.id_producto}`}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={() => seleccionarProducto(index, p)}
                            >
                              {p.nombre}
                              {p.categorias?.nombre_categoria ? ` - ${p.categorias.nombre_categoria}` : ''}
                              {` (Stock vendedor: ${stockActual})`}
                            </button>
                          )
                        })}
                        {getProductosFiltrados(index).length === 0 && (
                          <p className="px-3 py-2 text-sm text-gray-500">No se encontraron productos</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-3">
                  <Input
                    label="Cantidad"
                    type="number"
                    min="1"
                    value={linea.cantidad}
                    onChange={(e) => updateLinea(index, { cantidad: e.target.value })}
                    helper={linea.id_producto ? `Stock vendedor actual: ${stock} (puede vender aunque sea 0)` : undefined}
                  />
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <Button type="button" variant="danger" size="sm" onClick={() => removeLinea(index)} disabled={lineas.length === 1}>
                    X
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading} disabled={loadingData || !idVendedor}>Registrar venta contado</Button>
      </div>
    </form>
  )
}
