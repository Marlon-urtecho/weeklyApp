'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'
import { formatCurrency } from '@/lib/utils'

interface PagoFormProps {
  creditoId?: number
  onSuccess?: () => void
  onCancel?: () => void
}

interface CreditoActivoItem {
  id_credito: number
  cuota?: number | string
  estado?: string
  vendedores?: {
    id_vendedor?: number
    nombre?: string
  }
  saldo_pendiente: number | string
  clientes?: {
    id_cliente?: number
    nombre?: string
    codigo_cliente?: string
  }
  credito_detalle?: Array<{
    id_producto: number
    subtotal: number | string
    productos?: {
      nombre?: string
    }
  }>
  pagos?: Array<{
    pago_detalle_producto?: Array<{
      id_producto: number
      monto_pagado: number | string
    }>
  }>
}

export const PagoForm: React.FC<PagoFormProps> = ({
  creditoId,
  onSuccess,
  onCancel
}) => {
  const creditoFijo = typeof creditoId === 'number' && creditoId > 0
  const [loading, setLoading] = useState(false)
  const [cargandoCreditos, setCargandoCreditos] = useState(true)
  const [creditosRaw, setCreditosRaw] = useState<CreditoActivoItem[]>([])
  const [vendedorSeleccionadoId, setVendedorSeleccionadoId] = useState<string>('')
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string>('')
  const [vendedorQuery, setVendedorQuery] = useState('')
  const [showVendedorResults, setShowVendedorResults] = useState(false)
  const [clienteQuery, setClienteQuery] = useState('')
  const [showClienteResults, setShowClienteResults] = useState(false)
  const [creditoQuery, setCreditoQuery] = useState('')
  const [showCreditoResults, setShowCreditoResults] = useState(false)
  const [creditoSeleccionado, setCreditoSeleccionado] = useState<CreditoActivoItem | null>(null)
  const [detalleProducto, setDetalleProducto] = useState<Record<number, string>>({})
  const [productoSearch, setProductoSearch] = useState('')
  const [formData, setFormData] = useState({
    id_credito: creditoId?.toString() || '',
    monto_pagado: '',
    metodo_pago: 'EFECTIVO',
    observacion: ''
  })
  const { showToast } = useToast()
  const vendedorDropdownRef = useRef<HTMLDivElement | null>(null)
  const clienteDropdownRef = useRef<HTMLDivElement | null>(null)
  const creditoDropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (creditoFijo && creditoId) {
      cargarCreditoFijo(creditoId)
    } else {
      cargarCreditos()
    }
  }, [creditoFijo, creditoId])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (vendedorDropdownRef.current && !vendedorDropdownRef.current.contains(target)) {
        setShowVendedorResults(false)
      }
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(target)) {
        setShowClienteResults(false)
      }
      if (creditoDropdownRef.current && !creditoDropdownRef.current.contains(target)) {
        setShowCreditoResults(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (formData.id_credito) {
      const credito = creditosRaw.find(c => c.id_credito === parseInt(formData.id_credito))
      setCreditoSeleccionado(credito || null)
      setDetalleProducto({})
      setProductoSearch('')
    } else {
      setCreditoSeleccionado(null)
      setDetalleProducto({})
      setProductoSearch('')
    }
  }, [formData.id_credito, creditosRaw])

  useEffect(() => {
    if (creditoFijo) return
    setFormData((prev) => ({ ...prev, id_credito: '' }))
    setCreditoSeleccionado(null)
    setCreditoQuery('')
  }, [vendedorSeleccionadoId, clienteSeleccionadoId, creditoFijo])

  const cargarCreditos = async () => {
    try {
      const data = await apiClient.get('/api/creditos?estado=ACTIVO')
      const rows = Array.isArray(data) ? data : []
      setCreditosRaw(rows)
    } catch (error: any) {
      showToast('Error al cargar créditos', 'error')
    } finally {
      setCargandoCreditos(false)
    }
  }

  const cargarCreditoFijo = async (id: number) => {
    try {
      setCargandoCreditos(true)
      const credito = await apiClient.get(`/api/creditos/${id}`)
      if (!credito) {
        showToast('Crédito no encontrado', 'error')
        return
      }

      const row: CreditoActivoItem = credito
      setCreditosRaw([row])
      setFormData((prev) => ({ ...prev, id_credito: String(row.id_credito) }))
      setCreditoSeleccionado(row)
    } catch (error: any) {
      showToast(error.message || 'Error al cargar crédito', 'error')
    } finally {
      setCargandoCreditos(false)
    }
  }

  const vendedoresDisponibles = useMemo(() => {
    const map = new Map<number, { id_vendedor: number; nombre: string }>()
    for (const c of creditosRaw) {
      const id = Number(c.vendedores?.id_vendedor || 0)
      const nombre = c.vendedores?.nombre || `Vendedor ${id}`
      if (id > 0 && !map.has(id)) map.set(id, { id_vendedor: id, nombre })
    }
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [creditosRaw])

  const vendedoresFiltrados = useMemo(() => {
    const term = vendedorQuery.trim().toLowerCase()
    if (!term) return vendedoresDisponibles.slice(0, 20)
    return vendedoresDisponibles.filter((v) => v.nombre.toLowerCase().includes(term)).slice(0, 30)
  }, [vendedorQuery, vendedoresDisponibles])

  const clientesDisponibles = useMemo(() => {
    const selectedVendor = Number(vendedorSeleccionadoId || 0)
    const rows = selectedVendor
      ? creditosRaw.filter((c) => Number(c.vendedores?.id_vendedor || 0) === selectedVendor)
      : creditosRaw
    const map = new Map<number, { id_cliente: number; nombre: string; codigo_cliente: string }>()
    for (const c of rows) {
      const id = Number(c.clientes?.id_cliente || 0)
      if (!id) continue
      if (!map.has(id)) {
        map.set(id, {
          id_cliente: id,
          nombre: c.clientes?.nombre || `Cliente ${id}`,
          codigo_cliente: c.clientes?.codigo_cliente || '-'
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [creditosRaw, vendedorSeleccionadoId])

  const clientesFiltrados = useMemo(() => {
    const term = clienteQuery.trim().toLowerCase()
    if (!term) return clientesDisponibles.slice(0, 20)
    return clientesDisponibles
      .filter((c) => c.nombre.toLowerCase().includes(term) || c.codigo_cliente.toLowerCase().includes(term))
      .slice(0, 30)
  }, [clienteQuery, clientesDisponibles])

  const creditosFiltrados = useMemo(() => {
    const selectedVendor = Number(vendedorSeleccionadoId || 0)
    const selectedCliente = Number(clienteSeleccionadoId || 0)
    const term = creditoQuery.trim().toLowerCase()
    return creditosRaw.filter((c) => {
      if (selectedVendor && Number(c.vendedores?.id_vendedor || 0) !== selectedVendor) return false
      if (selectedCliente && Number(c.clientes?.id_cliente || 0) !== selectedCliente) return false
      if (!term) return true
      const cliente = (c.clientes?.nombre || '').toLowerCase()
      const codigo = (c.clientes?.codigo_cliente || '').toLowerCase()
      return (
        String(c.id_credito).includes(term) ||
        cliente.includes(term) ||
        codigo.includes(term)
      )
    })
  }, [creditosRaw, vendedorSeleccionadoId, clienteSeleccionadoId, creditoQuery])

  const seleccionarVendedor = (id: number, nombre: string) => {
    setVendedorSeleccionadoId(String(id))
    setVendedorQuery(nombre)
    setShowVendedorResults(false)
    setClienteSeleccionadoId('')
    setClienteQuery('')
  }

  const seleccionarCliente = (id: number, nombre: string, codigo: string) => {
    setClienteSeleccionadoId(String(id))
    setClienteQuery(`${nombre} (${codigo})`)
    setShowClienteResults(false)
  }

  const seleccionarCredito = (credito: CreditoActivoItem) => {
    setFormData((prev) => ({ ...prev, id_credito: String(credito.id_credito) }))
    setCreditoQuery(`Crédito #${credito.id_credito} - ${credito.clientes?.nombre || 'Sin cliente'}`)
    setShowCreditoResults(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const monto = parseFloat(formData.monto_pagado)
      if (Number.isNaN(monto) || monto <= 0) {
        showToast('Ingresa un monto válido', 'error')
        setLoading(false)
        return
      }

      if (!formData.id_credito) {
        showToast('Selecciona un crédito', 'error')
        setLoading(false)
        return
      }
      const detalle = Object.entries(detalleProducto)
        .map(([id_producto, monto_pagado]) => ({
          id_producto: Number(id_producto),
          monto_pagado: Number(monto_pagado || 0)
        }))
        .filter((d) => d.monto_pagado > 0)

      const sumaDetalle = detalle.reduce((s, d) => s + d.monto_pagado, 0)
      if (detalle.length > 0 && Math.abs(sumaDetalle - monto) > 0.01) {
        showToast('La suma por producto debe ser igual al monto total', 'error')
        setLoading(false)
        return
      }
      
      if (creditoSeleccionado && monto > Number(creditoSeleccionado.saldo_pendiente || 0)) {
        showToast('El monto no puede ser mayor al saldo pendiente', 'error')
        setLoading(false)
        return
      }

      await apiClient.post('/api/pagos', {
        id_credito: parseInt(formData.id_credito),
        monto_pagado: monto,
        metodo_pago: formData.metodo_pago,
        detalle_productos: detalle.length > 0 ? detalle : undefined
      })
      
      showToast('Pago registrado correctamente', 'success')
      onSuccess?.()
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const getSaldoPendienteProducto = (idProducto: number, subtotal: number | string) => {
    const pagoPrevio = (creditoSeleccionado?.pagos || []).reduce((sum, p) => {
      const sumDetalle = (p.pago_detalle_producto || [])
        .filter((d) => d.id_producto === idProducto)
        .reduce((s, d) => s + Number(d.monto_pagado || 0), 0)
      return sum + sumDetalle
    }, 0)
    return Math.max(Number(subtotal || 0) - pagoPrevio, 0)
  }

  const distribuirMontoPorProductos = () => {
    if (!creditoSeleccionado || !formData.monto_pagado) return
    const montoTotal = Number(formData.monto_pagado || 0)
    const detalles = creditoSeleccionado.credito_detalle || []
    const pendientes = detalles.map((d) => ({
      id_producto: d.id_producto,
      pendiente: getSaldoPendienteProducto(d.id_producto, d.subtotal)
    }))
    const totalPendiente = pendientes.reduce((s, p) => s + p.pendiente, 0)
    if (totalPendiente <= 0 || montoTotal <= 0) return

    let acumulado = 0
    const nuevoDetalle: Record<number, string> = {}
    pendientes.forEach((p, idx) => {
      const monto = idx === pendientes.length - 1
        ? Math.max(montoTotal - acumulado, 0)
        : Number(((montoTotal * p.pendiente) / totalPendiente).toFixed(2))
      acumulado += monto
      nuevoDetalle[p.id_producto] = monto > 0 ? monto.toFixed(2) : ''
    })
    setDetalleProducto(nuevoDetalle)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!creditoFijo && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative" ref={vendedorDropdownRef}>
              <Input
                label="Vendedor"
                value={vendedorQuery}
                onChange={(e) => {
                  setVendedorQuery(e.target.value)
                  setShowVendedorResults(true)
                  if (!e.target.value.trim()) {
                    setVendedorSeleccionadoId('')
                  }
                }}
                onFocus={() => setShowVendedorResults(true)}
                placeholder="Buscar vendedor"
                required
              />
              {showVendedorResults && (
                <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
                  {vendedoresFiltrados.map((v) => (
                    <button
                      key={v.id_vendedor}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => seleccionarVendedor(v.id_vendedor, v.nombre)}
                    >
                      {v.nombre}
                    </button>
                  ))}
                  {vendedoresFiltrados.length === 0 && (
                    <p className="px-3 py-2 text-sm text-gray-500">No se encontraron vendedores</p>
                  )}
                </div>
              )}
            </div>

            <div className="relative" ref={clienteDropdownRef}>
              <Input
                label="Cliente"
                value={clienteQuery}
                onChange={(e) => {
                  setClienteQuery(e.target.value)
                  setShowClienteResults(true)
                  if (!e.target.value.trim()) {
                    setClienteSeleccionadoId('')
                  }
                }}
                onFocus={() => setShowClienteResults(true)}
                placeholder="Buscar cliente por nombre o código"
                required
              />
              {showClienteResults && (
                <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
                  {clientesFiltrados.map((c) => (
                    <button
                      key={c.id_cliente}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => seleccionarCliente(c.id_cliente, c.nombre, c.codigo_cliente)}
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
          </div>

          <div className="relative" ref={creditoDropdownRef}>
            <Input
              label="Crédito"
              value={creditoQuery}
              onChange={(e) => {
                setCreditoQuery(e.target.value)
                setShowCreditoResults(true)
                if (!e.target.value.trim()) {
                  setFormData((prev) => ({ ...prev, id_credito: '' }))
                }
              }}
              onFocus={() => setShowCreditoResults(true)}
              placeholder={cargandoCreditos ? 'Cargando créditos...' : 'Buscar crédito'}
              required
            />
            {showCreditoResults && (
              <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
                {creditosFiltrados.map((c) => (
                  <button
                    key={c.id_credito}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => seleccionarCredito(c)}
                  >
                    Crédito #{c.id_credito} - {c.clientes?.nombre || 'Sin cliente'} ({c.clientes?.codigo_cliente || '-'})
                    {' - '}Saldo {formatCurrency(Number(c.saldo_pendiente || 0))}
                  </button>
                ))}
                {creditosFiltrados.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-500">No hay créditos con ese filtro</p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {creditoSeleccionado && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Vendedor: <span className="font-semibold">{creditoSeleccionado.vendedores?.nombre || '-'}</span>
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Cliente: <span className="font-semibold">{creditoSeleccionado.clientes?.nombre || '-'}</span>
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Cuota sugerida: <span className="font-bold">{formatCurrency(Number(creditoSeleccionado.cuota || 0))}</span>
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Saldo pendiente: <span className="font-bold">{formatCurrency(Number(creditoSeleccionado.saldo_pendiente || 0))}</span>
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Puedes abonar cualquier monto mayor a 0. El crédito se cierra al pagar el saldo total.
          </p>
        </div>
      )}

      <Input
        label="Monto a pagar"
        type="number"
        step="0.01"
        min="0.01"
        value={formData.monto_pagado}
        onChange={(e) => setFormData({ ...formData, monto_pagado: e.target.value })}
        placeholder="0.00"
        required
      />

      {creditoSeleccionado && (creditoSeleccionado.credito_detalle || []).length > 0 && (
        <div className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Pago por producto (opcional)
            </h4>
            <Button type="button" variant="secondary" onClick={distribuirMontoPorProductos}>
              Distribuir monto
            </Button>
          </div>
          <Input
            placeholder="Buscar producto del crédito..."
            value={productoSearch}
            onChange={(e) => setProductoSearch(e.target.value)}
          />
          <div className="space-y-2">
            {(creditoSeleccionado.credito_detalle || [])
              .filter((d) => {
                const term = productoSearch.trim().toLowerCase()
                if (!term) return true
                const nombre = (d.productos?.nombre || '').toLowerCase()
                return nombre.includes(term) || String(d.id_producto).includes(term)
              })
              .map((d) => {
              const pendiente = getSaldoPendienteProducto(d.id_producto, d.subtotal)
              return (
                <div key={d.id_producto} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                  <div>
                    <p className="text-sm font-medium">{d.productos?.nombre || `Producto ${d.id_producto}`}</p>
                    <p className="text-xs text-gray-500">Pendiente: {formatCurrency(pendiente)}</p>
                  </div>
                  <Input
                    label="Monto producto"
                    type="number"
                    step="0.01"
                    min="0"
                    max={pendiente}
                    value={detalleProducto[d.id_producto] || ''}
                    onChange={(e) => setDetalleProducto((prev) => ({ ...prev, [d.id_producto]: e.target.value }))}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 md:text-right">
                    Subtotal crédito: {formatCurrency(Number(d.subtotal || 0))}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Método de Pago
        </label>
        <select
          value={formData.metodo_pago}
          onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="EFECTIVO">Efectivo</option>
          <option value="TRANSFERENCIA">Transferencia</option>
          <option value="TARJETA">Tarjeta</option>
          <option value="CHEQUE">Cheque</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Observaciones
        </label>
        <textarea
          value={formData.observacion}
          onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Notas adicionales..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={loading}>
          Registrar Pago
        </Button>
      </div>
    </form>
  )
}
