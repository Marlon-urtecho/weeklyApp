'use client'

import { useEffect, useMemo, useState } from 'react'
import LayoutContainer from '@/components/layout/LayoutContainer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { CreditosTable } from '@/components/tables/CreditosTable'
import { CreditoForm } from '@/components/forms/CreditoForm'
import { PagoForm } from '@/components/forms/PagoForm'
import VentaContadoForm from '@/components/forms/VentaContadoForm'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'
import { formatCurrency } from '@/lib/utils'
import type { Credito } from '@/types/credito'

const toNumber = (value: unknown) => Number(value || 0)
const escapeCsv = (value: string | number | null | undefined) => {
  const raw = value === null || value === undefined ? '' : String(value)
  return `"${raw.replace(/"/g, '""')}"`
}

type ReporteVentasVendedor = {
  id_vendedor: number
  nombre: string
  username?: string
  transacciones: number
  unidades_vendidas: number
  monto_total_ventas: number
  monto_credito: number
  monto_contado: number
  cobranza_periodo: number
  tasa_cobranza_pct: number
}

type ReporteVentasResponse = {
  rango: {
    inicio?: string | null
    fin?: string | null
  }
  resumen: {
    vendedores: number
    transacciones: number
    unidades_vendidas: number
    monto_total_ventas: number
    monto_credito: number
    monto_contado: number
    cobranza_periodo: number
  }
  vendedores: ReporteVentasVendedor[]
  detalle_ventas?: Array<{
    fecha: string
    referencia: string
    tipo_venta: 'CREDITO' | 'CONTADO'
    id_vendedor: number
    vendedor: string
    cliente: string
    codigo_cliente?: string
    producto: string
    categoria: string
    cantidad: number
    precio_unitario: number
    monto: number
  }>
}

export default function CreditosPage() {
  const [creditos, setCreditos] = useState<Credito[]>([])
  const [loading, setLoading] = useState(true)
  const [modalNuevo, setModalNuevo] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [modalPago, setModalPago] = useState(false)
  const [modalContado, setModalContado] = useState(false)
  const [modalReporteVentas, setModalReporteVentas] = useState(false)
  const [creditoSeleccionado, setCreditoSeleccionado] = useState<Credito | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [fechaInicioReporte, setFechaInicioReporte] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  )
  const [fechaFinReporte, setFechaFinReporte] = useState(new Date().toISOString().split('T')[0])
  const [loadingReporteVentas, setLoadingReporteVentas] = useState(false)
  const [reporteVentas, setReporteVentas] = useState<ReporteVentasResponse | null>(null)

  const { showToast } = useToast()

  useEffect(() => {
    cargarCreditos()
  }, [])

  const cargarCreditos = async () => {
    try {
      setLoading(true)
      const data = await apiClient.get('/api/creditos')
      setCreditos(Array.isArray(data) ? data : [])
    } catch (error: any) {
      showToast(error.message || 'Error cargando créditos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const activos = creditos.filter((c) => c.estado === 'ACTIVO').length
    const morosos = creditos.filter((c) => c.estado === 'MOROSO').length
    const cerrados = creditos.filter((c) => c.estado === 'PAGADO' || c.estado === 'CANCELADO').length
    const totalPendiente = creditos
      .filter((c) => c.estado === 'ACTIVO' || c.estado === 'MOROSO')
      .reduce((sum, c) => sum + toNumber(c.saldo_pendiente), 0)

    const hoy = new Date().toDateString()
    let pagosHoy = 0
    let montoPagadoHoy = 0

    creditos.forEach((c) => {
      ;(c.pagos || []).forEach((p) => {
        if (p.fecha_pago && new Date(p.fecha_pago).toDateString() === hoy) {
          pagosHoy += 1
          montoPagadoHoy += toNumber(p.monto_pagado)
        }
      })
    })

    return { activos, morosos, cerrados, totalPendiente, pagosHoy, montoPagadoHoy }
  }, [creditos])

  const filteredCreditos = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()

    return creditos.filter((c) => {
      const clienteNombre = c.clientes?.nombre?.toLowerCase() || ''
      const clienteCodigo = c.clientes?.codigo_cliente?.toLowerCase() || ''
      const vendedorNombre = c.vendedores?.nombre?.toLowerCase() || ''
      const matchesSearch = !term ||
        clienteNombre.includes(term) ||
        clienteCodigo.includes(term) ||
        vendedorNombre.includes(term)

      const matchesEstado = filtroEstado === 'todos' || c.estado === filtroEstado
      return matchesSearch && matchesEstado
    })
  }, [creditos, searchTerm, filtroEstado])

  const handleView = async (credito: Credito) => {
    try {
      const detalle = await apiClient.get(`/api/creditos/${credito.id_credito}`)
      setCreditoSeleccionado(detalle)
      setModalDetalle(true)
    } catch {
      setCreditoSeleccionado(credito)
      setModalDetalle(true)
    }
  }

  const openPagoModal = (credito: Credito) => {
    setCreditoSeleccionado(credito)
    setModalPago(true)
  }

  const generarReporteVentas = async () => {
    if (!fechaInicioReporte || !fechaFinReporte) {
      showToast('Selecciona un rango de fechas válido', 'error')
      return
    }
    if (fechaInicioReporte > fechaFinReporte) {
      showToast('La fecha inicio no puede ser mayor que la fecha fin', 'error')
      return
    }

    try {
      setLoadingReporteVentas(true)
      const data = await apiClient.get(`/api/reportes/ventas-vendedores?inicio=${fechaInicioReporte}&fin=${fechaFinReporte}`)
      setReporteVentas(data)
      showToast('Reporte de ventas generado', 'success')
    } catch (error: any) {
      showToast(error.message || 'No se pudo generar el reporte', 'error')
    } finally {
      setLoadingReporteVentas(false)
    }
  }

  const exportarReporteVentas = () => {
    if (!reporteVentas) {
      showToast('Primero genera el reporte', 'error')
      return
    }

    const rows: string[] = []
    rows.push('REPORTE DE VENTAS POR VENDEDOR')
    rows.push([
      'Fecha inicio',
      reporteVentas.rango.inicio || '',
      'Fecha fin',
      reporteVentas.rango.fin || ''
    ].map(escapeCsv).join(','))

    rows.push([
      'Vendedores',
      reporteVentas.resumen.vendedores,
      'Transacciones',
      reporteVentas.resumen.transacciones,
      'Unidades',
      reporteVentas.resumen.unidades_vendidas
    ].map(escapeCsv).join(','))

    rows.push([
      'Monto ventas',
      reporteVentas.resumen.monto_total_ventas,
      'Monto crédito',
      reporteVentas.resumen.monto_credito,
      'Monto contado',
      reporteVentas.resumen.monto_contado
    ].map(escapeCsv).join(','))

    rows.push([
      'Cobranza periodo',
      reporteVentas.resumen.cobranza_periodo
    ].map(escapeCsv).join(','))

    rows.push('')
    rows.push('DETALLE POR VENDEDOR')
    rows.push([
      'Vendedor',
      'Usuario',
      'Transacciones',
      'Unidades',
      'Monto ventas',
      'Monto crédito',
      'Monto contado',
      'Cobranza',
      'Tasa cobranza %'
    ].map(escapeCsv).join(','))

    for (const row of reporteVentas.vendedores) {
      rows.push([
        row.nombre,
        row.username || '',
        row.transacciones,
        row.unidades_vendidas,
        row.monto_total_ventas,
        row.monto_credito,
        row.monto_contado,
        row.cobranza_periodo,
        row.tasa_cobranza_pct.toFixed(2)
      ].map(escapeCsv).join(','))
    }

    rows.push('')
    rows.push('DETALLE DE VENTAS (CLIENTE / PRODUCTO / CATEGORIA)')
    rows.push([
      'Fecha',
      'Referencia',
      'Tipo venta',
      'Vendedor',
      'Cliente',
      'Código cliente',
      'Producto',
      'Categoría',
      'Cantidad',
      'Precio unitario',
      'Monto'
    ].map(escapeCsv).join(','))

    for (const d of reporteVentas.detalle_ventas || []) {
      rows.push([
        new Date(d.fecha).toLocaleString(),
        d.referencia,
        d.tipo_venta,
        d.vendedor,
        d.cliente,
        d.codigo_cliente || '',
        d.producto,
        d.categoria,
        d.cantidad,
        d.precio_unitario,
        d.monto
      ].map(escapeCsv).join(','))
    }

    const csv = `\uFEFF${rows.join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte_ventas_${fechaInicioReporte}_a_${fechaFinReporte}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showToast('Reporte exportado para Excel', 'success')
  }

  const statsCards = [
    {
      title: 'Créditos Activos',
      value: stats.activos,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'green' as const
    },
    {
      title: 'Créditos Morosos',
      value: stats.morosos,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'red' as const
    },
    {
      title: 'Créditos Cerrados',
      value: stats.cerrados,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      color: 'purple' as const
    },
    {
      title: 'Total Pendiente',
      value: formatCurrency(stats.totalPendiente),
      valueTitle: stats.totalPendiente.toString(),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      color: 'blue' as const
    },
    {
      title: 'Pagos Hoy',
      value: `${stats.pagosHoy} (${formatCurrency(stats.montoPagadoHoy)})`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'purple' as const
    }
  ]

  return (
    <LayoutContainer>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Créditos</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Gestiona créditos, cuotas y ventas cerradas al contado
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setModalReporteVentas(true)} variant="secondary">Reporte Ventas</Button>
            <Button onClick={() => setModalContado(true)} variant="secondary">Venta al contado</Button>
            <Button onClick={() => setModalNuevo(true)}>Nuevo Crédito</Button>
          </div>
        </div>

        <StatsCards stats={statsCards} />

        <Card>
          <div className="space-y-4">
            <Input
              placeholder="Buscar por cliente, código o vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="flex flex-wrap gap-2">
              {['todos', 'ACTIVO', 'MOROSO', 'PAGADO', 'CANCELADO'].map((estado) => (
                <button
                  key={estado}
                  onClick={() => setFiltroEstado(estado)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    filtroEstado === estado
                      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {estado === 'todos' ? 'Todos' : estado}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <CreditosTable
              data={filteredCreditos}
              loading={loading}
              onView={handleView}
              onRegistrarPago={openPagoModal}
            />
          </div>
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span className="font-medium">{filteredCreditos.length}</span> de{' '}
              <span className="font-medium">{creditos.length}</span> créditos
            </p>
          </div>
        </Card>

        <Modal
          isOpen={modalNuevo}
          onClose={() => setModalNuevo(false)}
          title="Nuevo Crédito"
          size="xl"
        >
          <CreditoForm
            onSuccess={() => {
              setModalNuevo(false)
              cargarCreditos()
            }}
            onCancel={() => setModalNuevo(false)}
          />
        </Modal>

        <Modal
          isOpen={modalContado}
          onClose={() => setModalContado(false)}
          title="Venta cerrada al contado"
          size="full"
        >
          <VentaContadoForm
            onSuccess={() => {
              setModalContado(false)
              cargarCreditos()
            }}
            onCancel={() => setModalContado(false)}
          />
        </Modal>

        <Modal
          isOpen={modalReporteVentas}
          onClose={() => setModalReporteVentas(false)}
          title="Reporte de Ventas por Vendedor"
          size="xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <Input
                type="date"
                label="Fecha inicio"
                value={fechaInicioReporte}
                onChange={(e) => setFechaInicioReporte(e.target.value)}
              />
              <Input
                type="date"
                label="Fecha fin"
                value={fechaFinReporte}
                onChange={(e) => setFechaFinReporte(e.target.value)}
              />
              <Button onClick={generarReporteVentas} loading={loadingReporteVentas}>
                Generar
              </Button>
              <Button variant="secondary" onClick={exportarReporteVentas}>
                Exportar Excel
              </Button>
            </div>

            {reporteVentas && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
                    <p className="text-xs text-blue-700 dark:text-blue-300">Vendedores</p>
                    <p className="text-lg font-bold text-blue-800 dark:text-blue-200">{reporteVentas.resumen.vendedores}</p>
                  </div>
                  <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-3">
                    <p className="text-xs text-indigo-700 dark:text-indigo-300">Monto ventas</p>
                    <p className="text-lg font-bold text-indigo-800 dark:text-indigo-200">{formatCurrency(reporteVentas.resumen.monto_total_ventas)}</p>
                  </div>
                  <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-3">
                    <p className="text-xs text-orange-700 dark:text-orange-300">Crédito / contado</p>
                    <p className="text-sm font-bold text-orange-800 dark:text-orange-200">
                      {formatCurrency(reporteVentas.resumen.monto_credito)} / {formatCurrency(reporteVentas.resumen.monto_contado)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
                    <p className="text-xs text-green-700 dark:text-green-300">Cobranza</p>
                    <p className="text-lg font-bold text-green-800 dark:text-green-200">{formatCurrency(reporteVentas.resumen.cobranza_periodo)}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[980px] w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 pr-3">Vendedor</th>
                        <th className="py-2 pr-3">Transacciones</th>
                        <th className="py-2 pr-3">Unidades</th>
                        <th className="py-2 pr-3">Monto ventas</th>
                        <th className="py-2 pr-3">Monto crédito</th>
                        <th className="py-2 pr-3">Monto contado</th>
                        <th className="py-2 pr-3">Cobranza</th>
                        <th className="py-2 pr-3">Tasa cobranza</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporteVentas.vendedores.map((v) => (
                        <tr key={v.id_vendedor} className="border-b last:border-b-0">
                          <td className="py-2 pr-3">
                            <p className="font-medium">{v.nombre}</p>
                            <p className="text-xs text-gray-500">{v.username || ''}</p>
                          </td>
                          <td className="py-2 pr-3">{v.transacciones}</td>
                          <td className="py-2 pr-3">{v.unidades_vendidas}</td>
                          <td className="py-2 pr-3">{formatCurrency(v.monto_total_ventas)}</td>
                          <td className="py-2 pr-3">{formatCurrency(v.monto_credito)}</td>
                          <td className="py-2 pr-3">{formatCurrency(v.monto_contado)}</td>
                          <td className="py-2 pr-3 text-green-700">{formatCurrency(v.cobranza_periodo)}</td>
                          <td className="py-2 pr-3">{v.tasa_cobranza_pct.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Detalle de ventas (cliente, producto y categoría)
                  </h4>
                  <div className="overflow-x-auto max-h-80">
                    <table className="min-w-[1200px] w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-2 pr-3">Fecha</th>
                          <th className="py-2 pr-3">Referencia</th>
                          <th className="py-2 pr-3">Tipo</th>
                          <th className="py-2 pr-3">Vendedor</th>
                          <th className="py-2 pr-3">Cliente</th>
                          <th className="py-2 pr-3">Producto</th>
                          <th className="py-2 pr-3">Categoría</th>
                          <th className="py-2 pr-3">Cantidad</th>
                          <th className="py-2 pr-3">P/U</th>
                          <th className="py-2 pr-3">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(reporteVentas.detalle_ventas || []).map((d, idx) => (
                          <tr key={`${d.referencia}-${d.id_vendedor}-${idx}`} className="border-b last:border-b-0">
                            <td className="py-2 pr-3">{new Date(d.fecha).toLocaleDateString()}</td>
                            <td className="py-2 pr-3">{d.referencia}</td>
                            <td className="py-2 pr-3">{d.tipo_venta}</td>
                            <td className="py-2 pr-3">{d.vendedor}</td>
                            <td className="py-2 pr-3">
                              <p>{d.cliente}</p>
                              <p className="text-xs text-gray-500">{d.codigo_cliente || ''}</p>
                            </td>
                            <td className="py-2 pr-3">{d.producto}</td>
                            <td className="py-2 pr-3">{d.categoria}</td>
                            <td className="py-2 pr-3">{d.cantidad}</td>
                            <td className="py-2 pr-3">{formatCurrency(d.precio_unitario)}</td>
                            <td className="py-2 pr-3 font-medium">{formatCurrency(d.monto)}</td>
                          </tr>
                        ))}
                        {(reporteVentas.detalle_ventas || []).length === 0 && (
                          <tr>
                            <td className="py-3 text-gray-500" colSpan={10}>
                              No hay ventas en el rango seleccionado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </Modal>

        <Modal
          isOpen={modalPago}
          onClose={() => setModalPago(false)}
          title={`Registrar pago - Crédito #${creditoSeleccionado?.id_credito || ''}`}
          size="lg"
        >
          <PagoForm
            creditoId={creditoSeleccionado?.id_credito}
            onSuccess={() => {
              setModalPago(false)
              cargarCreditos()
              if (creditoSeleccionado) {
                handleView(creditoSeleccionado)
              }
            }}
            onCancel={() => setModalPago(false)}
          />
        </Modal>

        <Modal
          isOpen={modalDetalle}
          onClose={() => setModalDetalle(false)}
          title={`Detalle del Crédito #${creditoSeleccionado?.id_credito || ''}`}
          size="xl"
        >
          {creditoSeleccionado && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cliente</p>
                  <p className="font-medium text-gray-900 dark:text-white">{creditoSeleccionado.clientes?.nombre || '-'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Código: {creditoSeleccionado.clientes?.codigo_cliente || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vendedor</p>
                  <p className="font-medium text-gray-900 dark:text-white">{creditoSeleccionado.vendedores?.nombre || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Monto Total</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(toNumber(creditoSeleccionado.monto_total))}</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs text-green-600 dark:text-green-400">Cuota</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">{formatCurrency(toNumber(creditoSeleccionado.cuota))}</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-xs text-purple-600 dark:text-purple-400">Saldo</p>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{formatCurrency(toNumber(creditoSeleccionado.saldo_pendiente))}</p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-xs text-orange-600 dark:text-orange-400">Estado</p>
                  <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{creditoSeleccionado.estado}</p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Productos del crédito</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(creditoSeleccionado.credito_detalle || []).length > 0 ? (
                    (creditoSeleccionado.credito_detalle || []).map((item, idx) => (
                      <div key={item.id_detalle || `${item.id_producto}-${idx}`} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <p className="text-sm font-medium">{item.productos?.nombre || `Producto ${item.id_producto}`}</p>
                        <p className="text-sm">Cant: {item.cantidad}</p>
                        <p className="text-sm">P/U: {formatCurrency(toNumber(item.precio_unitario))}</p>
                        <p className="text-sm font-semibold">Subtotal: {formatCurrency(toNumber(item.subtotal))}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No hay detalle de productos.</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Pagos registrados</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(creditoSeleccionado.pagos || []).length > 0 ? (
                    (creditoSeleccionado.pagos || []).map((pago) => (
                      <div key={pago.id_pago} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-2">
                        <div className="flex flex-wrap justify-between gap-2">
                          <p className="text-sm font-medium">
                            {new Date(pago.fecha_pago).toLocaleDateString()} - {formatCurrency(toNumber(pago.monto_pagado))}
                          </p>
                          <p className="text-xs text-gray-500">{pago.metodo_pago || 'Sin método'}</p>
                        </div>
                        {(pago.pago_detalle_producto || []).length > 0 && (
                          <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                            {(pago.pago_detalle_producto || []).map((dp, i) => (
                              <p key={`${pago.id_pago}-${dp.id_producto}-${i}`}>
                                {dp.productos?.nombre || `Producto ${dp.id_producto}`}: {formatCurrency(toNumber(dp.monto_pagado))}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No hay pagos registrados.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setModalDetalle(false)
                    setModalPago(true)
                  }}
                  disabled={creditoSeleccionado.estado === 'PAGADO' || creditoSeleccionado.estado === 'CANCELADO'}
                >
                  Registrar pago
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </LayoutContainer>
  )
}
