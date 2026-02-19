'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import LayoutContainer from '@/components/layout/LayoutContainer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { ClienteForm } from '@/components/forms/ClienteForm'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ClienteRow {
  id_cliente: number
  id_ruta?: number
  codigo_cliente: string
  nombre: string
  direccion?: string | null
  telefono?: string | null
  email?: string | null
  activo: boolean
  rutas?: {
    nombre_ruta?: string
    ruta_vendedor?: Array<{
      vendedores?: {
        nombre?: string
      }
    }>
  }
  creditos?: Array<{
    id_credito: number
    estado: string
    saldo_pendiente: number | string
  }>
}

interface CreditoDetalleProducto {
  id_producto?: number
  cantidad: number
  precio_unitario: number | string
  subtotal: number | string
  productos?: {
    nombre?: string
  }
}

interface CreditoCliente {
  id_credito: number
  estado: string
  monto_total: number | string
  saldo_pendiente: number | string
  cuota: number | string
  frecuencia_pago: string
  numero_cuotas: number
  fecha_inicio: string
  fecha_vencimiento: string
  vendedores?: {
    nombre?: string
    usuarios?: {
      nombre?: string
    }
  }
  pagos?: Array<{
    id_pago?: number
    monto_pagado: number | string
    fecha_pago: string
    metodo_pago?: string | null
    pago_detalle_producto?: Array<{
      id_producto: number
      monto_pagado: number | string
      productos?: {
        nombre?: string
      }
    }>
  }>
  credito_detalle?: CreditoDetalleProducto[]
}

interface ClienteDetalle extends ClienteRow {
  rutas?: ClienteRow['rutas']
}

export default function ClientesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [rutas, setRutas] = useState<Array<{ id_ruta: number; nombre_ruta: string }>>([])
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [rutaFiltro, setRutaFiltro] = useState('todas')

  const [modalClienteOpen, setModalClienteOpen] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<ClienteRow | null>(null)

  const [modalDetalleOpen, setModalDetalleOpen] = useState(false)
  const [detalleLoading, setDetalleLoading] = useState(false)
  const [clienteDetalle, setClienteDetalle] = useState<ClienteDetalle | null>(null)
  const [creditosCliente, setCreditosCliente] = useState<CreditoCliente[]>([])
  const [formPago, setFormPago] = useState<Record<number, {
    monto: string
    fecha: string
    metodo: string
    detallePorProducto: Record<number, string>
    loading: boolean
  }>>({})

  const { showToast } = useToast()

  useEffect(() => {
    cargarInicial()
  }, [])

  useEffect(() => {
    const openCliente = searchParams.get('openCliente')
    if (!openCliente) return
    const idCliente = Number(openCliente)
    if (Number.isNaN(idCliente) || idCliente <= 0) return

    ;(async () => {
      try {
        setModalDetalleOpen(true)
        setDetalleLoading(true)
        await cargarDetalleCliente(idCliente)
      } catch (error: any) {
        showToast(error.message || 'No se pudo abrir el detalle del cliente', 'error')
        setModalDetalleOpen(false)
      } finally {
        setDetalleLoading(false)
        router.replace('/dashboard/clientes')
      }
    })()
  }, [searchParams, router])

  const cargarInicial = async () => {
    await Promise.all([cargarClientes(), cargarRutas()])
  }

  const cargarClientes = async () => {
    try {
      setLoading(true)
      const data = await apiClient.get('/api/clientes')
      setClientes(Array.isArray(data) ? data : [])
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const cargarRutas = async () => {
    try {
      const data = await apiClient.get('/api/rutas?activas=true')
      const lista = (Array.isArray(data) ? data : []).map((r: any) => ({
        id_ruta: Number(r.id_ruta),
        nombre_ruta: r.nombre_ruta || `Ruta ${r.id_ruta}`
      }))
      setRutas(lista)
    } catch (error: any) {
      showToast(error.message, 'error')
    }
  }

  const cargarDetalleCliente = async (idCliente: number) => {
    const [detalle, creditos] = await Promise.all([
      apiClient.get(`/api/clientes/${idCliente}`),
      apiClient.get(`/api/clientes/${idCliente}/creditos`)
    ])

    setClienteDetalle(detalle)
    const listaCreditos = Array.isArray(creditos) ? creditos : []
    setCreditosCliente(listaCreditos)

    const fechaHoy = new Date().toISOString().slice(0, 10)
    const siguienteFormPago: Record<number, {
      monto: string
      fecha: string
      metodo: string
      detallePorProducto: Record<number, string>
      loading: boolean
    }> = {}
    listaCreditos.forEach((cr: CreditoCliente) => {
      const detallePorProducto: Record<number, string> = {}
      ;(cr.credito_detalle || []).forEach((d) => {
        if (d.id_producto) {
          detallePorProducto[d.id_producto] = ''
        }
      })
      siguienteFormPago[cr.id_credito] = {
        monto: '',
        fecha: fechaHoy,
        metodo: 'EFECTIVO',
        detallePorProducto,
        loading: false
      }
    })
    setFormPago(siguienteFormPago)
  }

  const verDetalleCliente = async (cliente: ClienteRow) => {
    try {
      setModalDetalleOpen(true)
      setDetalleLoading(true)
      await cargarDetalleCliente(cliente.id_cliente)
    } catch (error: any) {
      showToast(error.message, 'error')
      setModalDetalleOpen(false)
    } finally {
      setDetalleLoading(false)
    }
  }

  const desactivarCliente = async (cliente: ClienteRow) => {
    const confirmar = window.confirm(`¿Deseas desactivar al cliente "${cliente.nombre}"?`)
    if (!confirmar) return

    try {
      await apiClient.delete(`/api/clientes/${cliente.id_cliente}`)
      showToast('Cliente desactivado correctamente', 'success')
      cargarClientes()
    } catch (error: any) {
      showToast(error.message, 'error')
    }
  }

  const filteredClientes = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return clientes.filter((c) => {
      const nombre = (c.nombre ?? '').toLowerCase()
      const codigo = (c.codigo_cliente ?? '').toLowerCase()
      const telefono = (c.telefono ?? '').toLowerCase()
      const matchesText = nombre.includes(term) || codigo.includes(term) || telefono.includes(term)
      const matchesRuta =
        rutaFiltro === 'todas' ||
        String(c.id_ruta ?? '') === rutaFiltro
      return matchesText && matchesRuta
    })
  }, [clientes, searchTerm, rutaFiltro])

  const stats = useMemo(() => {
    const activos = clientes.filter((c) => c.activo).length
    const conCreditos = clientes.filter((c) => (c.creditos?.length || 0) > 0).length
    const morosos = clientes.filter((c) =>
      (c.creditos || []).some((cr) => cr.estado === 'MOROSO')
    ).length
    return {
      total: clientes.length,
      activos,
      conCreditos,
      morosos
    }
  }, [clientes])

  const resumenCreditosCliente = useMemo(() => {
    const total = creditosCliente.length
    const activos = creditosCliente.filter((c) => c.estado === 'ACTIVO').length
    const morosos = creditosCliente.filter((c) => c.estado === 'MOROSO').length
    const saldoPendiente = creditosCliente.reduce(
      (sum, c) => sum + Number(c.saldo_pendiente || 0),
      0
    )
    return { total, activos, morosos, saldoPendiente }
  }, [creditosCliente])

  const columns = [
    {
      key: 'codigo_cliente',
      header: 'Código',
      cell: (item: ClienteRow) => <Badge variant="info">{item.codigo_cliente}</Badge>
    },
    {
      key: 'nombre',
      header: 'Cliente',
      cell: (item: ClienteRow) => (
        <div className="min-w-[220px]">
          <p className="font-medium">{item.nombre}</p>
          <p className="text-xs text-gray-500">{item.email || '-'}</p>
        </div>
      )
    },
    {
      key: 'ruta',
      header: 'Ruta',
      cell: (item: ClienteRow) => (
        <Badge variant="secondary">{item.rutas?.nombre_ruta || 'Sin ruta'}</Badge>
      )
    },
    {
      key: 'vendedor',
      header: 'Vendedor Asignado',
      cell: (item: ClienteRow) => {
        const vendedor = item.rutas?.ruta_vendedor?.[0]?.vendedores?.nombre
        return <span>{vendedor || 'No asignado'}</span>
      }
    },
    {
      key: 'creditos',
      header: 'Créditos',
      cell: (item: ClienteRow) => (
        <div>
          <p className="font-medium">{item.creditos?.length || 0}</p>
          {(item.creditos || []).some((c) => c.estado === 'MOROSO') ? (
            <Badge variant="error" size="sm">Moroso</Badge>
          ) : (
            <Badge variant="success" size="sm">Al día</Badge>
          )}
        </div>
      )
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (item: ClienteRow) => (
        <Badge variant={item.activo ? 'success' : 'error'}>
          {item.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'acciones',
      header: 'Acciones',
      cell: (item: ClienteRow) => (
        <div className="flex flex-wrap gap-2 min-w-[260px]">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setClienteEditando(item)
              setModalClienteOpen(true)
            }}
          >
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              verDetalleCliente(item)
            }}
          >
            Ver Créditos
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              desactivarCliente(item)
            }}
          >
            Desactivar
          </Button>
        </div>
      )
    }
  ]

  const calcularMetricasCredito = (credito: CreditoCliente) => {
    const montoTotal = Number(credito.monto_total || 0)
    const cuota = Number(credito.cuota || 0)
    const montoPagado = (credito.pagos || []).reduce(
      (sum, p) => sum + Number(p.monto_pagado || 0),
      0
    )
    const cuotasEqPagadas = cuota > 0 ? montoPagado / cuota : 0
    const cuotasPagadasEnteras = Math.floor(cuotasEqPagadas)
    const cuotasTotal = Number(credito.numero_cuotas || 0)
    const cuotasPendientes = Math.max(cuotasTotal - cuotasPagadasEnteras, 0)

    return {
      montoTotal,
      cuota,
      montoPagado,
      cuotasEqPagadas,
      cuotasPagadasEnteras,
      cuotasTotal,
      cuotasPendientes
    }
  }

  const getMontoPagadoProducto = (credito: CreditoCliente, idProducto: number) => {
    const subtotalProducto = Number(
      (credito.credito_detalle || []).find((d) => Number(d.id_producto) === idProducto)?.subtotal || 0
    )
    const subtotalTotal = (credito.credito_detalle || []).reduce((sum, d) => sum + Number(d.subtotal || 0), 0)

    return (credito.pagos || []).reduce((sumPagos, pago) => {
      const detallePago = (pago.pago_detalle_producto || [])

      if (detallePago.length > 0) {
        const exacto = detallePago
          .filter((dp) => dp.id_producto === idProducto)
          .reduce((sumDetalle, dp) => sumDetalle + Number(dp.monto_pagado || 0), 0)
        return sumPagos + exacto
      }

      // Fallback para pagos antiguos sin detalle por producto: distribución proporcional al subtotal.
      const estimado = subtotalTotal > 0
        ? Number(pago.monto_pagado || 0) * (subtotalProducto / subtotalTotal)
        : 0
      return sumPagos + estimado
    }, 0)
  }

  const registrarPagoCredito = async (credito: CreditoCliente) => {
    const current = formPago[credito.id_credito]
    if (!current) return

    const detalleInput = current.detallePorProducto || {}
    const detalleProductos = Object.entries(detalleInput)
      .map(([idProducto, montoTexto]) => ({
        id_producto: Number(idProducto),
        monto_pagado: Number(montoTexto || 0)
      }))
      .filter((d) => !Number.isNaN(d.id_producto) && d.id_producto > 0 && d.monto_pagado > 0)

    const sumaDetalle = detalleProductos.reduce((sum, d) => sum + d.monto_pagado, 0)
    const montoIngresado = current.monto.trim() ? Number(current.monto) : sumaDetalle
    if (Number.isNaN(montoIngresado) || montoIngresado <= 0) {
      showToast('Ingresa un monto total válido', 'error')
      return
    }
    if (detalleProductos.length > 0 && Math.abs(montoIngresado - sumaDetalle) > 0.01) {
      showToast('El monto total debe coincidir con la suma distribuida por producto', 'error')
      return
    }

    if (!current.fecha) {
      showToast('Selecciona una fecha de pago', 'error')
      return
    }

    try {
      setFormPago((prev) => ({
        ...prev,
        [credito.id_credito]: { ...prev[credito.id_credito], loading: true }
      }))

      await apiClient.post('/api/pagos', {
        id_credito: credito.id_credito,
        monto_pagado: montoIngresado,
        fecha_pago: new Date(`${current.fecha}T12:00:00`).toISOString(),
        metodo_pago: current.metodo,
        detalle_productos: detalleProductos.length > 0 ? detalleProductos : undefined
      })

      showToast('Pago registrado correctamente', 'success')

      if (clienteDetalle?.id_cliente) {
        await cargarDetalleCliente(clienteDetalle.id_cliente)
      }
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setFormPago((prev) => ({
        ...prev,
        [credito.id_credito]: {
          ...prev[credito.id_credito],
          loading: false,
          monto: '',
          detallePorProducto: Object.keys(prev[credito.id_credito]?.detallePorProducto || {})
            .reduce((acc, key) => {
              acc[Number(key)] = ''
              return acc
            }, {} as Record<number, string>)
        }
      }))
    }
  }

  const exportarReporteClientes = async () => {
    try {
      setExportando(true)
      const scope = filteredClientes
      if (scope.length === 0) {
        showToast('No hay clientes para exportar', 'info')
        return
      }

      const detalles = await Promise.all(
        scope.map((c) => apiClient.get(`/api/clientes/${c.id_cliente}`))
      )

      const escapeCell = (value: string | number) => {
        const text = String(value ?? '').replace(/"/g, '""')
        return `"${text}"`
      }

      const rows: Array<Array<string | number>> = []
      rows.push(['LISTADO DE CLIENTES (FILTRADO)'])
      rows.push(['Generado', new Date().toLocaleString('es-GT')])
      rows.push([
        'Filtro de ruta',
        rutaFiltro === 'todas'
          ? 'Todas'
          : rutas.find((r) => String(r.id_ruta) === rutaFiltro)?.nombre_ruta || `Ruta ${rutaFiltro}`
      ])
      rows.push([])

      rows.push(['DETALLE CLIENTES'])
      rows.push([
        'Cliente',
        'Codigo Cliente',
        'Ruta',
        'Vendedor Asignado',
        'Estado Cliente',
        'Créditos Totales',
        'Créditos Morosos'
      ])

      detalles.forEach((c: any) => {
        const clienteNombre = c.nombre || ''
        const codigo = c.codigo_cliente || ''
        const ruta = c.rutas?.nombre_ruta || ''
        const vendedorRuta = c.rutas?.ruta_vendedor?.[0]?.vendedores?.nombre || 'No asignado'
        const listaCreditos = Array.isArray(c.creditos) ? c.creditos : []
        rows.push([
          clienteNombre,
          codigo,
          ruta,
          vendedorRuta,
          c.activo ? 'Activo' : 'Inactivo',
          listaCreditos.length,
          listaCreditos.filter((cr: any) => cr.estado === 'MOROSO').length
        ])
      })

      const csvContent = rows
        .map((row) => row.map((cell) => escapeCell(cell)).join(','))
        .join('\n')

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `clientes_filtrados_${date}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showToast('Reporte exportado correctamente', 'success')
    } catch (error: any) {
      showToast(error.message || 'No se pudo exportar el reporte', 'error')
    } finally {
      setExportando(false)
    }
  }

  const exportarCreditoDetalle = (cliente: ClienteDetalle, credito: CreditoCliente) => {
    try {
      const met = calcularMetricasCredito(credito)
      const escapeCell = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`
      const rows: Array<Array<string | number>> = []

      rows.push(['REPORTE DE CREDITO'])
      rows.push(['Generado', new Date().toLocaleString('es-GT')])
      rows.push(['Cliente', cliente.nombre || ''])
      rows.push(['Codigo Cliente', cliente.codigo_cliente || ''])
      rows.push(['Ruta', cliente.rutas?.nombre_ruta || ''])
      rows.push(['Vendedor', credito.vendedores?.nombre || credito.vendedores?.usuarios?.nombre || 'No asignado'])
      rows.push([])

      rows.push(['RESUMEN CREDITO'])
      rows.push(['ID Credito', credito.id_credito])
      rows.push(['Estado', credito.estado])
      rows.push(['Monto Total', met.montoTotal.toFixed(2)])
      rows.push(['Saldo Pendiente', Number(credito.saldo_pendiente || 0).toFixed(2)])
      rows.push(['Cuota', met.cuota.toFixed(2)])
      rows.push(['Numero Cuotas', met.cuotasTotal])
      rows.push(['Cuotas Equivalentes Pagadas', met.cuotasEqPagadas.toFixed(2)])
      rows.push(['Cuotas Pendientes', met.cuotasPendientes])
      rows.push([])

      rows.push(['PRODUCTOS DEL CREDITO'])
      rows.push(['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal', 'Pago Acumulado Producto', 'Avance Pago %', 'Cuotas Eq.'])
      ;(credito.credito_detalle || []).forEach((dp) => {
        const subtotal = Number(dp.subtotal || 0)
        const idProducto = Number(dp.id_producto || 0)
        const pagoProducto = idProducto > 0 ? getMontoPagadoProducto(credito, idProducto) : 0
        const avance = subtotal > 0 ? Math.min((pagoProducto / subtotal) * 100, 100) : 0
        const cuotasEq = met.cuota > 0 ? pagoProducto / met.cuota : 0
        rows.push([
          dp.productos?.nombre || 'Producto',
          dp.cantidad,
          Number(dp.precio_unitario || 0).toFixed(2),
          subtotal.toFixed(2),
          pagoProducto.toFixed(2),
          avance.toFixed(2),
          cuotasEq.toFixed(2)
        ])
      })
      rows.push([])

      rows.push(['HISTORIAL DE PAGOS'])
      rows.push(['Fecha', 'Monto', 'Método', 'Detalle por producto'])
      ;(credito.pagos || []).forEach((pago) => {
        const detalleTexto = (pago.pago_detalle_producto || []).length > 0
          ? (pago.pago_detalle_producto || [])
              .map((d) => `${d.productos?.nombre || d.id_producto}: ${Number(d.monto_pagado || 0).toFixed(2)}`)
              .join(' | ')
          : 'Sin detalle (pago antiguo)'
        rows.push([
          pago.fecha_pago ? formatDate(pago.fecha_pago) : '',
          Number(pago.monto_pagado || 0).toFixed(2),
          pago.metodo_pago || '',
          detalleTexto
        ])
      })

      const csv = rows.map((row) => row.map(escapeCell).join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `credito_${credito.id_credito}_cliente_${cliente.id_cliente}_${date}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showToast('Reporte del crédito exportado', 'success')
    } catch (error: any) {
      showToast(error.message || 'No se pudo exportar el crédito', 'error')
    }
  }

  return (
    <LayoutContainer>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Clientes</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Gestiona clientes, créditos, ruta y vendedor asignado
            </p>
          </div>
          <Button
            onClick={() => {
              setClienteEditando(null)
              setModalClienteOpen(true)
            }}
          >
            Nuevo Cliente
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-gray-600">Total Clientes</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600">Clientes Activos</p>
            <p className="text-2xl font-bold text-green-600">{stats.activos}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600">Con Créditos</p>
            <p className="text-2xl font-bold text-blue-600">{stats.conCreditos}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600">Morosos</p>
            <p className="text-2xl font-bold text-red-600">{stats.morosos}</p>
          </Card>
        </div>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Buscar por nombre, código o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={rutaFiltro}
              onChange={(e) => setRutaFiltro(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="todas">Todas las rutas</option>
              {rutas.map((r) => (
                <option key={r.id_ruta} value={String(r.id_ruta)}>
                  {r.nombre_ruta}
                </option>
              ))}
            </select>
            <Button variant="secondary" onClick={exportarReporteClientes} loading={exportando}>
              Exportar Excel
            </Button>
          </div>
        </Card>

        <Card padding="none">
          <Table
            data={filteredClientes}
            columns={columns}
            loading={loading}
            onRowClick={(item) => verDetalleCliente(item)}
            emptyMessage="No hay clientes para mostrar"
          />
        </Card>

        <Modal
          isOpen={modalClienteOpen}
          onClose={() => setModalClienteOpen(false)}
          title={clienteEditando ? 'Editar Cliente' : 'Nuevo Cliente'}
          size="lg"
        >
          <ClienteForm
            clienteId={clienteEditando?.id_cliente}
            onSuccess={() => {
              setModalClienteOpen(false)
              cargarClientes()
            }}
            onCancel={() => setModalClienteOpen(false)}
          />
        </Modal>

        <Modal
          isOpen={modalDetalleOpen}
          onClose={() => setModalDetalleOpen(false)}
          title={`Detalle Cliente - ${clienteDetalle?.nombre || ''}`}
          size="full"
        >
          {detalleLoading ? (
            <div className="py-10 text-center text-gray-500">Cargando detalle...</div>
          ) : !clienteDetalle ? (
            <div className="py-10 text-center text-gray-500">No se encontró información del cliente.</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <p className="text-xs text-gray-500">Código</p>
                  <p className="text-lg font-bold">{clienteDetalle.codigo_cliente}</p>
                </Card>
                <Card>
                  <p className="text-xs text-gray-500">Ruta</p>
                  <p className="text-lg font-bold">{clienteDetalle.rutas?.nombre_ruta || 'Sin ruta'}</p>
                </Card>
                <Card>
                  <p className="text-xs text-gray-500">Vendedor</p>
                  <p className="text-lg font-bold">
                    {clienteDetalle.rutas?.ruta_vendedor?.[0]?.vendedores?.nombre || 'No asignado'}
                  </p>
                </Card>
                <Card>
                  <p className="text-xs text-gray-500">Saldo Pendiente</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(resumenCreditosCliente.saldoPendiente)}
                  </p>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <p className="text-xs text-gray-500">Créditos Totales</p>
                  <p className="text-xl font-bold">{resumenCreditosCliente.total}</p>
                </Card>
                <Card>
                  <p className="text-xs text-gray-500">Activos</p>
                  <p className="text-xl font-bold text-green-600">{resumenCreditosCliente.activos}</p>
                </Card>
                <Card>
                  <p className="text-xs text-gray-500">Morosos</p>
                  <p className="text-xl font-bold text-red-600">{resumenCreditosCliente.morosos}</p>
                </Card>
                <Card>
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="text-xl font-bold">{clienteDetalle.telefono || '-'}</p>
                </Card>
              </div>

              <Card>
                <h3 className="text-base font-semibold mb-4">Créditos y Productos</h3>
                <div className="space-y-4">
                  {creditosCliente.length === 0 && (
                    <p className="text-sm text-gray-500">Este cliente no tiene créditos registrados.</p>
                  )}

                  {creditosCliente.map((credito) => (
                    <div key={credito.id_credito} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="info">Crédito #{credito.id_credito}</Badge>
                          <Badge
                            variant={
                              credito.estado === 'MOROSO'
                                ? 'error'
                                : credito.estado === 'ACTIVO'
                                  ? 'success'
                                  : 'secondary'
                            }
                          >
                            {credito.estado}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Inicio: {formatDate(credito.fecha_inicio)} | Vence: {formatDate(credito.fecha_vencimiento)}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            if (clienteDetalle) {
                              exportarCreditoDetalle(clienteDetalle, credito)
                            }
                          }}
                        >
                          Exportar este crédito
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Vendedor</p>
                          <p className="font-medium">
                            {credito.vendedores?.nombre || credito.vendedores?.usuarios?.nombre || 'No asignado'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Monto Total</p>
                          <p className="font-medium">{formatCurrency(Number(credito.monto_total || 0))}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Saldo Pendiente</p>
                          <p className="font-medium text-blue-600">
                            {formatCurrency(Number(credito.saldo_pendiente || 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Cuota</p>
                          <p className="font-medium">
                            {formatCurrency(Number(credito.cuota || 0))} ({credito.frecuencia_pago})
                          </p>
                        </div>
                      </div>

                      {(() => {
                        const met = calcularMetricasCredito(credito)
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Monto Pagado</p>
                              <p className="font-medium text-green-600">{formatCurrency(met.montoPagado)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Cuotas Pagadas (eq.)</p>
                              <p className="font-medium">{met.cuotasEqPagadas.toFixed(2)} / {met.cuotasTotal}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Cuotas Pendientes</p>
                              <p className="font-medium text-yellow-600">{met.cuotasPendientes}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Pagos Registrados</p>
                              <p className="font-medium">{(credito.pagos || []).length}</p>
                            </div>
                          </div>
                        )
                      })()}

                      <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-3">
                        <p className="text-sm font-medium mb-3">Registrar pago</p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <Input
                            label="Monto"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formPago[credito.id_credito]?.monto ?? ''}
                            onChange={(e) =>
                              setFormPago((prev) => ({
                                ...prev,
                                [credito.id_credito]: {
                                  ...(prev[credito.id_credito] || {
                                    fecha: new Date().toISOString().slice(0, 10),
                                    metodo: 'EFECTIVO',
                                    detallePorProducto: {},
                                    loading: false
                                  }),
                                  monto: e.target.value
                                }
                              }))
                            }
                            placeholder="0.00"
                          />
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Fecha de pago
                            </label>
                            <input
                              type="date"
                              value={formPago[credito.id_credito]?.fecha ?? new Date().toISOString().slice(0, 10)}
                              onChange={(e) =>
                                setFormPago((prev) => ({
                                  ...prev,
                                  [credito.id_credito]: {
                                    ...(prev[credito.id_credito] || {
                                      monto: '',
                                      metodo: 'EFECTIVO',
                                      detallePorProducto: {},
                                      loading: false
                                    }),
                                    fecha: e.target.value
                                  }
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Método
                            </label>
                            <select
                              value={formPago[credito.id_credito]?.metodo ?? 'EFECTIVO'}
                              onChange={(e) =>
                                setFormPago((prev) => ({
                                  ...prev,
                                  [credito.id_credito]: {
                                    ...(prev[credito.id_credito] || {
                                      monto: '',
                                      fecha: new Date().toISOString().slice(0, 10),
                                      detallePorProducto: {},
                                      loading: false
                                    }),
                                    metodo: e.target.value
                                  }
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                              <option value="EFECTIVO">Efectivo</option>
                              <option value="TRANSFERENCIA">Transferencia</option>
                              <option value="DEPOSITO">Depósito</option>
                              <option value="OTRO">Otro</option>
                            </select>
                          </div>
                          <div className="flex items-end">
                            <Button
                              fullWidth
                              onClick={() => registrarPagoCredito(credito)}
                              loading={formPago[credito.id_credito]?.loading ?? false}
                            >
                              Registrar pago
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-2">
                            Distribución exacta del pago por producto
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(credito.credito_detalle || []).map((detalle, idx) => {
                              const idProducto = Number(detalle.id_producto || 0)
                              const pagadoActual = idProducto > 0 ? getMontoPagadoProducto(credito, idProducto) : 0
                              const subtotal = Number(detalle.subtotal || 0)
                              const saldoProducto = Math.max(subtotal - pagadoActual, 0)

                              return (
                                <Input
                                  key={idx}
                                  label={`${detalle.productos?.nombre || 'Producto'} (saldo ${formatCurrency(saldoProducto)})`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={formPago[credito.id_credito]?.detallePorProducto?.[idProducto] ?? ''}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    setFormPago((prev) => ({
                                      ...prev,
                                      [credito.id_credito]: {
                                        ...(prev[credito.id_credito] || {
                                          monto: '',
                                          fecha: new Date().toISOString().slice(0, 10),
                                          metodo: 'EFECTIVO',
                                          loading: false,
                                          detallePorProducto: {}
                                        }),
                                        detallePorProducto: {
                                          ...(prev[credito.id_credito]?.detallePorProducto || {}),
                                          [idProducto]: value
                                        }
                                      }
                                    }))
                                  }}
                                  placeholder="0.00"
                                />
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Productos del crédito</p>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                                <th className="py-2 pr-3">Producto</th>
                                <th className="py-2 pr-3">Cantidad</th>
                                <th className="py-2 pr-3">Precio Unitario</th>
                                <th className="py-2 pr-3">Subtotal</th>
                                <th className="py-2 pr-3">Avance Pago (%)</th>
                                <th className="py-2 pr-3">Cuotas Eq.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(credito.credito_detalle || []).map((detalle, idx) => {
                                const met = calcularMetricasCredito(credito)
                                const subtotal = Number(detalle.subtotal || 0)
                                const idProducto = Number(detalle.id_producto || 0)
                                const pagoExactoProducto = idProducto > 0 ? getMontoPagadoProducto(credito, idProducto) : 0
                                const avancePct = subtotal > 0 ? Math.min((pagoExactoProducto / subtotal) * 100, 100) : 0
                                const cuotasEqProducto = met.cuota > 0 ? pagoExactoProducto / met.cuota : 0

                                return (
                                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                                    <td className="py-2 pr-3">{detalle.productos?.nombre || 'Producto'}</td>
                                    <td className="py-2 pr-3">{detalle.cantidad}</td>
                                    <td className="py-2 pr-3">{formatCurrency(Number(detalle.precio_unitario || 0))}</td>
                                    <td className="py-2 pr-3 font-medium">
                                      {formatCurrency(subtotal)}
                                    </td>
                                    <td className="py-2 pr-3">{avancePct.toFixed(2)}%</td>
                                    <td className="py-2 pr-3">{cuotasEqProducto.toFixed(2)}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Historial de pagos</p>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                                <th className="py-2 pr-3">Fecha</th>
                                <th className="py-2 pr-3">Monto</th>
                                <th className="py-2 pr-3">Método</th>
                                <th className="py-2 pr-3">Detalle por producto</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(credito.pagos || []).length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-3 text-gray-500">Sin pagos registrados</td>
                                </tr>
                              ) : (
                                (credito.pagos || []).map((p, idx) => (
                                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                                    <td className="py-2 pr-3">{formatDate(p.fecha_pago)}</td>
                                    <td className="py-2 pr-3 font-medium">{formatCurrency(Number(p.monto_pagado || 0))}</td>
                                    <td className="py-2 pr-3">{p.metodo_pago || '-'}</td>
                                    <td className="py-2 pr-3">
                                      {(p.pago_detalle_producto || []).length > 0
                                        ? (p.pago_detalle_producto || [])
                                            .map((d) => `${d.productos?.nombre || d.id_producto}: ${formatCurrency(Number(d.monto_pagado || 0))}`)
                                            .join(' | ')
                                        : 'Sin detalle (pago antiguo)'}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </LayoutContainer>
  )
}
