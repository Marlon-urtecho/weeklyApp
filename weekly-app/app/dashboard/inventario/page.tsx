'use client'

import { useEffect, useMemo, useState } from 'react'
import LayoutContainer from '@/components/layout/LayoutContainer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'
import { formatCurrency } from '@/lib/utils'
import { CONFIG_UPDATED_EVENT, getStockLowThreshold, getStoredConfig } from '@/lib/system-config'

interface InventarioItem {
  id_producto: number
  nombre: string
  categoria: string
  precio: number
  bodega: {
    stock_total: number
    stock_disponible: number
  }
  vendedores: Array<{
    id_vendedor: number
    nombre: string
    cantidad: number
  }>
  movimientos: Array<{
    fecha: string
    tipo: string
    cantidad: number
    origen: string
    destino: string
    direccion: string
  }>
}

interface MovimientoFila {
  fecha: string
  producto: string
  tipo: string
  cantidad: number
  origen: string
  destino: string
  direccion: string
}

interface VendedorRutasMapItem {
  nombre: string
  rutas: string[]
}

const csvEscape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`

export default function InventarioPage() {
  const [inventario, setInventario] = useState<InventarioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalMovimiento, setModalMovimiento] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState<InventarioItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('TODAS')
  const [activeTab, setActiveTab] = useState('general')
  const [stats, setStats] = useState({
    totalProductos: 0,
    totalUnidades: 0,
    valorTotal: 0,
    productosConStock: 0,
    stockBajo: 0,
    agotados: 0
  })

  const [tipoMovimiento, setTipoMovimiento] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA')
  const [cantidadMovimiento, setCantidadMovimiento] = useState('')
  const [observacionMovimiento, setObservacionMovimiento] = useState('')
  const [submittingMovimiento, setSubmittingMovimiento] = useState(false)
  const [vendedorRutasMap, setVendedorRutasMap] = useState<Map<number, VendedorRutasMapItem>>(new Map())
  const [filtroVendedorDistribucion, setFiltroVendedorDistribucion] = useState('TODOS')
  const [filtroRutaDistribucion, setFiltroRutaDistribucion] = useState('TODAS')
  const [stockLowThreshold, setStockLowThreshold] = useState(10)

  const { showToast } = useToast()

  useEffect(() => {
    cargarInventario()
  }, [])

  useEffect(() => {
    const syncConfig = () => {
      const cfg = getStoredConfig()
      setStockLowThreshold(getStockLowThreshold(cfg))
    }

    syncConfig()
    window.addEventListener(CONFIG_UPDATED_EVENT, syncConfig as EventListener)
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, syncConfig as EventListener)
  }, [])

  useEffect(() => {
    calcularStats()
  }, [inventario, stockLowThreshold])

  const cargarInventario = async () => {
    try {
      setLoading(true)
      const [productosData, reporteData, vendedoresData] = await Promise.all([
        apiClient.get('/api/productos/inventario/completo'),
        apiClient.get('/api/reportes/inventario-vendedores'),
        apiClient.get('/api/vendedores?activos=true')
      ])

      const movimientosPorProducto = new Map<number, MovimientoFila[]>()
      const movimientosReporte = (reporteData?.vendedores || [])
        .flatMap((v: any) => (Array.isArray(v.movimientos) ? v.movimientos : []))
        .map((m: any) => ({
          fecha: m.fecha,
          producto: m.producto || `Producto ${m.id_producto}`,
          tipo: m.tipo || 'MOVIMIENTO',
          cantidad: Number(m.cantidad || 0),
          origen: m.origen || '',
          destino: m.destino || '',
          direccion: m.direccion || 'MOVIMIENTO',
          id_producto: Number(m.id_producto || 0)
        }))
        .filter((m: any) => m.id_producto > 0)

      for (const mov of movimientosReporte) {
        const arr = movimientosPorProducto.get(mov.id_producto) || []
        arr.push({
          fecha: mov.fecha,
          producto: mov.producto,
          tipo: mov.tipo,
          cantidad: mov.cantidad,
          origen: mov.origen,
          destino: mov.destino,
          direccion: mov.direccion
        })
        movimientosPorProducto.set(mov.id_producto, arr)
      }

      const rutasMap = new Map<number, VendedorRutasMapItem>()
      for (const vendedor of (Array.isArray(vendedoresData) ? vendedoresData : [])) {
        const idVendedor = Number(vendedor?.id_vendedor || 0)
        if (!idVendedor) continue
        const rutas = Array.isArray(vendedor?.ruta_vendedor)
          ? vendedor.ruta_vendedor
              .filter((rv: any) => rv?.activo !== false)
              .map((rv: any) => rv?.rutas?.nombre_ruta || rv?.rutas?.codigo_ruta)
              .filter((r: string | undefined) => !!r)
          : []
        rutasMap.set(idVendedor, {
          nombre: vendedor?.nombre || `Vendedor ${idVendedor}`,
          rutas
        })
      }

      const normalizado: InventarioItem[] = (Array.isArray(productosData) ? productosData : []).map((producto: any) => {
        const bodega = producto.inventario_bodega || {
          stock_total: 0,
          stock_disponible: 0
        }

        const vendedores = Array.isArray(producto.inventario_vendedor)
          ? producto.inventario_vendedor.map((v: any) => ({
              id_vendedor: Number(v.id_vendedor || v.vendedores?.id_vendedor || 0),
              nombre: v.vendedores?.nombre || `Vendedor ${v.id_vendedor}`,
              cantidad: Number(v.cantidad || 0)
            }))
          : []

        return {
          id_producto: Number(producto.id_producto),
          nombre: producto.nombre || `Producto #${producto.id_producto}`,
          categoria: producto.categorias?.nombre_categoria || 'Sin categoria',
          precio: Number(producto.precio_contado || producto.precio_credito || 0),
          bodega: {
            stock_total: Number(bodega.stock_total || 0),
            stock_disponible: Number(bodega.stock_disponible || 0)
          },
          vendedores,
          movimientos: (movimientosPorProducto.get(Number(producto.id_producto)) || [])
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        }
      })

      setInventario(normalizado)
      setVendedorRutasMap(rutasMap)
    } catch (error: any) {
      showToast(error.message || 'Error cargando inventario', 'error')
    } finally {
      setLoading(false)
    }
  }

  const calcularStats = () => {
    const totalUnidades = inventario.reduce((sum, item) => sum + item.bodega.stock_disponible, 0)
    const valorTotal = inventario.reduce(
      (sum, item) => sum + (item.bodega.stock_disponible * item.precio),
      0
    )
    const productosConStock = inventario.filter((item) => item.bodega.stock_disponible > 0).length
    const stockBajo = inventario.filter(
      (item) => item.bodega.stock_disponible > 0 && item.bodega.stock_disponible < stockLowThreshold
    ).length
    const agotados = inventario.filter((item) => item.bodega.stock_disponible === 0).length

    setStats({
      totalProductos: inventario.length,
      totalUnidades,
      valorTotal,
      productosConStock,
      stockBajo,
      agotados
    })
  }

  const categorias = useMemo(
    () => ['TODAS', ...Array.from(new Set(inventario.map((i) => i.categoria))).sort((a, b) => a.localeCompare(b, 'es'))],
    [inventario]
  )

  const filteredInventario = useMemo(() => {
    const termino = searchTerm.toLowerCase().trim()
    return inventario.filter((item) => {
      const matchText = !termino ||
        item.nombre.toLowerCase().includes(termino) ||
        item.categoria.toLowerCase().includes(termino)

      const matchCategoria = filtroCategoria === 'TODAS' || item.categoria === filtroCategoria
      return matchText && matchCategoria
    })
  }, [inventario, searchTerm, filtroCategoria])

  const movimientosRecientes = useMemo(() => {
    return inventario
      .flatMap((item) =>
        item.movimientos.map((m) => ({
          ...m,
          producto: item.nombre
        }))
      )
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 100)
  }, [inventario])

  const distribucionVendedores = useMemo(() => {
    const map = new Map<number, {
      id_vendedor: number
      nombre: string
      rutas: string[]
      productos: number
      unidades: number
      detalleProductos: Array<{ nombre: string; categoria: string; cantidad: number }>
    }>()
    for (const item of inventario) {
      for (const v of item.vendedores) {
        const current = map.get(v.id_vendedor) || {
          id_vendedor: v.id_vendedor,
          nombre: vendedorRutasMap.get(v.id_vendedor)?.nombre || v.nombre,
          rutas: vendedorRutasMap.get(v.id_vendedor)?.rutas || [],
          productos: 0,
          unidades: 0,
          detalleProductos: []
        }
        current.productos += 1
        current.unidades += v.cantidad
        current.detalleProductos.push({
          nombre: item.nombre,
          categoria: item.categoria,
          cantidad: v.cantidad
        })
        map.set(v.id_vendedor, current)
      }
    }
    return Array.from(map.values()).sort((a, b) => b.unidades - a.unidades)
  }, [inventario, vendedorRutasMap])

  const distribucionDetalleRows = useMemo(() => {
    const rows: Array<{
      id_vendedor: number
      vendedor: string
      rutas: string[]
      producto: string
      categoria: string
      cantidad: number
    }> = []

    for (const item of inventario) {
      for (const v of item.vendedores) {
        const meta = vendedorRutasMap.get(v.id_vendedor)
        rows.push({
          id_vendedor: v.id_vendedor,
          vendedor: meta?.nombre || v.nombre,
          rutas: meta?.rutas || [],
          producto: item.nombre,
          categoria: item.categoria,
          cantidad: v.cantidad
        })
      }
    }

    return rows.sort((a, b) => {
      const byVendor = a.vendedor.localeCompare(b.vendedor, 'es')
      if (byVendor !== 0) return byVendor
      return a.producto.localeCompare(b.producto, 'es')
    })
  }, [inventario, vendedorRutasMap])

  const vendedoresDistribucionOptions = useMemo(
    () => ['TODOS', ...Array.from(new Set(distribucionDetalleRows.map((r) => r.vendedor))).sort((a, b) => a.localeCompare(b, 'es'))],
    [distribucionDetalleRows]
  )

  const rutasDistribucionOptions = useMemo(() => {
    const rutas = new Set<string>()
    for (const row of distribucionDetalleRows) {
      for (const ruta of row.rutas) rutas.add(ruta)
    }
    return ['TODAS', ...Array.from(rutas).sort((a, b) => a.localeCompare(b, 'es'))]
  }, [distribucionDetalleRows])

  const distribucionFiltradaRows = useMemo(() => {
    return distribucionDetalleRows.filter((row) => {
      const matchVendedor = filtroVendedorDistribucion === 'TODOS' || row.vendedor === filtroVendedorDistribucion
      const matchRuta = filtroRutaDistribucion === 'TODAS' || row.rutas.includes(filtroRutaDistribucion)
      return matchVendedor && matchRuta
    })
  }, [distribucionDetalleRows, filtroVendedorDistribucion, filtroRutaDistribucion])

  const exportarInventario = () => {
    const rows = [
      ['Producto', 'Categoria', 'Stock disponible', 'Stock total', 'Distribuido vendedores', 'Precio', 'Valor stock']
        .map(csvEscape).join(',')
    ]

    for (const item of filteredInventario) {
      const distribuido = item.vendedores.reduce((s, v) => s + v.cantidad, 0)
      rows.push([
        item.nombre,
        item.categoria,
        item.bodega.stock_disponible,
        item.bodega.stock_total,
        distribuido,
        item.precio.toFixed(2),
        (item.bodega.stock_disponible * item.precio).toFixed(2)
      ].map(csvEscape).join(','))
    }

    const csv = `\uFEFF${rows.join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `inventario_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast('Inventario exportado para Excel', 'success')
  }

  const abrirModalAjuste = (item: InventarioItem) => {
    setProductoSeleccionado(item)
    setTipoMovimiento('ENTRADA')
    setCantidadMovimiento('')
    setObservacionMovimiento('')
    setModalMovimiento(true)
  }

  const registrarAjuste = async () => {
    if (!productoSeleccionado) return
    const cantidad = Number(cantidadMovimiento)
    if (Number.isNaN(cantidad) || cantidad <= 0) {
      showToast('Cantidad inválida', 'error')
      return
    }
    if (tipoMovimiento === 'SALIDA' && cantidad > productoSeleccionado.bodega.stock_disponible) {
      showToast('No hay stock suficiente para la salida', 'error')
      return
    }

    try {
      setSubmittingMovimiento(true)
      if (tipoMovimiento === 'ENTRADA') {
        await apiClient.post('/api/inventario/bodega/entrada', {
          id_producto: productoSeleccionado.id_producto,
          cantidad,
          observacion: observacionMovimiento || `Entrada manual de inventario (${productoSeleccionado.nombre})`
        })
      } else {
        await apiClient.post('/api/inventario/bodega/salida', {
          id_producto: productoSeleccionado.id_producto,
          cantidad,
          destino: 'AJUSTE',
          observacion: observacionMovimiento || `Salida manual de inventario (${productoSeleccionado.nombre})`
        })
      }

      showToast(`${tipoMovimiento === 'ENTRADA' ? 'Entrada' : 'Salida'} registrada`, 'success')
      setModalMovimiento(false)
      await cargarInventario()
    } catch (error: any) {
      showToast(error.message || 'No se pudo registrar el movimiento', 'error')
    } finally {
      setSubmittingMovimiento(false)
    }
  }

  const statsCards = [
    {
      title: 'Total Productos',
      value: stats.totalProductos,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'blue' as const
    },
    {
      title: 'Unidades en Stock',
      value: stats.totalUnidades,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      color: 'green' as const
    },
    {
      title: 'Valor Total',
      value: formatCurrency(stats.valorTotal),
      valueTitle: stats.valorTotal.toString(),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      color: 'purple' as const
    },
    {
      title: `Stock Bajo (< ${stockLowThreshold})`,
      value: stats.stockBajo,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: 'red' as const
    }
  ]

  const columns = [
    {
      key: 'producto',
      header: 'Producto',
      cell: (item: InventarioItem) => (
        <div className="min-w-[220px]">
          <p className="font-medium text-gray-900 dark:text-white">{item.nombre}</p>
          <Badge variant="secondary" size="sm">{item.categoria}</Badge>
        </div>
      )
    },
    {
      key: 'bodega',
      header: 'Stock en Bodega',
      cell: (item: InventarioItem) => {
        const stock = item.bodega.stock_disponible
        const total = item.bodega.stock_total
        return (
          <div className="min-w-[150px]">
            <Badge variant={stock > 10 ? 'success' : stock > 0 ? 'warning' : 'error'}>
              {stock} unidades
            </Badge>
            <p className="text-xs text-gray-500 mt-1">Total: {total}</p>
          </div>
        )
      }
    },
    {
      key: 'distribuido',
      header: 'Distribuido',
      cell: (item: InventarioItem) => {
        const totalDistribuido = item.vendedores.reduce((sum, v) => sum + v.cantidad, 0)
        return (
          <div className="min-w-[120px]">
            <p className="font-medium">{totalDistribuido} und</p>
            <p className="text-xs text-gray-500">a {item.vendedores.length} vendedores</p>
          </div>
        )
      }
    },
    {
      key: 'valor',
      header: 'Valor Stock',
      cell: (item: InventarioItem) => (
        <p className="min-w-[120px] font-medium">
          {formatCurrency(item.bodega.stock_disponible * item.precio)}
        </p>
      )
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (item: InventarioItem) => {
        const stock = item.bodega.stock_disponible
        if (stock === 0) return <Badge variant="error">Agotado</Badge>
        if (stock < stockLowThreshold) return <Badge variant="warning">Stock Bajo</Badge>
        return <Badge variant="success">Normal</Badge>
      }
    },
    {
      key: 'acciones',
      header: 'Acciones',
      cell: (item: InventarioItem) => (
        <div className="flex flex-wrap gap-2 min-w-[220px]" onClick={(e) => e.stopPropagation()}>
          <Button variant="secondary" size="sm" onClick={() => abrirModalAjuste(item)}>
            Ajustar Stock
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setProductoSeleccionado(item)
              setModalDetalle(true)
            }}
          >
            Ver Detalle
          </Button>
        </div>
      )
    }
  ]

  return (
    <LayoutContainer>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Inventario
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Control de stock en bodega, distribución y movimientos
            </p>
          </div>
        </div>

        <StatsCards stats={statsCards} />

        <Card>
          <Tabs
            tabs={[
              { id: 'general', label: 'Vista General' },
              { id: 'distribucion', label: 'Distribución por Vendedor' },
              { id: 'movimientos', label: 'Movimientos Recientes' },
              { id: 'alertas', label: 'Alertas de Stock' }
            ]}
            defaultTab="general"
            onChange={setActiveTab}
            variant="pills"
          />
        </Card>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Buscar por producto o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Categoría</label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>{cat === 'TODAS' ? 'Todas las categorías' : cat}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="secondary" onClick={exportarInventario} className="w-full">
                Exportar Inventario
              </Button>
            </div>
          </div>
        </Card>

        {activeTab === 'general' && (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table data={filteredInventario} columns={columns} loading={loading} />
            </div>
          </Card>
        )}

        {activeTab === 'distribucion' && (
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Filtrar por vendedor</label>
                <select
                  value={filtroVendedorDistribucion}
                  onChange={(e) => setFiltroVendedorDistribucion(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  {vendedoresDistribucionOptions.map((v) => (
                    <option key={v} value={v}>{v === 'TODOS' ? 'Todos los vendedores' : v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Filtrar por ruta</label>
                <select
                  value={filtroRutaDistribucion}
                  onChange={(e) => setFiltroRutaDistribucion(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  {rutasDistribucionOptions.map((r) => (
                    <option key={r} value={r}>{r === 'TODAS' ? 'Todas las rutas' : r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-3">Vendedor</th>
                    <th className="py-3 pr-3">Rutas</th>
                    <th className="py-3 pr-3">Producto</th>
                    <th className="py-3 pr-3">Categoría</th>
                    <th className="py-3 pr-3">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {distribucionFiltradaRows.map((v, idx) => (
                    <tr key={`${v.id_vendedor}-${v.producto}-${idx}`} className="border-b last:border-b-0">
                      <td className="py-3 pr-3 font-medium">{v.vendedor}</td>
                      <td className="py-3 pr-3">
                        {v.rutas.length > 0 ? v.rutas.join(' | ') : 'Sin ruta activa'}
                      </td>
                      <td className="py-3 pr-3">{v.producto}</td>
                      <td className="py-3 pr-3">{v.categoria}</td>
                      <td className="py-3 pr-3">{v.cantidad}</td>
                    </tr>
                  ))}
                  {distribucionFiltradaRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500">
                        No hay registros para los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'movimientos' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-[950px] w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-3">Fecha</th>
                    <th className="py-3 pr-3">Producto</th>
                    <th className="py-3 pr-3">Tipo</th>
                    <th className="py-3 pr-3">Cantidad</th>
                    <th className="py-3 pr-3">Origen</th>
                    <th className="py-3 pr-3">Destino</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosRecientes.length > 0 ? (
                    movimientosRecientes.map((m, idx) => (
                      <tr key={`${m.fecha}-${m.producto}-${idx}`} className="border-b last:border-b-0">
                        <td className="py-2 pr-3">{new Date(m.fecha).toLocaleString()}</td>
                        <td className="py-2 pr-3">{m.producto}</td>
                        <td className="py-2 pr-3">{m.tipo}</td>
                        <td className="py-2 pr-3">{m.cantidad}</td>
                        <td className="py-2 pr-3">{m.origen}</td>
                        <td className="py-2 pr-3">{m.destino}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500">
                        No hay movimientos de inventario para mostrar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'alertas' && (
          <Card>
            <div className="space-y-3">
              {filteredInventario
                .filter((item) => item.bodega.stock_disponible < 10)
                .sort((a, b) => a.bodega.stock_disponible - b.bodega.stock_disponible)
                .map((item) => (
                  <div key={item.id_producto} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div>
                      <p className="font-medium">{item.nombre}</p>
                      <p className="text-xs text-gray-500">{item.categoria}</p>
                    </div>
                    {item.bodega.stock_disponible === 0 ? (
                      <Badge variant="error">Agotado</Badge>
                    ) : (
                      <Badge variant="warning">Stock: {item.bodega.stock_disponible}</Badge>
                    )}
                  </div>
                ))}
              {filteredInventario.filter((item) => item.bodega.stock_disponible < 10).length === 0 && (
                <p className="text-center py-6 text-gray-500">No hay alertas de stock en el filtro actual.</p>
              )}
            </div>
          </Card>
        )}

        <Modal
          isOpen={modalMovimiento}
          onClose={() => setModalMovimiento(false)}
          title={`Ajustar Stock - ${productoSeleccionado?.nombre || ''}`}
          size="md"
        >
          {productoSeleccionado && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Stock actual en bodega</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {productoSeleccionado.bodega.stock_disponible} unidades
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo de movimiento</label>
                <select
                  value={tipoMovimiento}
                  onChange={(e) => setTipoMovimiento(e.target.value as 'ENTRADA' | 'SALIDA')}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="ENTRADA">Entrada a bodega</option>
                  <option value="SALIDA">Salida de bodega</option>
                </select>
              </div>

              <Input
                label="Cantidad"
                type="number"
                min="1"
                value={cantidadMovimiento}
                onChange={(e) => setCantidadMovimiento(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Observación</label>
                <textarea
                  value={observacionMovimiento}
                  onChange={(e) => setObservacionMovimiento(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  placeholder="Motivo del ajuste (opcional)"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setModalMovimiento(false)}>
                  Cancelar
                </Button>
                <Button onClick={registrarAjuste} loading={submittingMovimiento}>
                  Guardar Movimiento
                </Button>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={modalDetalle}
          onClose={() => setModalDetalle(false)}
          title={`Detalle - ${productoSeleccionado?.nombre || ''}`}
          size="lg"
        >
          {productoSeleccionado && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Stock Total</p>
                  <p className="text-xl font-bold">{productoSeleccionado.bodega.stock_total}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Stock Disponible</p>
                  <p className="text-xl font-bold text-green-600">{productoSeleccionado.bodega.stock_disponible}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Distribución por Vendedor
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {productoSeleccionado.vendedores.length > 0 ? (
                    productoSeleccionado.vendedores.map((v, idx) => (
                      <div key={`${v.id_vendedor}-${idx}`} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">{v.nombre}</span>
                        <Badge variant="info">{v.cantidad} und</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-2 text-gray-500">Sin distribución</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Últimos Movimientos Relacionados
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {productoSeleccionado.movimientos.length > 0 ? (
                    productoSeleccionado.movimientos.slice(0, 8).map((m, idx) => (
                      <div key={`${m.fecha}-${idx}`} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div>
                          <p className="text-sm font-medium">{m.tipo}</p>
                          <p className="text-xs text-gray-500">{new Date(m.fecha).toLocaleString()}</p>
                        </div>
                        <Badge variant={m.direccion === 'ASIGNACION_A_VENDEDOR' ? 'success' : 'warning'}>
                          {m.direccion === 'ASIGNACION_A_VENDEDOR' ? '+' : '-'}{m.cantidad}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-2 text-gray-500">Sin movimientos relacionados</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </LayoutContainer>
  )
}
