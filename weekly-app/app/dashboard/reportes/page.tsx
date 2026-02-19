'use client'

import { useMemo, useState } from 'react'
import LayoutContainer from '@/components/layout/LayoutContainer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { BarChart } from '@/components/charts'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'
import { formatCurrency } from '@/lib/utils'

type ProductoResumen = {
  id_producto: number
  nombre: string
  unidades: number
  monto: number
  porcentaje_unidades: number
}

type RutaReporte = {
  id_ruta: number
  codigo_ruta: string
  nombre_ruta: string
  zona: string | null
  vendedores: string[]
  total_clientes: number
  clientes_con_credito: number
  total_creditos: number
  unidades_distribuidas: number
  monto_distribuido: number
  recaudacion_periodo: number
  ticket_promedio_credito: number
  cobertura_clientes_pct: number
  indice_mora_pct: number
  tasa_recuperacion_pct: number
  top_productos: ProductoResumen[]
  versus: {
    clientes_pct: number
    creditos_pct: number
    monto_distribuido_pct: number
    recaudacion_pct: number
    mora_pct: number
  }
  score: number
  ranking: number
}

type ReporteRutasResponse = {
  rango: {
    inicio?: string | null
    fin?: string | null
  }
  resumen: {
    total_rutas: number
    total_clientes: number
    total_creditos: number
    total_unidades: number
    total_monto_distribuido: number
    total_recaudacion: number
    promedio_mora_pct: number
    promedio_cobertura_pct: number
    mejor_ruta: {
      id_ruta: number
      codigo_ruta: string
      nombre_ruta: string
      score: number
    } | null
  }
  rutas: RutaReporte[]
}

const formatPct = (value: number) => `${value.toFixed(1)}%`
const formatVersus = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`

const escapeCsv = (value: string | number | null | undefined) => {
  const raw = value === null || value === undefined ? '' : String(value)
  return `"${raw.replace(/"/g, '""')}"`
}

export default function ReportesPage() {
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0]
  )
  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [reporteData, setReporteData] = useState<ReporteRutasResponse | null>(null)

  const { showToast } = useToast()

  const generarReporteRutas = async () => {
    if (!fechaInicio || !fechaFin) {
      showToast('Selecciona un rango de fechas válido', 'error')
      return
    }

    if (fechaInicio > fechaFin) {
      showToast('La fecha inicio no puede ser mayor que la fecha fin', 'error')
      return
    }

    try {
      setLoading(true)
      const data = await apiClient.get(
        `/api/reportes/rutas?inicio=${fechaInicio}&fin=${fechaFin}`
      )
      setReporteData(data)
      showToast('Reporte generado correctamente', 'success')
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredRutas = useMemo(() => {
    if (!reporteData?.rutas) return []
    const query = searchTerm.trim().toLowerCase()
    if (!query) return reporteData.rutas

    return reporteData.rutas.filter((ruta) => {
      return (
        ruta.codigo_ruta.toLowerCase().includes(query) ||
        ruta.nombre_ruta.toLowerCase().includes(query) ||
        (ruta.zona || '').toLowerCase().includes(query) ||
        ruta.vendedores.some((v) => v.toLowerCase().includes(query))
      )
    })
  }, [reporteData, searchTerm])

  const exportarExcel = () => {
    if (!reporteData) {
      showToast('Primero genera el reporte', 'error')
      return
    }

    const rows: string[] = []

    rows.push('RESUMEN GENERAL')
    rows.push([
      'Fecha inicio',
      reporteData.rango.inicio || '',
      'Fecha fin',
      reporteData.rango.fin || ''
    ].map(escapeCsv).join(','))

    rows.push([
      'Total rutas',
      reporteData.resumen.total_rutas,
      'Total clientes',
      reporteData.resumen.total_clientes,
      'Total créditos',
      reporteData.resumen.total_creditos
    ].map(escapeCsv).join(','))

    rows.push([
      'Unidades distribuidas',
      reporteData.resumen.total_unidades,
      'Monto distribuido',
      reporteData.resumen.total_monto_distribuido,
      'Recaudación',
      reporteData.resumen.total_recaudacion
    ].map(escapeCsv).join(','))

    rows.push('')
    rows.push('COMPARATIVO RUTAS (VERSUS PROMEDIO)')
    rows.push([
      'Ranking',
      'Código ruta',
      'Ruta',
      'Zona',
      'Vendedores',
      'Clientes',
      'Créditos',
      'Unidades',
      'Monto distribuido',
      'Recaudación',
      'Cobertura clientes %',
      'Índice mora %',
      'Recuperación %',
      'Versus clientes %',
      'Versus créditos %',
      'Versus monto %',
      'Versus recaudación %',
      'Versus mora %'
    ].map(escapeCsv).join(','))

    for (const ruta of reporteData.rutas) {
      rows.push([
        ruta.ranking,
        ruta.codigo_ruta,
        ruta.nombre_ruta,
        ruta.zona || '',
        ruta.vendedores.join(' | '),
        ruta.total_clientes,
        ruta.total_creditos,
        ruta.unidades_distribuidas,
        ruta.monto_distribuido,
        ruta.recaudacion_periodo,
        ruta.cobertura_clientes_pct.toFixed(2),
        ruta.indice_mora_pct.toFixed(2),
        ruta.tasa_recuperacion_pct.toFixed(2),
        ruta.versus.clientes_pct.toFixed(2),
        ruta.versus.creditos_pct.toFixed(2),
        ruta.versus.monto_distribuido_pct.toFixed(2),
        ruta.versus.recaudacion_pct.toFixed(2),
        ruta.versus.mora_pct.toFixed(2)
      ].map(escapeCsv).join(','))
    }

    rows.push('')
    rows.push('DETALLE DE PRODUCTOS DISTRIBUIDOS POR RUTA')
    rows.push([
      'Código ruta',
      'Ruta',
      'Producto',
      'Unidades',
      'Monto',
      'Participación unidades %'
    ].map(escapeCsv).join(','))

    for (const ruta of reporteData.rutas) {
      for (const producto of ruta.top_productos) {
        rows.push([
          ruta.codigo_ruta,
          ruta.nombre_ruta,
          producto.nombre,
          producto.unidades,
          producto.monto,
          producto.porcentaje_unidades.toFixed(2)
        ].map(escapeCsv).join(','))
      }
    }

    const csv = `\uFEFF${rows.join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte_rutas_${fechaInicio}_a_${fechaFin}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showToast('Archivo exportado para Excel', 'success')
  }

  const chartLabels = filteredRutas.map((r) => r.codigo_ruta)

  return (
    <LayoutContainer>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Reporte de Rutas
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Distribución de productos, clientes, cobranza y comparativo entre rutas
            </p>
          </div>
        </div>

        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <Input
              type="date"
              label="Fecha Inicio"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
            <Input
              type="date"
              label="Fecha Fin"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={generarReporteRutas} loading={loading}>
                Generar Reporte
              </Button>
              <Button variant="secondary" onClick={exportarExcel}>
                Exportar Excel
              </Button>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Rango sugerido: últimos 90 días para ver colocaciones y cobranza con más contexto.
          </p>
        </Card>

        {reporteData && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <p className="text-sm text-gray-600">Rutas Analizadas</p>
                <p className="text-2xl font-bold text-blue-600">{reporteData.resumen.total_rutas}</p>
              </Card>
              <Card>
                <p className="text-sm text-gray-600">Clientes Totales</p>
                <p className="text-2xl font-bold">{reporteData.resumen.total_clientes}</p>
              </Card>
              <Card>
                <p className="text-sm text-gray-600">Monto Distribuido</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(reporteData.resumen.total_monto_distribuido)}
                </p>
              </Card>
              <Card>
                <p className="text-sm text-gray-600">Recaudación</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(reporteData.resumen.total_recaudacion)}
                </p>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold mb-4">Versus Monto Distribuido</h3>
                <BarChart
                  labels={chartLabels}
                  datasets={[
                    {
                      label: 'Vs promedio (%)',
                      data: filteredRutas.map((r) => Number(r.versus.monto_distribuido_pct.toFixed(2))),
                      backgroundColor: '#2563eb'
                    }
                  ]}
                />
              </Card>

              <Card>
                <h3 className="text-lg font-semibold mb-4">Versus Recaudación</h3>
                <BarChart
                  labels={chartLabels}
                  datasets={[
                    {
                      label: 'Vs promedio (%)',
                      data: filteredRutas.map((r) => Number(r.versus.recaudacion_pct.toFixed(2))),
                      backgroundColor: '#059669'
                    }
                  ]}
                />
              </Card>
            </div>

            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold">Comparativo de Indicadores por Ruta</h3>
                <div className="w-full sm:w-72">
                  <Input
                    placeholder="Buscar por ruta, zona o vendedor"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1200px] w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 pr-3">Rank</th>
                      <th className="py-3 pr-3">Ruta</th>
                      <th className="py-3 pr-3">Clientes</th>
                      <th className="py-3 pr-3">Créditos</th>
                      <th className="py-3 pr-3">Unidades</th>
                      <th className="py-3 pr-3">Monto</th>
                      <th className="py-3 pr-3">Recaudación</th>
                      <th className="py-3 pr-3">Cobertura</th>
                      <th className="py-3 pr-3">Mora</th>
                      <th className="py-3 pr-3">Vs monto</th>
                      <th className="py-3 pr-3">Vs recaudación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRutas.map((ruta) => (
                      <tr key={ruta.id_ruta} className="border-b last:border-b-0 align-top">
                        <td className="py-3 pr-3 font-semibold">#{ruta.ranking}</td>
                        <td className="py-3 pr-3">
                          <p className="font-medium">{ruta.codigo_ruta} - {ruta.nombre_ruta}</p>
                          <p className="text-xs text-gray-500">{ruta.zona || 'Sin zona'}</p>
                        </td>
                        <td className="py-3 pr-3">{ruta.total_clientes}</td>
                        <td className="py-3 pr-3">{ruta.total_creditos}</td>
                        <td className="py-3 pr-3">{ruta.unidades_distribuidas}</td>
                        <td className="py-3 pr-3">{formatCurrency(ruta.monto_distribuido)}</td>
                        <td className="py-3 pr-3 text-green-700">{formatCurrency(ruta.recaudacion_periodo)}</td>
                        <td className="py-3 pr-3">{formatPct(ruta.cobertura_clientes_pct)}</td>
                        <td className="py-3 pr-3">{formatPct(ruta.indice_mora_pct)}</td>
                        <td className={`py-3 pr-3 ${ruta.versus.monto_distribuido_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatVersus(ruta.versus.monto_distribuido_pct)}
                        </td>
                        <td className={`py-3 pr-3 ${ruta.versus.recaudacion_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatVersus(ruta.versus.recaudacion_pct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold mb-4">Top Productos Distribuidos por Ruta</h3>
              <div className="space-y-4">
                {filteredRutas.map((ruta) => (
                  <div key={`top-${ruta.id_ruta}`} className="border rounded-lg p-4">
                    <p className="font-semibold mb-2">{ruta.codigo_ruta} - {ruta.nombre_ruta}</p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="py-2 pr-3">Producto</th>
                            <th className="py-2 pr-3">Unidades</th>
                            <th className="py-2 pr-3">Monto</th>
                            <th className="py-2 pr-3">Participación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ruta.top_productos.length > 0 ? (
                            ruta.top_productos.map((producto) => (
                              <tr key={`${ruta.id_ruta}-${producto.id_producto}`} className="border-b last:border-b-0">
                                <td className="py-2 pr-3">{producto.nombre}</td>
                                <td className="py-2 pr-3">{producto.unidades}</td>
                                <td className="py-2 pr-3">{formatCurrency(producto.monto)}</td>
                                <td className="py-2 pr-3">{formatPct(producto.porcentaje_unidades)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-3 text-gray-500">
                                Sin productos distribuidos en este rango.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

      </div>
    </LayoutContainer>
  )
}
