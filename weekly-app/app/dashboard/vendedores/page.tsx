'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import LayoutContainer from '@/components/layout/LayoutContainer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { VendedoresTable } from '@/components/tables/VendedoresTable'
import { VendedorForm } from '@/components/forms/VendedorForm'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import type { Vendedor } from '@/types/vendedor'

type VendedorDetalle = Vendedor & {
  rutasDetalle: Array<{ id_ruta: number; codigo_ruta?: string; nombre_ruta: string; zona?: string }>
  clientesRuta: Array<{ id_cliente: number; codigo_cliente: string; nombre: string; id_ruta: number }>
  creditosDetalle: Array<{
    id_credito: number
    estado: string
    monto_total: number
    saldo_pendiente: number
    fecha_inicio?: string
    created_at?: string
    cliente?: { id_cliente: number; nombre: string; codigo_cliente: string; id_ruta?: number }
    pagos: Array<{ id_pago: number; fecha_pago: string; monto_pagado: number; metodo_pago?: string }>
    credito_detalle?: Array<{ id_producto: number; nombre_producto: string; cantidad: number; subtotal: number }>
  }>
  inventarioDetalle: Array<{ id: number; cantidad: number; producto: { id_producto?: number; nombre: string; precio_credito: number } }>
}

const toNumber = (value: any) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export default function VendedoresPage() {
  const router = useRouter()
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalRutas, setModalRutas] = useState(false)
  const [modalInventario, setModalInventario] = useState(false)
  const [modalCreditos, setModalCreditos] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [vendedorEditando, setVendedorEditando] = useState<Vendedor | null>(null)
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState<Vendedor | null>(null)
  const [detalleSeleccionado, setDetalleSeleccionado] = useState<VendedorDetalle | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'activos' | 'inactivos'>('todos')
  const [nuevaRutaId, setNuevaRutaId] = useState('')
  const [productosBodega, setProductosBodega] = useState<
    Array<{ id_producto: number; nombre: string; categoria: string; stock_disponible: number }>
  >([])
  const [asignarProductoId, setAsignarProductoId] = useState('')
  const [asignarCantidad, setAsignarCantidad] = useState('')
  const [asignandoInventario, setAsignandoInventario] = useState(false)
  const [auditInicio, setAuditInicio] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  )
  const [auditFin, setAuditFin] = useState(new Date().toISOString().split('T')[0])
  const [inventarioSearch, setInventarioSearch] = useState('')
  const [inventarioFiltro, setInventarioFiltro] = useState<'todos' | 'con_stock' | 'sin_stock'>('todos')
  const [creditosSearch, setCreditosSearch] = useState('')
  const [creditosFiltroEstado, setCreditosFiltroEstado] = useState<'todos' | 'ACTIVO' | 'MOROSO' | 'PAGADO'>('todos')
  const [rutasDisponibles, setRutasDisponibles] = useState<Array<{ id_ruta: number; codigo_ruta?: string; nombre_ruta: string; zona?: string }>>([])
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    conInventario: 0,
    valorInventario: 0
  })

  const { token } = useAuth()
  const { showToast } = useToast()

  const mapVendedor = (raw: any): Vendedor => {
    const rutasRaw = Array.isArray(raw?.rutas)
      ? raw.rutas
      : Array.isArray(raw?.ruta_vendedor)
        ? raw.ruta_vendedor.filter((rv: any) => rv?.activo !== false).map((rv: any) => rv?.rutas)
        : []

    return {
      id_vendedor: Number(raw?.id_vendedor),
      id_usuario: Number(raw?.id_usuario),
      nombre: raw?.nombre ?? 'Sin nombre',
      telefono: raw?.telefono ?? '',
      activo: Boolean(raw?.activo),
      created_at: raw?.created_at,
      usuario: raw?.usuario ?? raw?.usuarios
        ? {
            id_usuario: Number(raw?.usuario?.id_usuario ?? raw?.usuarios?.id_usuario),
            username: raw?.usuario?.username ?? raw?.usuarios?.username ?? '',
            nombre: raw?.usuario?.nombre ?? raw?.usuarios?.nombre,
            email: raw?.usuario?.email ?? raw?.usuarios?.email,
            activo: raw?.usuario?.activo ?? raw?.usuarios?.activo
          }
        : undefined,
      rutas: (rutasRaw || [])
        .filter(Boolean)
        .map((ruta: any) => ({
          id_ruta: Number(ruta.id_ruta),
          nombre_ruta: ruta.nombre_ruta ?? 'Ruta sin nombre',
          codigo_ruta: ruta.codigo_ruta,
          zona: ruta.zona,
          sitio: ruta.sitio ?? ruta.zona,
          clientes_count: Array.isArray(ruta.clientes) ? ruta.clientes.length : ruta.clientes_count
        })),
      inventario: Array.isArray(raw?.inventario_vendedor)
        ? raw.inventario_vendedor.map((it: any) => ({
            id: Number(it.id),
            cantidad: toNumber(it.cantidad),
            producto: {
              id_producto: Number(it?.productos?.id_producto),
              nombre: it?.productos?.nombre ?? 'Producto',
              precio_credito: toNumber(it?.productos?.precio_credito)
            }
          }))
        : [],
      creditos: Array.isArray(raw?.creditos)
        ? raw.creditos.map((c: any) => ({
            id_credito: Number(c.id_credito),
            estado: c.estado ?? 'ACTIVO',
            monto_total: toNumber(c.monto_total),
            saldo_pendiente: toNumber(c.saldo_pendiente)
          }))
        : []
    }
  }

  const mapDetalle = (raw: any): VendedorDetalle => {
    const base = mapVendedor(raw)
    const rutasDetalle = Array.isArray(raw?.ruta_vendedor)
      ? raw.ruta_vendedor.filter((rv: any) => rv?.activo !== false).map((rv: any) => rv?.rutas).filter(Boolean)
      : []

    const inventarioDetalle = Array.isArray(raw?.inventario_vendedor)
      ? raw.inventario_vendedor.map((it: any) => ({
          id: Number(it.id),
          cantidad: toNumber(it.cantidad),
          producto: {
            id_producto: Number(it?.productos?.id_producto),
            nombre: it?.productos?.nombre ?? 'Producto',
            precio_credito: toNumber(it?.productos?.precio_credito)
          }
        }))
      : []

    const creditosDetalle = Array.isArray(raw?.creditos)
      ? raw.creditos.map((c: any) => ({
          id_credito: Number(c.id_credito),
          estado: c.estado ?? 'ACTIVO',
          monto_total: toNumber(c.monto_total),
          saldo_pendiente: toNumber(c.saldo_pendiente),
          fecha_inicio: c.fecha_inicio,
          created_at: c.created_at,
          cliente: c?.clientes
            ? {
                id_cliente: Number(c.clientes.id_cliente),
                nombre: c.clientes.nombre ?? 'Cliente',
                codigo_cliente: c.clientes.codigo_cliente ?? '',
                id_ruta: Number(c.clientes.id_ruta)
              }
            : undefined,
          pagos: Array.isArray(c?.pagos)
            ? c.pagos.map((p: any) => ({
                id_pago: Number(p.id_pago),
                fecha_pago: p.fecha_pago,
                monto_pagado: toNumber(p.monto_pagado),
                metodo_pago: p.metodo_pago ?? undefined
              }))
            : [],
          credito_detalle: Array.isArray(c?.credito_detalle)
            ? c.credito_detalle.map((d: any) => ({
                id_producto: Number(d.id_producto),
                nombre_producto: d?.productos?.nombre ?? `Producto ${d.id_producto}`,
                cantidad: toNumber(d.cantidad),
                subtotal: toNumber(d.subtotal)
              }))
            : []
        }))
      : []

    return {
      ...base,
      rutasDetalle,
      clientesRuta: [],
      inventarioDetalle,
      creditosDetalle
    }
  }

  const cargarVendedores = async () => {
    try {
      setLoading(true)
      const [vendedoresRaw, clientesRaw] = await Promise.all([
        apiClient.get('/api/vendedores?include=all'),
        apiClient.get('/api/clientes?activos=true')
      ])

      const vendedoresBase = (Array.isArray(vendedoresRaw) ? vendedoresRaw : []).map(mapVendedor)
      const clientes = Array.isArray(clientesRaw) ? clientesRaw : []

      // Completa clientes/créditos por rutas asignadas, aunque el crédito no tenga id_vendedor igual.
      const vendedoresConRutas = vendedoresBase.map((vendedor) => {
        const routeIds = new Set((vendedor.rutas || []).map((r) => Number(r.id_ruta)))
        const clientesRuta = clientes.filter((c: any) => routeIds.has(Number(c?.id_ruta)))

        const creditosMap = new Map<number, { id_credito: number; estado: string; monto_total: number; saldo_pendiente: number }>()
        for (const cliente of clientesRuta) {
          for (const credito of Array.isArray(cliente?.creditos) ? cliente.creditos : []) {
            const id = Number(credito?.id_credito)
            if (Number.isNaN(id) || creditosMap.has(id)) continue
            creditosMap.set(id, {
              id_credito: id,
              estado: credito?.estado ?? 'ACTIVO',
              monto_total: toNumber(credito?.monto_total),
              saldo_pendiente: toNumber(credito?.saldo_pendiente)
            })
          }
        }

        const rutasActualizadas = (vendedor.rutas || []).map((ruta) => ({
          ...ruta,
          clientes_count: clientesRuta.filter((c: any) => Number(c?.id_ruta) === Number(ruta.id_ruta)).length
        }))

        return {
          ...vendedor,
          rutas: rutasActualizadas,
          creditos: Array.from(creditosMap.values())
        }
      })

      // Carga inventario real de cada vendedor desde su detalle.
      const detalles = await Promise.allSettled(
        vendedoresConRutas.map((v) => apiClient.get(`/api/vendedores/${v.id_vendedor}`))
      )

      const enriquecidos = vendedoresConRutas.map((vendedor, index) => {
        const detalle = detalles[index]
        if (detalle.status !== 'fulfilled') return vendedor
        const inventario = Array.isArray((detalle.value as any)?.inventario_vendedor)
          ? (detalle.value as any).inventario_vendedor.map((it: any) => ({
              id: Number(it.id),
              cantidad: toNumber(it.cantidad),
              producto: {
                id_producto: Number(it?.productos?.id_producto),
                nombre: it?.productos?.nombre ?? 'Producto',
                precio_credito: toNumber(it?.productos?.precio_credito)
              }
            }))
          : vendedor.inventario || []

        return {
          ...vendedor,
          inventario
        }
      })

      setVendedores(enriquecidos)
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const cargarRutas = async () => {
    try {
      const data = await apiClient.get('/api/rutas?activas=true')
      const rutas = (Array.isArray(data) ? data : []).map((r: any) => ({
        id_ruta: Number(r.id_ruta),
        codigo_ruta: r.codigo_ruta,
        nombre_ruta: r.nombre_ruta ?? 'Ruta',
        zona: r.zona
      }))
      setRutasDisponibles(rutas.filter((r: any) => !Number.isNaN(r.id_ruta)))
    } catch (error: any) {
      showToast(error.message || 'No se pudieron cargar rutas', 'error')
    }
  }

  const cargarProductosBodega = async () => {
    try {
      const data = await apiClient.get('/api/inventario/bodega')
      const productos = (Array.isArray(data) ? data : []).map((item: any) => ({
        id_producto: Number(item?.id_producto),
        nombre: item?.productos?.nombre ?? `Producto ${item?.id_producto}`,
        categoria: item?.productos?.categorias?.nombre_categoria ?? 'Sin categoria',
        stock_disponible: toNumber(item?.stock_disponible)
      }))
      setProductosBodega(productos.filter((p) => p.id_producto > 0))
    } catch (error: any) {
      showToast(error.message || 'No se pudo cargar inventario de bodega', 'error')
    }
  }

  const cargarDetalle = async (idVendedor: number) => {
    try {
      setLoadingDetalle(true)
      const [raw, clientesRaw] = await Promise.all([
        apiClient.get(`/api/vendedores/${idVendedor}`),
        apiClient.get('/api/clientes?activos=true')
      ])

      const detalle = mapDetalle(raw)
      const routeIds = new Set<number>((detalle.rutasDetalle || []).map((r) => Number(r.id_ruta)))
      const clientesRutas = (Array.isArray(clientesRaw) ? clientesRaw : [])
        .filter((c: any) => routeIds.has(Number(c.id_ruta)))
        .map((c: any) => ({
          id_cliente: Number(c.id_cliente),
          codigo_cliente: c.codigo_cliente ?? '',
          nombre: c.nombre ?? 'Cliente',
          id_ruta: Number(c.id_ruta),
          creditos: Array.isArray(c.creditos) ? c.creditos : []
        }))

      const creditosPorRuta = clientesRutas.flatMap((c: any) =>
        c.creditos.map((cr: any) => ({
          id_credito: Number(cr.id_credito),
          estado: cr.estado ?? 'ACTIVO',
          monto_total: toNumber(cr.monto_total),
          saldo_pendiente: toNumber(cr.saldo_pendiente),
          fecha_inicio: cr.fecha_inicio,
          created_at: cr.created_at,
          cliente: {
            id_cliente: c.id_cliente,
            nombre: c.nombre,
            codigo_cliente: c.codigo_cliente,
            id_ruta: c.id_ruta
          },
          pagos: Array.isArray(cr.pagos)
            ? cr.pagos.map((p: any) => ({
                id_pago: Number(p.id_pago),
                fecha_pago: p.fecha_pago,
                monto_pagado: toNumber(p.monto_pagado),
                metodo_pago: p.metodo_pago ?? undefined
              }))
            : [],
          credito_detalle: Array.isArray(cr?.credito_detalle)
            ? cr.credito_detalle.map((d: any) => ({
                id_producto: Number(d.id_producto),
                nombre_producto: d?.productos?.nombre ?? `Producto ${d.id_producto}`,
                cantidad: toNumber(d.cantidad),
                subtotal: toNumber(d.subtotal)
              }))
            : []
        }))
      )

      const uniqueCreditosMap = new Map<number, any>()
      for (const credito of creditosPorRuta) {
        if (!uniqueCreditosMap.has(credito.id_credito)) {
          uniqueCreditosMap.set(credito.id_credito, credito)
        }
      }

      detalle.clientesRuta = clientesRutas.map((c: any) => ({
        id_cliente: c.id_cliente,
        codigo_cliente: c.codigo_cliente,
        nombre: c.nombre,
        id_ruta: c.id_ruta
      }))
      detalle.creditosDetalle =
        uniqueCreditosMap.size > 0 ? Array.from(uniqueCreditosMap.values()) : detalle.creditosDetalle

      setDetalleSeleccionado(detalle)
      return detalle
    } catch (error: any) {
      showToast(error.message || 'No se pudo cargar el detalle del vendedor', 'error')
      return null
    } finally {
      setLoadingDetalle(false)
    }
  }

  useEffect(() => {
    if (token) {
      cargarVendedores()
      cargarRutas()
    }
  }, [token])

  useEffect(() => {
    const activos = vendedores.filter((v) => v.activo).length
    const conInventario = vendedores.filter((v) => (v.inventario?.length || 0) > 0).length
    const valorInventario = vendedores.reduce((total, v) => {
      const valor = v.inventario?.reduce((sum, item) => sum + item.cantidad * Number(item.producto?.precio_credito || 0), 0) || 0
      return total + valor
    }, 0)
    setStats({ total: vendedores.length, activos, conInventario, valorInventario })
  }, [vendedores])

  const handleEdit = (vendedor: Vendedor) => {
    setVendedorEditando(vendedor)
    setModalAbierto(true)
  }

  const handleToggleStatus = async (vendedor: Vendedor) => {
    try {
      await apiClient.put(`/api/vendedores/${vendedor.id_vendedor}`, { activo: !vendedor.activo })
      showToast(`Vendedor ${!vendedor.activo ? 'activado' : 'desactivado'}`, 'success')
      cargarVendedores()
    } catch (error: any) {
      showToast(error.message, 'error')
    }
  }

  const abrirConDetalle = async (vendedor: Vendedor, modal: 'detalle' | 'rutas' | 'inventario' | 'creditos') => {
    setVendedorSeleccionado(vendedor)
    setNuevaRutaId('')
    setAsignarProductoId('')
    setAsignarCantidad('')
    await cargarDetalle(vendedor.id_vendedor)
    if (modal === 'inventario') {
      await cargarProductosBodega()
    }
    if (modal === 'detalle') setModalDetalle(true)
    if (modal === 'rutas') setModalRutas(true)
    if (modal === 'inventario') setModalInventario(true)
    if (modal === 'creditos') setModalCreditos(true)
  }

  const handleAsignarRuta = async () => {
    if (!vendedorSeleccionado) return
    const idRuta = parseInt(nuevaRutaId, 10)
    if (Number.isNaN(idRuta)) {
      showToast('Selecciona una ruta válida', 'error')
      return
    }

    try {
      await apiClient.post(`/api/vendedores/${vendedorSeleccionado.id_vendedor}/rutas`, { id_ruta: idRuta })
      showToast('Ruta asignada correctamente', 'success')
      setNuevaRutaId('')
      await cargarVendedores()
      await cargarDetalle(vendedorSeleccionado.id_vendedor)
    } catch (error: any) {
      showToast(error.message, 'error')
    }
  }

  const handleDesasignarRuta = async (idRuta: number) => {
    if (!vendedorSeleccionado) return
    try {
      await apiClient.delete(`/api/vendedores/${vendedorSeleccionado.id_vendedor}/rutas?id_ruta=${idRuta}`)
      showToast('Ruta desasignada', 'success')
      await cargarVendedores()
      await cargarDetalle(vendedorSeleccionado.id_vendedor)
    } catch (error: any) {
      showToast(error.message, 'error')
    }
  }

  const handleAsignarInventario = async () => {
    if (!vendedorSeleccionado) return
    const idProducto = parseInt(asignarProductoId, 10)
    const cantidad = parseInt(asignarCantidad, 10)
    if (Number.isNaN(idProducto) || idProducto <= 0) {
      showToast('Selecciona un producto válido', 'error')
      return
    }
    if (Number.isNaN(cantidad) || cantidad <= 0) {
      showToast('Ingresa una cantidad válida', 'error')
      return
    }

    try {
      setAsignandoInventario(true)
      await apiClient.post(`/api/inventario/vendedor/${vendedorSeleccionado.id_vendedor}/asignar`, {
        id_producto: idProducto,
        cantidad
      })
      showToast('Inventario asignado correctamente al vendedor', 'success')
      setAsignarProductoId('')
      setAsignarCantidad('')
      await Promise.all([
        cargarDetalle(vendedorSeleccionado.id_vendedor),
        cargarProductosBodega(),
        cargarVendedores()
      ])
    } catch (error: any) {
      showToast(error.message || 'No se pudo asignar inventario', 'error')
    } finally {
      setAsignandoInventario(false)
    }
  }

  const exportarReporteVendedores = async () => {
    try {
      const [vendedoresRaw, clientesRaw] = await Promise.all([
        apiClient.get('/api/vendedores?include=all'),
        apiClient.get('/api/clientes?activos=true')
      ])
      const vendedoresBase = (Array.isArray(vendedoresRaw) ? vendedoresRaw : []).map(mapVendedor)
      const clientes = Array.isArray(clientesRaw) ? clientesRaw : []

      const escapeCell = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`
      const rows: Array<Array<string | number>> = []
      rows.push(['REPORTE DE VENDEDORES'])
      rows.push(['Generado', new Date().toLocaleString('es-GT')])
      rows.push([])
      rows.push([
        'Vendedor',
        'Usuario',
        'Estado',
        'Rutas',
        'Clientes en rutas',
        'Creditos activos',
        'Creditos morosos',
        'Monto activo',
        'Saldo pendiente activo',
        'Monto cobrado',
        'Rendimiento cobranza %',
        'Valor inventario'
      ])

      for (const vendedor of vendedoresBase) {
        const routeIds = new Set((vendedor.rutas || []).map((r) => Number(r.id_ruta)))
        const clientesRuta = clientes.filter((c: any) => routeIds.has(Number(c?.id_ruta)))
        const creditos = clientesRuta.flatMap((c: any) => (Array.isArray(c?.creditos) ? c.creditos : []))

        const activos = creditos.filter((c: any) => c.estado === 'ACTIVO')
        const morosos = creditos.filter((c: any) => c.estado === 'MOROSO')
        const montoActivo = activos.reduce((sum: number, c: any) => sum + toNumber(c.monto_total), 0)
        const saldoActivo = activos.reduce((sum: number, c: any) => sum + toNumber(c.saldo_pendiente), 0)
        const cobrado = creditos.reduce((sum: number, c: any) => {
          const pagos = Array.isArray(c?.pagos) ? c.pagos : []
          return sum + pagos.reduce((sub: number, p: any) => sub + toNumber(p?.monto_pagado), 0)
        }, 0)
        const rendimiento = montoActivo > 0 ? (cobrado / montoActivo) * 100 : 0

        const detalle = await apiClient.get(`/api/vendedores/${vendedor.id_vendedor}`)
        const inventario = Array.isArray(detalle?.inventario_vendedor) ? detalle.inventario_vendedor : []
        const valorInventario = inventario.reduce((sum: number, it: any) => {
          return sum + toNumber(it?.cantidad) * toNumber(it?.productos?.precio_credito)
        }, 0)

        rows.push([
          vendedor.nombre,
          vendedor.usuario?.username || '',
          vendedor.activo ? 'Activo' : 'Inactivo',
          (vendedor.rutas || []).map((r) => `${r.codigo_ruta || ''} ${r.nombre_ruta}`.trim()).join(' | '),
          clientesRuta.length,
          activos.length,
          morosos.length,
          montoActivo.toFixed(2),
          saldoActivo.toFixed(2),
          cobrado.toFixed(2),
          rendimiento.toFixed(2),
          valorInventario.toFixed(2)
        ])
      }

      rows.push([])
      rows.push(['DETALLE RUTAS/CLIENTES POR VENDEDOR'])
      rows.push(['Vendedor', 'Ruta', 'Cliente', 'Codigo Cliente', 'Creditos', 'Activos', 'Morosos', 'Saldo Pendiente'])
      for (const vendedor of vendedoresBase) {
        const routeIds = new Set((vendedor.rutas || []).map((r) => Number(r.id_ruta)))
        const clientesRuta = clientes.filter((c: any) => routeIds.has(Number(c?.id_ruta)))
        for (const cliente of clientesRuta) {
          const creditos = Array.isArray(cliente?.creditos) ? cliente.creditos : []
          rows.push([
            vendedor.nombre,
            (vendedor.rutas || []).find((r) => Number(r.id_ruta) === Number(cliente.id_ruta))?.nombre_ruta || `Ruta ${cliente.id_ruta}`,
            cliente.nombre || '',
            cliente.codigo_cliente || '',
            creditos.length,
            creditos.filter((c: any) => c.estado === 'ACTIVO').length,
            creditos.filter((c: any) => c.estado === 'MOROSO').length,
            creditos.reduce((sum: number, c: any) => sum + toNumber(c.saldo_pendiente), 0).toFixed(2)
          ])
        }
      }

      const csvContent = rows.map((row) => row.map((cell) => escapeCell(cell)).join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_vendedores_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('Reporte exportado correctamente', 'success')
    } catch (error: any) {
      showToast(error.message || 'No se pudo exportar reporte', 'error')
    }
  }

  const exportarAuditoriaInventario = async () => {
    try {
      if (!auditInicio || !auditFin || auditInicio > auditFin) {
        showToast('Rango de fechas inválido para auditoría', 'error')
        return
      }
      const data = await apiClient.get(
        `/api/reportes/inventario-vendedores?inicio=${auditInicio}&fin=${auditFin}`
      )
      const vendedores = Array.isArray(data?.vendedores) ? data.vendedores : []
      const resumen = data?.resumen || {}

      const escapeCell = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`
      const rows: Array<Array<string | number>> = []
      rows.push(['AUDITORIA INVENTARIO VENDEDORES'])
      rows.push(['Generado', new Date().toLocaleString('es-GT')])
      rows.push(['Fecha inicio', auditInicio, 'Fecha fin', auditFin])
      rows.push([
        'Vendedores',
        Number(resumen?.vendedores || 0),
        'Movimientos',
        Number(resumen?.total_movimientos || 0),
        'Total asignado',
        Number(resumen?.total_asignado || 0),
        'Total retirado',
        Number(resumen?.total_retirado || 0),
        'Neto',
        Number(resumen?.neto || 0)
      ])
      rows.push([])
      rows.push([
        'Vendedor',
        'Usuario',
        'Asignado',
        'Retirado',
        'Neto',
        'Movimientos'
      ])
      for (const v of vendedores) {
        rows.push([
          v?.nombre || `Vendedor ${v?.id_vendedor}`,
          v?.username || '',
          Number(v?.total_asignado || 0),
          Number(v?.total_retirado || 0),
          Number(v?.neto || 0),
          Array.isArray(v?.movimientos) ? v.movimientos.length : 0
        ])
      }
      rows.push([])
      rows.push([
        'Vendedor',
        'Fecha',
        'Movimiento ID',
        'Direccion',
        'Tipo',
        'Producto',
        'Cantidad',
        'Origen',
        'Destino',
        'Registrado por'
      ])
      for (const v of vendedores) {
        for (const m of Array.isArray(v?.movimientos) ? v.movimientos : []) {
          rows.push([
            v?.nombre || '',
            m?.fecha ? new Date(m.fecha).toLocaleString('es-GT') : '',
            Number(m?.id_movimiento || 0),
            m?.direccion || '',
            m?.tipo || '',
            m?.producto || '',
            Number(m?.cantidad || 0),
            m?.origen || '',
            m?.destino || '',
            m?.registrado_por || ''
          ])
        }
      }

      const csvContent = rows.map((row) => row.map((cell) => escapeCell(cell)).join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `auditoria_inventario_vendedores_${auditInicio}_a_${auditFin}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('Auditoría exportada correctamente', 'success')
    } catch (error: any) {
      showToast(error.message || 'No se pudo exportar auditoría', 'error')
    }
  }

  const irAClienteDetalle = (idCliente: number, idCredito?: number) => {
    const query = new URLSearchParams()
    query.set('openCliente', String(idCliente))
    if (idCredito) query.set('openCredito', String(idCredito))
    router.push(`/dashboard/clientes?${query.toString()}`)
  }

  const filteredVendedores = vendedores.filter((v) => {
    const matchesSearch =
      v.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.telefono.includes(searchTerm) ||
      (v.usuario?.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filtroActivo === 'todos' ? true : filtroActivo === 'activos' ? v.activo : !v.activo
    return matchesSearch && matchesFilter
  })

  const recorridoPorDia = useMemo(() => {
    if (!detalleSeleccionado) return []
    const routeMap = new Map<number, { codigo?: string; nombre: string }>(
      (detalleSeleccionado.rutasDetalle || []).map((r) => [r.id_ruta, { codigo: r.codigo_ruta, nombre: r.nombre_ruta }])
    )

    const agrupado = new Map<string, Map<number, { creditos: number; pagos: number; montoCobrado: number }>>()

    for (const credito of detalleSeleccionado.creditosDetalle || []) {
      const rutaId = Number(credito.cliente?.id_ruta || 0)
      const fechaCredito = credito.fecha_inicio || credito.created_at
      if (fechaCredito && rutaId > 0) {
        const dateKey = new Date(fechaCredito).toISOString().split('T')[0]
        if (!agrupado.has(dateKey)) agrupado.set(dateKey, new Map())
        const byRuta = agrupado.get(dateKey)!
        const curr = byRuta.get(rutaId) || { creditos: 0, pagos: 0, montoCobrado: 0 }
        curr.creditos += 1
        byRuta.set(rutaId, curr)
      }

      for (const pago of credito.pagos || []) {
        const rutaPagoId = Number(credito.cliente?.id_ruta || 0)
        if (!pago.fecha_pago || rutaPagoId <= 0) continue
        const dateKey = new Date(pago.fecha_pago).toISOString().split('T')[0]
        if (!agrupado.has(dateKey)) agrupado.set(dateKey, new Map())
        const byRuta = agrupado.get(dateKey)!
        const curr = byRuta.get(rutaPagoId) || { creditos: 0, pagos: 0, montoCobrado: 0 }
        curr.pagos += 1
        curr.montoCobrado += toNumber(pago.monto_pagado)
        byRuta.set(rutaPagoId, curr)
      }
    }

    return Array.from(agrupado.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([fecha, rutas]) => ({
        fecha,
        rutas: Array.from(rutas.entries()).map(([idRuta, data]) => ({
          idRuta,
          codigo: routeMap.get(idRuta)?.codigo,
          nombre: routeMap.get(idRuta)?.nombre || `Ruta ${idRuta}`,
          ...data
        }))
      }))
  }, [detalleSeleccionado])

  const resumenCreditos = useMemo(() => {
    const creditos = detalleSeleccionado?.creditosDetalle || []
    const activos = creditos.filter((c) => c.estado === 'ACTIVO')
    const clientesUnicos = new Set(
      creditos
        .map((c) => c.cliente?.id_cliente)
        .filter((id): id is number => typeof id === 'number' && !Number.isNaN(id))
    )

    return {
      totalClientesConCredito: clientesUnicos.size,
      totalCreditos: creditos.length,
      totalActivos: activos.length,
      montoActivo: activos.reduce((sum, c) => sum + c.monto_total, 0),
      saldoActivo: activos.reduce((sum, c) => sum + c.saldo_pendiente, 0)
    }
  }, [detalleSeleccionado])

  const creditosAgrupadosCliente = useMemo(() => {
    if (!detalleSeleccionado) return []
    const routeMap = new Map<number, { codigo?: string; nombre: string }>(
      (detalleSeleccionado.rutasDetalle || []).map((r) => [r.id_ruta, { codigo: r.codigo_ruta, nombre: r.nombre_ruta }])
    )

    const map = new Map<
      number,
      {
        id_cliente: number
        nombre: string
        codigo_cliente: string
        id_ruta?: number
        ruta_nombre: string
        creditos: VendedorDetalle['creditosDetalle']
      }
    >()

    for (const credito of detalleSeleccionado.creditosDetalle || []) {
      const idCliente = Number(credito.cliente?.id_cliente || 0)
      if (idCliente <= 0) continue
      const current =
        map.get(idCliente) ||
        {
          id_cliente: idCliente,
          nombre: credito.cliente?.nombre || 'Cliente',
          codigo_cliente: credito.cliente?.codigo_cliente || '',
          id_ruta: credito.cliente?.id_ruta,
          ruta_nombre: (() => {
            const idRuta = Number(credito.cliente?.id_ruta || 0)
            if (!idRuta) return 'Sin ruta'
            const r = routeMap.get(idRuta)
            return r ? `${r.codigo ? `${r.codigo} - ` : ''}${r.nombre}` : `Ruta ${idRuta}`
          })(),
          creditos: []
        }
      current.creditos.push(credito)
      map.set(idCliente, current)
    }

    const grouped = Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

    return grouped
      .map((cliente) => {
        const creditosFiltrados = cliente.creditos.filter((credito) => {
          const matchesEstado = creditosFiltroEstado === 'todos' ? true : credito.estado === creditosFiltroEstado
          const term = creditosSearch.trim().toLowerCase()
          const matchesSearch =
            !term ||
            cliente.nombre.toLowerCase().includes(term) ||
            cliente.codigo_cliente.toLowerCase().includes(term) ||
            cliente.ruta_nombre.toLowerCase().includes(term) ||
            String(credito.id_credito).includes(term)
          return matchesEstado && matchesSearch
        })

        return {
          ...cliente,
          creditos: creditosFiltrados
        }
      })
      .filter((cliente) => cliente.creditos.length > 0)
  }, [detalleSeleccionado, creditosSearch, creditosFiltroEstado])

  const inventarioFiltrado = useMemo(() => {
    const term = inventarioSearch.trim().toLowerCase()
    return (detalleSeleccionado?.inventarioDetalle || []).filter((item) => {
      const matchesSearch = !term || item.producto.nombre.toLowerCase().includes(term)
      const matchesFiltro =
        inventarioFiltro === 'todos'
          ? true
          : inventarioFiltro === 'con_stock'
            ? item.cantidad > 0
            : item.cantidad <= 0
      return matchesSearch && matchesFiltro
    })
  }, [detalleSeleccionado, inventarioSearch, inventarioFiltro])

  const inventarioComprometido = useMemo(() => {
    const map = new Map<number, { cantidad: number; valor: number }>()
    for (const credito of detalleSeleccionado?.creditosDetalle || []) {
      if (credito.estado !== 'ACTIVO') continue
      for (const d of credito.credito_detalle || []) {
        const id = Number(d.id_producto)
        if (Number.isNaN(id) || id <= 0) continue
        const current = map.get(id) || { cantidad: 0, valor: 0 }
        current.cantidad += toNumber(d.cantidad)
        current.valor += toNumber(d.subtotal)
        map.set(id, current)
      }
    }
    return map
  }, [detalleSeleccionado])

  const rutasAsignadasIds = new Set((detalleSeleccionado?.rutasDetalle || []).map((r) => Number(r.id_ruta)))
  const rutasNoAsignadas = rutasDisponibles.filter((r) => !rutasAsignadasIds.has(Number(r.id_ruta)))

  const statsCards = [
    { title: 'Total Vendedores', value: stats.total, color: 'blue' as const, change: 0 },
    { title: 'Vendedores Activos', value: stats.activos, color: 'green' as const, change: 0 },
    { title: 'Con Inventario', value: stats.conInventario, color: 'purple' as const, change: 0 },
    { title: 'Valor Inventario', value: formatCurrency(stats.valorInventario), color: 'yellow' as const, change: 0 }
  ]

  return (
    <LayoutContainer>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Vendedores</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Gestiona vendedores, rutas, créditos e inventario
            </p>
          </div>
          <Button
            onClick={() => {
              setVendedorEditando(null)
              setModalAbierto(true)
            }}
            className="w-full sm:w-auto"
          >
            Nuevo Vendedor
          </Button>
        </div>

        <StatsCards stats={statsCards as any} />

        <Card>
          <div className="space-y-4">
            <Input
              placeholder="Buscar por nombre, teléfono o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setFiltroActivo('todos')} className={`px-3 py-2 rounded-lg text-sm ${filtroActivo === 'todos' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Todos</button>
              <button onClick={() => setFiltroActivo('activos')} className={`px-3 py-2 rounded-lg text-sm ${filtroActivo === 'activos' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Activos</button>
              <button onClick={() => setFiltroActivo('inactivos')} className={`px-3 py-2 rounded-lg text-sm ${filtroActivo === 'inactivos' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Inactivos</button>
              <Button variant="secondary" onClick={exportarReporteVendedores}>
                Exportar Reporte
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                type="date"
                label="Inicio auditoría inventario"
                value={auditInicio}
                onChange={(e) => setAuditInicio(e.target.value)}
              />
              <Input
                type="date"
                label="Fin auditoría inventario"
                value={auditFin}
                onChange={(e) => setAuditFin(e.target.value)}
              />
              <div className="md:col-span-2 flex items-end">
                <Button variant="outline" onClick={exportarAuditoriaInventario}>
                  Exportar Auditoría Inventario
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <VendedoresTable
              data={filteredVendedores}
              loading={loading}
              onView={(v) => abrirConDetalle(v, 'detalle')}
              onEdit={handleEdit}
              onToggleStatus={handleToggleStatus}
              onViewRutas={(v) => abrirConDetalle(v, 'rutas')}
              onViewInventario={(v) => abrirConDetalle(v, 'inventario')}
              onViewCreditos={(v) => abrirConDetalle(v, 'creditos')}
              onAsignarRuta={(v) => abrirConDetalle(v, 'rutas')}
            />
          </div>
        </Card>

        <Modal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          title={vendedorEditando ? 'Editar Vendedor' : 'Nuevo Vendedor'}
          size="lg"
        >
          <VendedorForm
            vendedorId={vendedorEditando?.id_vendedor}
            onSuccess={() => {
              setModalAbierto(false)
              cargarVendedores()
            }}
            onCancel={() => setModalAbierto(false)}
          />
        </Modal>

        <Modal
          isOpen={modalDetalle}
          onClose={() => setModalDetalle(false)}
          title={`Detalle de ${detalleSeleccionado?.nombre || ''}`}
          size="lg"
        >
          {loadingDetalle && <p className="text-sm text-gray-500">Cargando detalle...</p>}
          {detalleSeleccionado && !loadingDetalle && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-gray-500">Nombre</p>
                  <p className="font-semibold">{detalleSeleccionado.nombre}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-gray-500">Teléfono</p>
                  <p className="font-semibold">{detalleSeleccionado.telefono}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-gray-500">Usuario</p>
                  <p className="font-semibold">@{detalleSeleccionado.usuario?.username || '-'}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-gray-500">Estado</p>
                  <p className="font-semibold">{detalleSeleccionado.activo ? 'Activo' : 'Inactivo'}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Campos editables: `nombre`, `teléfono` y `estado`. El usuario asociado no se cambia desde esta pantalla.
              </p>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={modalRutas}
          onClose={() => setModalRutas(false)}
          title={`Rutas de ${detalleSeleccionado?.nombre || ''}`}
          size="xl"
        >
          {loadingDetalle && <p className="text-sm text-gray-500">Cargando rutas...</p>}
          {!loadingDetalle && detalleSeleccionado && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Rutas Asignadas</h4>
                <div className="space-y-2">
                  {(detalleSeleccionado.rutasDetalle || []).map((ruta) => (
                    <div key={ruta.id_ruta} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{ruta.codigo_ruta ? `${ruta.codigo_ruta} - ` : ''}{ruta.nombre_ruta}</p>
                        <p className="text-xs text-gray-500">{ruta.zona || 'Sin zona'}</p>
                      </div>
                      <Button variant="danger" size="sm" onClick={() => handleDesasignarRuta(ruta.id_ruta)}>
                        Quitar
                      </Button>
                    </div>
                  ))}
                  {(detalleSeleccionado.rutasDetalle || []).length === 0 && <p className="text-sm text-gray-500">Sin rutas asignadas.</p>}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Clientes en rutas asignadas: <strong>{detalleSeleccionado.clientesRuta.length}</strong> | Créditos detectados por ruta: <strong>{detalleSeleccionado.creditosDetalle.length}</strong>
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium mb-2">Asignar Nueva Ruta</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    value={nuevaRutaId}
                    onChange={(e) => setNuevaRutaId(e.target.value)}
                  >
                    <option value="">Seleccionar ruta</option>
                    {rutasNoAsignadas.map((ruta) => (
                      <option key={ruta.id_ruta} value={ruta.id_ruta}>
                        {ruta.codigo_ruta ? `${ruta.codigo_ruta} - ` : ''}{ruta.nombre_ruta}{ruta.zona ? ` (${ruta.zona})` : ''}
                      </option>
                    ))}
                  </select>
                  <Button onClick={handleAsignarRuta}>Asignar</Button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium mb-2">Recorrido por Día (Agrupado por Ruta)</h4>
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {recorridoPorDia.map((dia) => (
                    <div key={dia.fecha} className="border rounded-lg p-3">
                      <p className="text-sm font-semibold mb-2">{new Date(`${dia.fecha}T00:00:00`).toLocaleDateString()}</p>
                      <div className="space-y-2">
                        {dia.rutas.map((r) => (
                          <div key={`${dia.fecha}-${r.idRuta}`} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm bg-gray-50 dark:bg-gray-800 rounded p-2">
                            <p className="font-medium">{r.codigo ? `${r.codigo} - ` : ''}{r.nombre}</p>
                            <p>Créditos: <strong>{r.creditos}</strong></p>
                            <p>Pagos: <strong>{r.pagos}</strong></p>
                            <p>Cobrado: <strong>{formatCurrency(r.montoCobrado)}</strong></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {recorridoPorDia.length === 0 && <p className="text-sm text-gray-500">Sin actividad registrada para este vendedor.</p>}
                </div>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={modalInventario}
          onClose={() => setModalInventario(false)}
          title={`Inventario de ${detalleSeleccionado?.nombre || ''}`}
          size="full"
        >
          {loadingDetalle && <p className="text-sm text-gray-500">Cargando inventario...</p>}
          {!loadingDetalle && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Este inventario representa lo que el vendedor tiene actualmente asignado. Lo ya entregado a clientes se descuenta de aquí cuando se registra la salida/venta.
              </p>

              <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                <p className="text-sm font-medium mb-3">Asignar inventario desde bodega</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select
                    className="md:col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                    value={asignarProductoId}
                    onChange={(e) => setAsignarProductoId(e.target.value)}
                  >
                    <option value="">Seleccionar producto de bodega</option>
                    {productosBodega.map((p) => (
                      <option key={p.id_producto} value={p.id_producto}>
                        {p.nombre} - {p.categoria} (stock: {p.stock_disponible})
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Cantidad"
                    value={asignarCantidad}
                    onChange={(e) => setAsignarCantidad(e.target.value)}
                  />
                  <Button onClick={handleAsignarInventario} loading={asignandoInventario}>
                    Asignar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Buscar producto..."
                  value={inventarioSearch}
                  onChange={(e) => setInventarioSearch(e.target.value)}
                />
                <div className="flex gap-2 md:col-span-2">
                  <button
                    onClick={() => setInventarioFiltro('todos')}
                    className={`px-3 py-2 rounded-lg text-sm ${inventarioFiltro === 'todos' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setInventarioFiltro('con_stock')}
                    className={`px-3 py-2 rounded-lg text-sm ${inventarioFiltro === 'con_stock' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Con stock
                  </button>
                  <button
                    onClick={() => setInventarioFiltro('sin_stock')}
                    className={`px-3 py-2 rounded-lg text-sm ${inventarioFiltro === 'sin_stock' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Sin stock
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {inventarioFiltrado.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 sm:grid-cols-6 gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
                    <p className="font-medium sm:col-span-2">{item.producto.nombre}</p>
                    <p>
                      Stock actual: <strong>{item.cantidad}</strong>
                    </p>
                    <p>
                      Comprometido: <strong>{inventarioComprometido.get(Number(item.producto.id_producto))?.cantidad || 0}</strong>
                    </p>
                    <p>
                      Proyectado: <strong>{item.cantidad - (inventarioComprometido.get(Number(item.producto.id_producto))?.cantidad || 0)}</strong>
                    </p>
                    <p>
                      Valor actual: <strong>{formatCurrency(item.cantidad * item.producto.precio_credito)}</strong>
                    </p>
                  </div>
              ))}
              {inventarioFiltrado.length === 0 && <p className="text-sm text-gray-500">Sin resultados para el filtro seleccionado.</p>}
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={modalCreditos}
          onClose={() => setModalCreditos(false)}
          title={`Créditos de ${detalleSeleccionado?.nombre || ''}`}
          size="full"
        >
          {loadingDetalle && <p className="text-sm text-gray-500">Cargando créditos...</p>}
          {!loadingDetalle && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
                  <p className="text-gray-500">Clientes con crédito</p>
                  <p className="text-lg font-semibold">{resumenCreditos.totalClientesConCredito}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
                  <p className="text-gray-500">Créditos totales</p>
                  <p className="text-lg font-semibold">{resumenCreditos.totalCreditos}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-sm">
                  <p className="text-green-700 dark:text-green-400">Créditos activos</p>
                  <p className="text-lg font-semibold text-green-700 dark:text-green-400">{resumenCreditos.totalActivos}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm">
                  <p className="text-blue-700 dark:text-blue-400">Monto activo</p>
                  <p className="font-semibold text-blue-700 dark:text-blue-400">{formatCurrency(resumenCreditos.montoActivo)}</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-sm">
                  <p className="text-orange-700 dark:text-orange-400">Saldo activo</p>
                  <p className="font-semibold text-orange-700 dark:text-orange-400">{formatCurrency(resumenCreditos.saldoActivo)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Buscar por cliente, código, ruta o # crédito..."
                  value={creditosSearch}
                  onChange={(e) => setCreditosSearch(e.target.value)}
                />
                <div className="flex flex-wrap gap-2 md:col-span-2">
                  <button
                    onClick={() => setCreditosFiltroEstado('todos')}
                    className={`px-3 py-2 rounded-lg text-sm ${creditosFiltroEstado === 'todos' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setCreditosFiltroEstado('ACTIVO')}
                    className={`px-3 py-2 rounded-lg text-sm ${creditosFiltroEstado === 'ACTIVO' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Activos
                  </button>
                  <button
                    onClick={() => setCreditosFiltroEstado('MOROSO')}
                    className={`px-3 py-2 rounded-lg text-sm ${creditosFiltroEstado === 'MOROSO' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Morosos
                  </button>
                  <button
                    onClick={() => setCreditosFiltroEstado('PAGADO')}
                    className={`px-3 py-2 rounded-lg text-sm ${creditosFiltroEstado === 'PAGADO' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Pagados
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {creditosAgrupadosCliente.map((cliente) => (
                  <div key={cliente.id_cliente} className="border rounded-lg p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                      <p className="font-semibold text-sm">{cliente.codigo_cliente} - {cliente.nombre}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Ruta: {cliente.ruta_nombre}</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Créditos activos: <strong>{cliente.creditos.filter((c) => c.estado === 'ACTIVO').length}</strong>
                        </p>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => irAClienteDetalle(cliente.id_cliente)}
                        >
                          Ir a cliente
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {cliente.creditos.map((credito) => (
                        <div key={credito.id_credito} className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-sm bg-gray-50 dark:bg-gray-800 rounded p-2">
                          <p><strong>#{credito.id_credito}</strong></p>
                          <p>Estado: <strong>{credito.estado}</strong></p>
                          <p>Total: <strong>{formatCurrency(credito.monto_total)}</strong></p>
                          <p>Pendiente: <strong>{formatCurrency(credito.saldo_pendiente)}</strong></p>
                          <div className="flex items-center justify-between gap-2">
                            <p>Pagos: <strong>{credito.pagos.length}</strong></p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => irAClienteDetalle(cliente.id_cliente, credito.id_credito)}
                            >
                              Ver en clientes
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {creditosAgrupadosCliente.length === 0 && (
                  <p className="text-sm text-gray-500">Sin créditos registrados.</p>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </LayoutContainer>
  )
}
