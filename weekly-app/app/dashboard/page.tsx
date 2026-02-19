'use client'

import { useEffect, useMemo, useState } from 'react'
import LayoutContainer from '@/components/layout/LayoutContainer'
import { Card } from '@/components/ui/Card'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { BarChart, LineChart, PieChart } from '@/components/charts'
import { apiClient } from '@/lib/api/client'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import { formatCompactCurrency, formatCurrency } from '@/lib/utils'

interface DashboardPayload {
  general: {
    usuarios: number
    vendedores: number
    clientes: number
    productos: number
    creditosActivos: number
    stockBajo: number
    alertas: {
      stockBajo: number
      creditosVencidos: number
    }
  }
  creditos: {
    creditosActivos: number
    creditosVencidos: number
    montoPendiente: number
    montoVencido: number
    pagosHoy: Array<{
      id_pago: number
      monto_pagado: number | string
      fecha_pago: string
    }>
  }
  inventario: {
    productosConStock: number
    unidadesTotales: number
    valorTotal: number
    movimientosRecientes: Array<{
      id_movimiento: number
      cantidad: number
      fecha_movimiento: string
      tipo_movimiento?: { nombre_tipo?: string }
      productos?: { nombre?: string }
    }>
  }
  ultimaActualizacion: string
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardPayload | null>(null)
  const { showToast } = useToast()
  const { user } = useAuth()

  const roleNames = (user?.roles || []).map((r) => (r.nombre_rol || '').toUpperCase())
  const isBusinessView = roleNames.includes('ADMIN') || roleNames.includes('SUPERVISOR')

  useEffect(() => {
    cargarDashboard()
  }, [])

  const cargarDashboard = async () => {
    try {
      setLoading(true)
      const payload = await apiClient.get('/api/dashboard')
      setData(payload)
    } catch (error: any) {
      showToast(error.message || 'No se pudo cargar el dashboard', 'error')
    } finally {
      setLoading(false)
    }
  }

  const pagosPorHora = useMemo(() => {
    const buckets = Array.from({ length: 24 }, () => 0)
    ;(data?.creditos?.pagosHoy || []).forEach((p) => {
      const date = new Date(p.fecha_pago)
      const h = date.getHours()
      buckets[h] += Number(p.monto_pagado || 0)
    })
    return {
      labels: buckets.map((_, h) => `${String(h).padStart(2, '0')}:00`),
      data: buckets
    }
  }, [data])

  const movimientosPorTipo = useMemo(() => {
    const map = new Map<string, number>()
    ;(data?.inventario?.movimientosRecientes || []).forEach((mov) => {
      const tipo = (mov.tipo_movimiento?.nombre_tipo || 'OTRO').toUpperCase()
      map.set(tipo, (map.get(tipo) || 0) + Math.abs(Number(mov.cantidad || 0)))
    })
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
    return {
      labels: entries.map((e) => e[0]),
      data: entries.map((e) => e[1])
    }
  }, [data])

  const statsCards = useMemo(() => {
    if (!data) return []
    return [
      {
        title: 'Clientes',
        value: data.general.clientes,
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2m-10 2v-2a5 5 0 0110 0M9 7a3 3 0 106 0 3 3 0 00-6 0z" />
          </svg>
        ),
        color: 'blue' as const
      },
      {
        title: 'Créditos Activos',
        value: data.creditos.creditosActivos,
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m0-1h.01" />
          </svg>
        ),
        color: 'green' as const
      },
      {
        title: 'Cartera Pendiente',
        value: formatCompactCurrency(Number(data.creditos.montoPendiente || 0)),
        valueTitle: formatCurrency(Number(data.creditos.montoPendiente || 0)),
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9z" />
          </svg>
        ),
        color: 'purple' as const
      },
      {
        title: 'Valor Inventario',
        value: formatCompactCurrency(Number(data.inventario.valorTotal || 0)),
        valueTitle: formatCurrency(Number(data.inventario.valorTotal || 0)),
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7" />
          </svg>
        ),
        color: 'orange' as const
      }
    ]
  }, [data])

  if (loading) {
    return (
      <LayoutContainer>
        <Card>
          <p className="text-sm text-gray-600 dark:text-gray-300">Cargando dashboard...</p>
        </Card>
      </LayoutContainer>
    )
  }

  if (!data) {
    return (
      <LayoutContainer>
        <Card>
          <p className="text-sm text-gray-600 dark:text-gray-300">No se pudo cargar información del dashboard.</p>
        </Card>
      </LayoutContainer>
    )
  }

  return (
    <LayoutContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Vista ejecutiva de cartera, pagos e inventario
          </p>
        </div>

        <StatsCards stats={statsCards} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold mb-3">Composición Operativa</h3>
            <PieChart
              labels={['Clientes', 'Vendedores', 'Productos', 'Créditos Activos']}
              data={[
                data.general.clientes || 0,
                data.general.vendedores || 0,
                data.general.productos || 0,
                data.general.creditosActivos || 0
              ]}
              height={280}
            />
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-3">Estado de Cartera</h3>
            <BarChart
              labels={['Activos', 'Vencidos']}
              datasets={[{
                label: 'Cantidad de créditos',
                data: [data.creditos.creditosActivos || 0, data.creditos.creditosVencidos || 0],
                backgroundColor: '#3b82f6'
              }]}
              height={280}
            />
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold mb-3">Pagos de Hoy por Hora</h3>
            <LineChart
              labels={pagosPorHora.labels}
              datasets={[{
                label: 'Monto recaudado',
                data: pagosPorHora.data,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                fill: true
              }]}
              height={300}
            />
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-3">Movimientos Recientes por Tipo</h3>
            <BarChart
              labels={movimientosPorTipo.labels}
              datasets={[{
                label: 'Unidades movidas',
                data: movimientosPorTipo.data,
                backgroundColor: '#f59e0b'
              }]}
              height={300}
              horizontal
            />
          </Card>
        </div>

        <Card>
          <h3 className="text-sm font-semibold mb-2">Alertas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3">
              Stock bajo: <b>{data.general.alertas.stockBajo}</b>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
              Créditos vencidos: <b>{data.general.alertas.creditosVencidos}</b>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
              Última actualización: <b>{new Date(data.ultimaActualizacion).toLocaleString('es-GT')}</b>
            </div>
          </div>
          {!isBusinessView && (
            <p className="mt-3 text-xs text-gray-500">
              Vista resumida: para decisiones ejecutivas usar rol ADMIN o SUPERVISOR.
            </p>
          )}
        </Card>
      </div>
    </LayoutContainer>
  )
}
