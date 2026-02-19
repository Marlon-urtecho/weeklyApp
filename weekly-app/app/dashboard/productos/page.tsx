'use client'

import { useState, useEffect } from 'react'
import LayoutContainer from '@/components/layout/LayoutContainer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabPanel } from '@/components/ui/Tabs'
import { ProductoForm } from '@/components/forms/ProductoForm'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'
import { formatCompactCurrency, formatCurrency } from '@/lib/utils'

interface Producto {
  id_producto: number
  nombre: string
  categoria: {
    id_categoria: number
    nombre_categoria: string
  }
  precio_contado: number
  precio_credito: number
  inventario_bodega?: {
    stock_total: number
    stock_disponible: number
  }
  inventario_vendedor?: Array<{
    cantidad: number
    vendedor: {
      nombre: string
    }
  }>
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalMovimiento, setModalMovimiento] = useState(false)
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null)
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [tipoMovimiento, setTipoMovimiento] = useState<'entrada' | 'salida'>('entrada')
  const [cantidadMovimiento, setCantidadMovimiento] = useState('')
  const [observacionMovimiento, setObservacionMovimiento] = useState('')
  const [submittingMovimiento, setSubmittingMovimiento] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')
  const [stockFiltro, setStockFiltro] = useState('todos')
  const [activeTab, setActiveTab] = useState('todos')
  const [stats, setStats] = useState({
    total: 0,
    categorias: 0,
    valorInventario: 0,
    stockBajo: 0
  })
  
  const { showToast } = useToast()

  useEffect(() => {
    cargarProductos()
  }, [])

  useEffect(() => {
    calcularStats()
  }, [productos])

  const cargarProductos = async () => {
    try {
      setLoading(true)
      const data = await apiClient.get('/api/productos/inventario/completo')
      const normalizado: Producto[] = (Array.isArray(data) ? data : []).map((p: any) => {
        const inventarioBodega = Array.isArray(p.inventario_bodega)
          ? p.inventario_bodega[0]
          : p.inventario_bodega

        return {
          id_producto: p.id_producto,
          nombre: p.nombre ?? `Producto #${p.id_producto}`,
          categoria: {
            id_categoria: p.categoria?.id_categoria ?? p.categorias?.id_categoria ?? p.id_categoria ?? 0,
            nombre_categoria:
              p.categoria?.nombre_categoria ??
              p.categorias?.nombre_categoria ??
              'Sin categoria'
          },
          precio_contado: Number(p.precio_contado ?? 0),
          precio_credito: Number(p.precio_credito ?? 0),
          inventario_bodega: inventarioBodega
            ? {
                stock_total: Number(inventarioBodega.stock_total ?? 0),
                stock_disponible: Number(inventarioBodega.stock_disponible ?? 0)
              }
            : undefined,
          inventario_vendedor: Array.isArray(p.inventario_vendedor)
            ? p.inventario_vendedor.map((inv: any) => ({
                cantidad: Number(inv.cantidad ?? 0),
                vendedor: {
                  nombre: inv.vendedor?.nombre ?? inv.vendedores?.nombre ?? 'Sin nombre'
                }
              }))
            : []
        }
      })

      setProductos(normalizado)
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const calcularStats = () => {
    const categoriasUnicas = new Set(productos.map(p => p.categoria?.nombre_categoria))
    const valorTotal = productos.reduce((total, p) => 
      total + (p.precio_credito * (p.inventario_bodega?.stock_disponible || 0)), 0
    )
    const stockBajo = productos.filter(p => 
      (p.inventario_bodega?.stock_disponible || 0) < 10
    ).length

    setStats({
      total: productos.length,
      categorias: categoriasUnicas.size,
      valorInventario: valorTotal,
      stockBajo
    })
  }

  const handleEdit = (producto: Producto) => {
    setProductoEditando(producto)
    setModalAbierto(true)
  }

  const handleMovimiento = (producto: Producto) => {
    setProductoSeleccionado(producto)
    setTipoMovimiento('entrada')
    setCantidadMovimiento('')
    setObservacionMovimiento('')
    setModalMovimiento(true)
  }

  const handleDelete = async (producto: Producto) => {
    const confirmar = window.confirm(`¿Eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`)
    if (!confirmar) return

    try { 
      await apiClient.delete(`/api/productos/${producto.id_producto}`)
      showToast('Producto eliminado correctamente', 'success')
      cargarProductos()
    } catch (error: any) {
      showToast(error.message, 'error')
    }
  }

  const handleRegistrarMovimiento = async (tipo: 'entrada' | 'salida', cantidad: number, observacion?: string) => {
    if (!productoSeleccionado) return

    try {
      setSubmittingMovimiento(true)
      if (cantidad <= 0 || Number.isNaN(cantidad)) {
        showToast('La cantidad debe ser mayor a 0', 'error')
        return
      }

      if (tipo === 'salida') {
        const stockActual = productoSeleccionado.inventario_bodega?.stock_disponible || 0
        if (cantidad > stockActual) {
          showToast(`Stock insuficiente. Disponible: ${stockActual}`, 'error')
          return
        }
      }

      if (tipo === 'entrada') {
        await apiClient.post('/api/inventario/bodega/entrada', {
          id_producto: productoSeleccionado.id_producto,
          cantidad,
          observacion: observacion || 'Ajuste de inventario desde productos'
        })
      } else {
        await apiClient.post('/api/inventario/bodega/salida', {
          id_producto: productoSeleccionado.id_producto,
          cantidad,
          destino: 'AJUSTE',
          observacion: observacion || 'Ajuste de inventario desde productos'
        })
      }
      showToast('Movimiento registrado', 'success')
      cargarProductos()
      setModalMovimiento(false)
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setSubmittingMovimiento(false)
    }
  }

  const submitMovimiento = async () => {
    const cantidad = Number(cantidadMovimiento)
    if (Number.isNaN(cantidad) || cantidad <= 0) {
      showToast('Ingresa una cantidad válida', 'error')
      return
    }
    await handleRegistrarMovimiento(tipoMovimiento, cantidad, observacionMovimiento)
  }

  const handleExportExcel = () => {
    try {
      const source = filteredProductos.length > 0 ? filteredProductos : productos
      if (source.length === 0) {
        showToast('No hay datos para exportar', 'info')
        return
      }

      const escapeCell = (value: string | number) => {
        const text = String(value ?? '').replace(/"/g, '""')
        return `"${text}"`
      }

      const totalUnidades = source.reduce((sum, p) => sum + (p.inventario_bodega?.stock_disponible || 0), 0)
      const valorTotalInventario = source.reduce(
        (sum, p) => sum + ((p.inventario_bodega?.stock_disponible || 0) * p.precio_credito),
        0
      )
      const productosSinStock = source.filter((p) => (p.inventario_bodega?.stock_disponible || 0) === 0)
      const productosStockBajo = source.filter((p) => {
        const stock = p.inventario_bodega?.stock_disponible || 0
        return stock > 0 && stock < 10
      })
      const valorPromedioPorProducto = source.length > 0 ? valorTotalInventario / source.length : 0
      const precioPromedio = source.length > 0
        ? source.reduce((sum, p) => sum + p.precio_credito, 0) / source.length
        : 0

      const topValorInventario = [...source]
        .map((p) => ({
          ...p,
          valor_inventario: (p.inventario_bodega?.stock_disponible || 0) * p.precio_credito
        }))
        .sort((a, b) => b.valor_inventario - a.valor_inventario)
        .slice(0, 10)

      const alertasCriticas = [...source]
        .map((p) => ({
          ...p,
          stock: p.inventario_bodega?.stock_disponible || 0
        }))
        .filter((p) => p.stock <= 10)
        .sort((a, b) => a.stock - b.stock)

      const categoriasResumen = source.reduce((acc, p) => {
        const categoria = p.categoria?.nombre_categoria || 'Sin categoria'
        const stock = p.inventario_bodega?.stock_disponible || 0
        const valor = stock * p.precio_credito

        if (!acc[categoria]) {
          acc[categoria] = {
            categoria,
            productos: 0,
            stock_total: 0,
            valor_total: 0
          }
        }

        acc[categoria].productos += 1
        acc[categoria].stock_total += stock
        acc[categoria].valor_total += valor
        return acc
      }, {} as Record<string, { categoria: string; productos: number; stock_total: number; valor_total: number }>)

      const categoriasRows = Object.values(categoriasResumen).sort((a, b) => b.valor_total - a.valor_total)

      const rows: Array<Array<string | number>> = []
      const fechaReporte = new Date().toLocaleString('es-GT')

      rows.push(['REPORTE DE INVENTARIO Y PRODUCTOS'])
      rows.push(['Generado', fechaReporte])
      rows.push(['Cobertura de datos', filteredProductos.length > 0 ? 'Productos filtrados' : 'Todos los productos'])
      rows.push([])

      rows.push(['KPIs CLAVE'])
      rows.push(['Metrica', 'Valor'])
      rows.push(['Total productos', source.length])
      rows.push(['Total categorias', new Set(source.map((p) => p.categoria?.nombre_categoria)).size])
      rows.push(['Unidades disponibles', totalUnidades])
      rows.push(['Valor total inventario (precio credito)', valorTotalInventario.toFixed(2)])
      rows.push(['Valor promedio por producto', valorPromedioPorProducto.toFixed(2)])
      rows.push(['Precio promedio credito', precioPromedio.toFixed(2)])
      rows.push(['Productos sin stock', productosSinStock.length])
      rows.push(['Productos con stock bajo (1-9)', productosStockBajo.length])
      rows.push([])

      rows.push(['ALERTAS DE REABASTECIMIENTO'])
      rows.push(['ID', 'Producto', 'Categoria', 'Stock Disponible', 'Nivel', 'Accion sugerida'])
      alertasCriticas.forEach((p) => {
        const stock = p.stock
        const nivel = stock === 0 ? 'Critico' : stock <= 5 ? 'Alto riesgo' : 'Atencion'
        const accion = stock === 0 ? 'Reabastecer urgente' : 'Programar reposicion'
        rows.push([
          p.id_producto,
          p.nombre,
          p.categoria?.nombre_categoria ?? '',
          stock,
          nivel,
          accion
        ])
      })
      rows.push([])

      rows.push(['TOP 10 PRODUCTOS POR VALOR EN INVENTARIO'])
      rows.push(['ID', 'Producto', 'Categoria', 'Stock Disponible', 'Precio Credito', 'Valor Inventario'])
      topValorInventario.forEach((p) => {
        rows.push([
          p.id_producto,
          p.nombre,
          p.categoria?.nombre_categoria ?? '',
          p.inventario_bodega?.stock_disponible || 0,
          p.precio_credito.toFixed(2),
          p.valor_inventario.toFixed(2)
        ])
      })
      rows.push([])

      rows.push(['RESUMEN POR CATEGORIA'])
      rows.push(['Categoria', 'Cantidad Productos', 'Stock Total', 'Valor Total Inventario'])
      categoriasRows.forEach((c) => {
        rows.push([c.categoria, c.productos, c.stock_total, c.valor_total.toFixed(2)])
      })
      rows.push([])

      rows.push(['DETALLE COMPLETO PRODUCTOS'])
      rows.push([
        'ID',
        'Producto',
        'Categoria',
        'Precio Contado',
        'Precio Credito',
        'Stock Total',
        'Stock Disponible',
        'Valor Inventario'
      ])
      source.forEach((p) => {
        const stockTotal = p.inventario_bodega?.stock_total || 0
        const stockDisponible = p.inventario_bodega?.stock_disponible || 0
        const valorInventario = stockDisponible * p.precio_credito
        rows.push([
          p.id_producto,
          p.nombre,
          p.categoria?.nombre_categoria ?? '',
          p.precio_contado.toFixed(2),
          p.precio_credito.toFixed(2),
          stockTotal,
          stockDisponible,
          valorInventario.toFixed(2)
        ])
      })

      const csvContent = rows
        .map((row) => row.map((cell) => escapeCell(cell)).join(','))
        .join('\n')

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const today = new Date().toISOString().slice(0, 10)
      link.href = url
      link.setAttribute('download', `reporte_inventario_productos_${today}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      showToast('Archivo exportado correctamente', 'success')
    } catch (error: any) {
      showToast(error.message || 'No se pudo exportar', 'error')
    }
  }

  const handlePrint = () => {
    try {
      const source = filteredProductos.length > 0 ? filteredProductos : productos
      if (source.length === 0) {
        showToast('No hay datos para imprimir', 'info')
        return
      }

      const rowsHtml = source
        .map((p) => {
          const stock = p.inventario_bodega?.stock_disponible || 0
          const categoria = p.categoria?.nombre_categoria || 'Sin categoria'
          return `
            <tr>
              <td>${p.id_producto}</td>
              <td>${p.nombre}</td>
              <td>${categoria}</td>
              <td>${p.precio_contado.toFixed(2)}</td>
              <td>${p.precio_credito.toFixed(2)}</td>
              <td>${stock}</td>
            </tr>
          `
        })
        .join('')

      const fecha = new Date().toLocaleString('es-GT')
      const popup = window.open('', '_blank', 'width=1100,height=800')
      if (!popup) {
        showToast('El navegador bloqueó la ventana de impresión', 'error')
        return
      }

      popup.document.write(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Reporte de Productos</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
              h1 { margin: 0 0 4px 0; font-size: 20px; }
              p { margin: 0 0 16px 0; font-size: 12px; color: #444; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background: #f4f4f4; }
              .summary { margin-bottom: 12px; font-size: 12px; }
              @media print {
                body { margin: 12px; }
              }
            </style>
          </head>
          <body>
            <h1>Reporte de Productos</h1>
            <p>Generado: ${fecha}</p>
            <div class="summary">
              <strong>Total productos:</strong> ${source.length}
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio Contado</th>
                  <th>Precio Crédito</th>
                  <th>Stock Disponible</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </body>
        </html>
      `)

      popup.document.close()
      popup.focus()
      popup.print()
      popup.close()
    } catch (error: any) {
      showToast(error.message || 'No se pudo imprimir', 'error')
    }
  }

  const filteredProductos = productos.filter(p => {
    // Filtro por pestaña
    if (activeTab === 'stockBajo' && (p.inventario_bodega?.stock_disponible || 0) >= 10) return false
    if (activeTab === 'sinStock' && (p.inventario_bodega?.stock_disponible || 0) > 0) return false

    if (stockFiltro === 'disponible' && (p.inventario_bodega?.stock_disponible || 0) <= 0) return false
    if (stockFiltro === 'bajo') {
      const stock = p.inventario_bodega?.stock_disponible || 0
      if (stock <= 0 || stock >= 10) return false
    }
    if (stockFiltro === 'agotado' && (p.inventario_bodega?.stock_disponible || 0) > 0) return false
    
    // Filtro por búsqueda
    const nombre = (p.nombre ?? '').toLowerCase()
    const categoriaNombre = (p.categoria?.nombre_categoria ?? '').toLowerCase()
    const termino = searchTerm.toLowerCase()
    const matchesSearch = nombre.includes(termino) || categoriaNombre.includes(termino)
    
    // Filtro por categoría
    const matchesCategoria = categoriaFiltro === 'todas' || 
                            p.categoria?.nombre_categoria === categoriaFiltro
    
    return matchesSearch && matchesCategoria
  })

  const statsCards = [
    {
      title: 'Total Productos',
      value: stats.total,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'blue' as const,
      change: 8
    },
    {
      title: 'Categorías',
      value: stats.categorias,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-5-5A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      color: 'purple' as const,
      change: 5
    },
    {
      title: 'Valor Inventario',
      value: formatCompactCurrency(stats.valorInventario),
      valueTitle: formatCurrency(stats.valorInventario),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'green' as const,
      change: 12
    },
    {
      title: 'Stock Bajo',
      value: stats.stockBajo,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: 'red' as const,
      change: -5
    }
  ]

  const categorias = ['todas', ...new Set(productos.map(p => p.categoria?.nombre_categoria).filter(Boolean))]

  const columns = [
    {
      key: 'nombre',
      header: 'Producto',
      cell: (item: Producto) => (
        <div className="min-w-[200px]">
          <p className="font-medium text-gray-900 dark:text-white">{item.nombre}</p>
          <Badge variant="secondary" size="sm">
            {item.categoria?.nombre_categoria}
          </Badge>
        </div>
      )
    },
    {
      key: 'precios',
      header: 'Precios',
      cell: (item: Producto) => (
        <div className="space-y-1 min-w-[120px]">
          <p className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Contado:</span>{' '}
            <span className="font-medium text-green-600 dark:text-green-400">
              {formatCurrency(item.precio_contado)}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Crédito:</span>{' '}
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {formatCurrency(item.precio_credito)}
            </span>
          </p>
        </div>
      )
    },
    {
      key: 'stock',
      header: 'Stock en Bodega',
      cell: (item: Producto) => {
        const stock = item.inventario_bodega?.stock_disponible || 0
        return (
          <div className="min-w-[100px]">
            <Badge variant={stock > 10 ? 'success' : stock > 0 ? 'warning' : 'error'}>
              {stock} unidades
            </Badge>
          </div>
        )
      }
    },
    {
      key: 'distribucion',
      header: 'Distribución',
      cell: (item: Producto) => (
        <div className="min-w-[150px]">
          {item.inventario_vendedor && item.inventario_vendedor.length > 0 ? (
            <div className="space-y-1">
              {item.inventario_vendedor.slice(0, 2).map((inv, idx) => (
                <p key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                  {inv.vendedor.nombre}: {inv.cantidad} und
                </p>
              ))}
              {item.inventario_vendedor.length > 2 && (
                <p className="text-xs text-gray-500">
                  +{item.inventario_vendedor.length - 2} más
                </p>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">Sin distribución</span>
          )}
        </div>
      )
    },
    {
      key: 'acciones',
      header: 'Acciones',
      cell: (item: Producto) => (
        <div className="flex flex-wrap gap-2 min-w-[160px]">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(item)
            }}
          >
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleMovimiento(item)
            }}
          >
            Stock
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(item)
            }}
          >
            Eliminar
          </Button>
        </div>
      )
    }
  ]

  return (
    <LayoutContainer>
      <div className="space-y-6">
        {/* Header Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Productos
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Gestiona tu catálogo de productos e inventario
            </p>
          </div>
          <Button 
            onClick={() => {
              setProductoEditando(null)
              setModalAbierto(true)
            }}
            className="w-full sm:w-auto"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Producto
          </Button>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={statsCards} />

        {/* Tabs Responsive */}
        <Card>
          <Tabs
            tabs={[
              { id: 'todos', label: 'Todos los Productos' },
              { id: 'stockBajo', label: 'Stock Bajo' },
              { id: 'sinStock', label: 'Sin Stock' }
            ]}
            defaultTab="todos"
            onChange={setActiveTab}
            variant="pills"
          />
        </Card>

        {/* Filtros Responsive */}
        <Card>
          <div className="space-y-4">
            {/* Búsqueda */}
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />

            {/* Filtros en grid responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {categorias.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'todas' ? 'Todas las categorías' : cat}
                  </option>
                ))}
              </select>

              <select
                value={stockFiltro}
                onChange={(e) => setStockFiltro(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="todos">Todos los stocks</option>
                <option value="disponible">Con stock</option>
                <option value="bajo">Stock bajo</option>
                <option value="agotado">Agotado</option>
              </select>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={handleExportExcel}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar Excel
              </Button>
              <Button variant="secondary" size="sm" onClick={handlePrint}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabla de Productos - Scroll horizontal en móvil */}
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table
              data={filteredProductos}
              columns={columns}
              loading={loading}
              onRowClick={handleEdit}
            />
          </div>

          {/* Paginación responsive */}
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando <span className="font-medium">{filteredProductos.length}</span> de{' '}
                <span className="font-medium">{productos.length}</span> productos
              </p>
              <div className="flex justify-center sm:justify-end space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
                <Button variant="outline" size="sm">
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Modal de Producto */}
        <Modal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          title={productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
          size="lg"
        >
          <ProductoForm
            productoId={productoEditando?.id_producto}
            onSuccess={() => {
              setModalAbierto(false)
              cargarProductos()
            }}
            onCancel={() => setModalAbierto(false)}
          />
        </Modal>

        {/* Modal de Movimiento de Stock */}
        <Modal
          isOpen={modalMovimiento}
          onClose={() => setModalMovimiento(false)}
          title={`Ajustar Stock - ${productoSeleccionado?.nombre || ''}`}
          size="md"
        >
          <div className="space-y-6">
            {/* Información actual */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Stock Actual</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {productoSeleccionado?.inventario_bodega?.stock_disponible || 0}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Precio Crédito</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(productoSeleccionado?.precio_credito || 0)}
                </p>
              </div>
            </div>

            {/* Formulario de movimiento */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo de movimiento</label>
                <select
                  value={tipoMovimiento}
                  onChange={(e) => setTipoMovimiento(e.target.value as 'entrada' | 'salida')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Motivo del movimiento (opcional)"
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>Nota:</strong> Los movimientos quedarán registrados en el historial.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setModalMovimiento(false)}>
                  Cancelar
                </Button>
                <Button onClick={submitMovimiento} loading={submittingMovimiento}>
                  Guardar Movimiento
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </LayoutContainer>
  )
}
