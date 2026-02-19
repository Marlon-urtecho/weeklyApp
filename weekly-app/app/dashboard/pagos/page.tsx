'use client'

import { useEffect, useMemo, useState } from 'react'
import LayoutContainer from '@/components/layout/LayoutContainer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { PagoForm } from '@/components/forms/PagoForm'

interface RawPago {
  id_pago: number
  monto_pagado: number | string
  fecha_pago: string
  metodo_pago?: string | null
  id_credito?: number
  creditos?: {
    id_credito: number
    clientes?: {
      nombre?: string
      codigo_cliente?: string
    }
  }
  credito?: {
    id_credito: number
    cliente?: {
      nombre?: string
      codigo_cliente?: string
    }
  }
  usuarios?: {
    nombre?: string
    username?: string
  }
  usuario?: {
    nombre?: string
    username?: string
  }
  pago_detalle_producto?: Array<{
    id_producto: number
    monto_pagado: number | string
    productos?: {
      nombre?: string
    }
  }>
}

interface PagoUI {
  id_pago: number
  monto_pagado: number
  fecha_pago: string
  metodo_pago: string
  credito: {
    id_credito: number
    cliente: {
      nombre: string
      codigo_cliente: string
    }
  }
  usuario: {
    nombre: string
    username: string
  }
  detalle_productos: Array<{
    id_producto: number
    nombre: string
    monto_pagado: number
  }>
}

interface CreditoActivo {
  id_credito: number
  cuota: number | string
  numero_cuotas: number
  fecha_inicio: string
  frecuencia_pago: string
  saldo_pendiente: number | string
  clientes?: {
    nombre?: string
    codigo_cliente?: string
  }
  credito_detalle?: Array<{
    id_producto: number
    subtotal?: number | string
    productos?: {
      nombre?: string
    }
  }>
  pagos?: Array<{
    monto_pagado: number | string
    pago_detalle_producto?: Array<{
      id_producto: number
      monto_pagado: number | string
    }>
  }>
}

interface ProximaCuotaProducto {
  id_credito: number
  cliente: string
  codigo_cliente: string
  producto: string
  fecha_proxima: string
  cuota_producto: number
  cuotas_equivalentes: number
  cuotas_totales: number
  saldo_producto: number
  saldo_credito: number
}

const calcNextDate = (fechaInicio: string, frecuencia: string, cuotaIndex: number) => {
  const base = new Date(fechaInicio)
  const result = new Date(base)

  if (frecuencia === 'SEMANAL') {
    result.setDate(base.getDate() + (7 * cuotaIndex))
  } else if (frecuencia === 'QUINCENAL') {
    result.setDate(base.getDate() + (14 * cuotaIndex))
  } else {
    result.setMonth(base.getMonth() + cuotaIndex)
  }

  return result
}

export default function PagosPage() {
  const [pagos, setPagos] = useState<PagoUI[]>([])
  const [creditosActivos, setCreditosActivos] = useState<CreditoActivo[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [fechaInicio, setFechaInicio] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0])
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0])

  const { showToast } = useToast()
  const { user } = useAuth()

  const roleNames = (user?.roles || []).map((r) => (r.nombre_rol || '').toUpperCase())
  const canSeeSupervisorView = roleNames.includes('ADMIN') || roleNames.includes('SUPERVISOR')
  const canUsePagosModule = canSeeSupervisorView || roleNames.includes('VENDEDOR')

  useEffect(() => {
    if (!canUsePagosModule) return
    cargarPagos()
    if (canSeeSupervisorView) {
      cargarCreditosActivos()
    }
  }, [canSeeSupervisorView, canUsePagosModule])

  const normalizePago = (raw: RawPago): PagoUI => {
    const creditoRaw: any = raw.creditos || raw.credito
    const clienteRaw: any = creditoRaw?.clientes || creditoRaw?.cliente
    const usuarioRaw = raw.usuarios || raw.usuario
    const detalle = Array.isArray(raw.pago_detalle_producto) ? raw.pago_detalle_producto : []

    return {
      id_pago: raw.id_pago,
      monto_pagado: Number(raw.monto_pagado || 0),
      fecha_pago: raw.fecha_pago,
      metodo_pago: raw.metodo_pago || 'EFECTIVO',
      credito: {
        id_credito: creditoRaw?.id_credito || Number(raw.id_credito || 0),
        cliente: {
          nombre: clienteRaw?.nombre || 'Sin cliente',
          codigo_cliente: clienteRaw?.codigo_cliente || '-'
        }
      },
      usuario: {
        nombre: usuarioRaw?.nombre || 'Sistema',
        username: usuarioRaw?.username || '-'
      },
      detalle_productos: detalle.map((d) => ({
        id_producto: d.id_producto,
        nombre: d.productos?.nombre || `Producto ${d.id_producto}`,
        monto_pagado: Number(d.monto_pagado || 0)
      }))
    }
  }

  const cargarPagos = async () => {
    try {
      setLoading(true)
      const data = await apiClient.get('/api/pagos')
      const normalizados = (Array.isArray(data) ? data : []).map((p: RawPago) => normalizePago(p))
      setPagos(normalizados)
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const cargarCreditosActivos = async () => {
    try {
      const data = await apiClient.get('/api/creditos?estado=ACTIVO')
      setCreditosActivos(Array.isArray(data) ? data : [])
    } catch (error: any) {
      showToast(error.message, 'error')
    }
  }

  const handleBuscarPorFecha = async () => {
    try {
      setLoading(true)
      const data = await apiClient.get(`/api/pagos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)
      const normalizados = (Array.isArray(data) ? data : []).map((p: RawPago) => normalizePago(p))
      setPagos(normalizados)
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredPagos = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return pagos.filter((p) => {
      const cliente = (p.credito?.cliente?.nombre || '').toLowerCase()
      const codigo = (p.credito?.cliente?.codigo_cliente || '').toLowerCase()
      const usuarioNombre = (p.usuario?.nombre || '').toLowerCase()
      return cliente.includes(term) || codigo.includes(term) || usuarioNombre.includes(term)
    })
  }, [pagos, searchTerm])

  const proximasCuotas = useMemo(() => {
    return creditosActivos
      .flatMap((c): ProximaCuotaProducto[] => {
        const detalles = c.credito_detalle || []
        if (detalles.length === 0) return []

        return detalles.map((d) => {
          const subtotal = Number(d.subtotal || 0)
          const cuotaProducto = c.numero_cuotas > 0 ? subtotal / c.numero_cuotas : 0
          const pagadoProducto = (c.pagos || []).reduce((sumPago, p) => {
            const pagadoDetalle = (p.pago_detalle_producto || [])
              .filter((dp) => dp.id_producto === d.id_producto)
              .reduce((sumDetalle, dp) => sumDetalle + Number(dp.monto_pagado || 0), 0)
            return sumPago + pagadoDetalle
          }, 0)
          const cuotasEq = cuotaProducto > 0 ? pagadoProducto / cuotaProducto : 0
          const cuotaSiguiente = Math.min(Math.floor(cuotasEq), Math.max(c.numero_cuotas - 1, 0))
          const fechaProxima = calcNextDate(c.fecha_inicio, c.frecuencia_pago, cuotaSiguiente)

          return {
            id_credito: c.id_credito,
            cliente: c.clientes?.nombre || 'Sin cliente',
            codigo_cliente: c.clientes?.codigo_cliente || '-',
            producto: d.productos?.nombre || `Producto ${d.id_producto}`,
            fecha_proxima: fechaProxima.toISOString(),
            cuota_producto: cuotaProducto,
            cuotas_equivalentes: cuotasEq,
            cuotas_totales: c.numero_cuotas,
            saldo_producto: Math.max(subtotal - pagadoProducto, 0),
            saldo_credito: Number(c.saldo_pendiente || 0)
          }
        })
      })
      .filter((c) => {
        const fecha = new Date(c.fecha_proxima)
        const inicio = new Date(`${fechaInicio}T00:00:00`)
        const fin = new Date(`${fechaFin}T23:59:59`)
        return fecha >= inicio && fecha <= fin
      })
      .sort((a, b) => new Date(a.fecha_proxima).getTime() - new Date(b.fecha_proxima).getTime())
  }, [creditosActivos, fechaInicio, fechaFin])

  const resumenDia = useMemo(() => {
    const hoy = new Date().toDateString()
    const pagosHoy = pagos.filter((p) => new Date(p.fecha_pago).toDateString() === hoy)
    const total = pagosHoy.reduce((sum, p) => sum + p.monto_pagado, 0)
    const porMetodo = pagosHoy.reduce((acc: Record<string, { cantidad: number; monto: number }>, p) => {
      const metodo = p.metodo_pago || 'OTRO'
      if (!acc[metodo]) {
        acc[metodo] = { cantidad: 0, monto: 0 }
      }
      acc[metodo].cantidad += 1
      acc[metodo].monto += p.monto_pagado
      return acc
    }, {})
    return {
      cantidad: pagosHoy.length,
      total,
      porMetodo
    }
  }, [pagos])

  const stats = useMemo(() => {
    const hoy = new Date().toDateString()
    const semana = new Date()
    semana.setDate(semana.getDate() - 7)
    const mes = new Date()
    mes.setMonth(mes.getMonth() - 1)

    const totalHoy = pagos
      .filter((p) => new Date(p.fecha_pago).toDateString() === hoy)
      .reduce((sum, p) => sum + p.monto_pagado, 0)

    const totalSemana = pagos
      .filter((p) => new Date(p.fecha_pago) >= semana)
      .reduce((sum, p) => sum + p.monto_pagado, 0)

    const totalMes = pagos
      .filter((p) => new Date(p.fecha_pago) >= mes)
      .reduce((sum, p) => sum + p.monto_pagado, 0)

    const promedioDiario = totalSemana / 7

    return {
      totalHoy,
      totalSemana,
      totalMes,
      promedioDiario
    }
  }, [pagos])

  const exportarPagosHoy = () => {
    try {
      const hoy = new Date().toDateString()
      const pagosHoy = pagos.filter((p) => new Date(p.fecha_pago).toDateString() === hoy)
      if (pagosHoy.length === 0) {
        showToast('No hay pagos hoy para exportar', 'info')
        return
      }

      const escapeCell = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`
      const rows: Array<Array<string | number>> = []
      rows.push(['REPORTE DE PAGOS DEL DIA'])
      rows.push(['Fecha', new Date().toLocaleDateString('es-GT')])
      rows.push([])
      rows.push(['ID Pago', 'ID Crédito', 'Cliente', 'Código', 'Monto', 'Método', 'Usuario', 'Fecha/Hora'])
      pagosHoy.forEach((p) => {
        rows.push([
          p.id_pago,
          p.credito.id_credito,
          p.credito.cliente.nombre,
          p.credito.cliente.codigo_cliente,
          p.monto_pagado.toFixed(2),
          p.metodo_pago,
          p.usuario.nombre,
          new Date(p.fecha_pago).toLocaleString('es-GT')
        ])
      })
      rows.push([])
      rows.push(['Total pagos', pagosHoy.length])
      rows.push(['Monto total', pagosHoy.reduce((s, p) => s + p.monto_pagado, 0).toFixed(2)])

      const csv = rows.map((r) => r.map(escapeCell).join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `pagos_hoy_${date}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('Reporte de pagos del día exportado', 'success')
    } catch (error: any) {
      showToast(error.message || 'No se pudo exportar', 'error')
    }
  }

  const statsCards = [
    {
      title: 'Pagos Hoy',
      value: formatCurrency(stats.totalHoy),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'blue' as const
    },
    {
      title: 'Esta Semana',
      value: formatCurrency(stats.totalSemana),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'green' as const
    },
    {
      title: 'Este Mes',
      value: formatCurrency(stats.totalMes),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
      ),
      color: 'purple' as const
    },
    {
      title: 'Promedio Diario',
      value: formatCurrency(stats.promedioDiario),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'orange' as const
    }
  ]

  const columns = [
    {
      key: 'cliente',
      header: 'Cliente',
      cell: (item: PagoUI) => (
        <div className="min-w-[220px]">
          <p className="font-medium">{item.credito.cliente.nombre}</p>
          <p className="text-xs text-gray-500">Código: {item.credito.cliente.codigo_cliente}</p>
        </div>
      )
    },
    {
      key: 'monto',
      header: 'Monto',
      cell: (item: PagoUI) => <span className="font-bold text-green-600">{formatCurrency(item.monto_pagado)}</span>
    },
    {
      key: 'fecha',
      header: 'Fecha',
      cell: (item: PagoUI) => <span>{new Date(item.fecha_pago).toLocaleString('es-GT')}</span>
    },
    {
      key: 'metodo',
      header: 'Método',
      cell: (item: PagoUI) => <Badge variant={item.metodo_pago === 'EFECTIVO' ? 'success' : 'info'}>{item.metodo_pago}</Badge>
    },
    {
      key: 'usuario',
      header: 'Registrado por',
      cell: (item: PagoUI) => (
        <div>
          <p className="font-medium">{item.usuario.nombre}</p>
          <p className="text-xs text-gray-500">@{item.usuario.username}</p>
        </div>
      )
    },
    {
      key: 'detalle',
      header: 'Detalle Productos',
      cell: (item: PagoUI) => {
        if (!item.detalle_productos.length) return <span className="text-xs text-gray-500">Pago general crédito</span>
        return (
          <div className="min-w-[200px]">
            {item.detalle_productos.slice(0, 2).map((d, idx) => (
              <p key={`${item.id_pago}-${d.id_producto}-${idx}`} className="text-xs">
                {d.nombre}: {formatCurrency(d.monto_pagado)}
              </p>
            ))}
            {item.detalle_productos.length > 2 && (
              <p className="text-xs text-gray-500">+{item.detalle_productos.length - 2} productos</p>
            )}
          </div>
        )
      }
    }
  ]

  const columnsCuotas = [
    {
      key: 'cliente',
      header: 'Cliente',
      cell: (item: ProximaCuotaProducto) => (
        <div className="min-w-[220px]">
          <p className="font-medium">{item.cliente}</p>
          <p className="text-xs text-gray-500">{item.codigo_cliente}</p>
        </div>
      )
    },
    {
      key: 'fecha_proxima',
      header: 'Próxima Cuota',
      cell: (item: ProximaCuotaProducto) => <span>{new Date(item.fecha_proxima).toLocaleDateString('es-GT')}</span>
    },
    {
      key: 'producto',
      header: 'Producto',
      cell: (item: ProximaCuotaProducto) => <span>{item.producto}</span>
    },
    {
      key: 'cuota_producto',
      header: 'Cuota Producto',
      cell: (item: ProximaCuotaProducto) => <span>{formatCurrency(item.cuota_producto)}</span>
    },
    {
      key: 'progreso',
      header: 'Cuota Equivalente',
      cell: (item: ProximaCuotaProducto) => (
        <span>{item.cuotas_equivalentes.toFixed(2)} / {item.cuotas_totales}</span>
      )
    },
    {
      key: 'saldo_producto',
      header: 'Saldo Producto',
      cell: (item: ProximaCuotaProducto) => <span className="font-medium text-blue-600">{formatCurrency(item.saldo_producto)}</span>
    },
    {
      key: 'saldo_credito',
      header: 'Saldo Crédito',
      cell: (item: ProximaCuotaProducto) => <span className="text-xs">{formatCurrency(item.saldo_credito)}</span>
    }
  ]

  return (
    <LayoutContainer>
      <div className="space-y-6">
        {!canUsePagosModule && (
          <Card>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No tienes permisos para usar el módulo de pagos.
            </p>
          </Card>
        )}

        {canUsePagosModule && (
          <>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Pagos</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Registro operativo y control de cuotas por fecha
            </p>
          </div>
          <Button onClick={() => setModalAbierto(true)}>Registrar Pago</Button>
        </div>

        <StatsCards stats={statsCards} />

        <Card>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtro de Fecha</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input type="date" label="Desde" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              <Input type="date" label="Hasta" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
              <div className="flex items-end gap-2">
                <Button onClick={handleBuscarPorFecha}>Buscar</Button>
                <Button variant="secondary" onClick={cargarPagos}>Limpiar</Button>
              </div>
              <div className="flex items-end">
                <Button variant="secondary" onClick={exportarPagosHoy}>Exportar Informe del Día</Button>
              </div>
            </div>
          </div>
        </Card>

        {canSeeSupervisorView && (
          <Card>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Vista Supervisor/Admin: Cuotas próximas por producto
            </h3>
            <Table data={proximasCuotas} columns={columnsCuotas} loading={false} emptyMessage="Sin cuotas en el rango de fechas seleccionado" />
          </Card>
        )}

        {canSeeSupervisorView && (
          <Card>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Informe Diario de Pagos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                <p className="text-xs text-gray-500">Cantidad pagos hoy</p>
                <p className="text-lg font-semibold">{resumenDia.cantidad}</p>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                <p className="text-xs text-gray-500">Monto total hoy</p>
                <p className="text-lg font-semibold">{formatCurrency(resumenDia.total)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                <p className="text-xs text-gray-500">Métodos usados</p>
                <p className="text-lg font-semibold">{Object.keys(resumenDia.porMetodo).length}</p>
              </div>
            </div>
            <div className="space-y-1">
              {Object.entries(resumenDia.porMetodo).map(([metodo, info]) => (
                <p key={metodo} className="text-sm text-gray-700 dark:text-gray-300">
                  {metodo}: {info.cantidad} pagos ({formatCurrency(info.monto)})
                </p>
              ))}
              {Object.keys(resumenDia.porMetodo).length === 0 && (
                <p className="text-sm text-gray-500">Aún no hay pagos registrados hoy.</p>
              )}
            </div>
          </Card>
        )}

        <Card>
          <div className="space-y-4">
            <Input
              placeholder="Buscar por cliente, código o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Table data={filteredPagos} columns={columns} loading={loading} />
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Total pagos filtrados: <b>{filteredPagos.length}</b>
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Monto total filtrado: <b>{formatCurrency(filteredPagos.reduce((s, p) => s + p.monto_pagado, 0))}</b>
              </p>
            </div>
          </div>
        </Card>

        <Modal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          title="Registrar Pago"
          size="lg"
        >
          <PagoForm
            onSuccess={() => {
              setModalAbierto(false)
              cargarPagos()
              if (canSeeSupervisorView) {
                cargarCreditosActivos()
              }
            }}
            onCancel={() => setModalAbierto(false)}
          />
        </Modal>
          </>
        )}
      </div>
    </LayoutContainer>
  )
}
