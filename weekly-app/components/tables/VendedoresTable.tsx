'use client'

import React from 'react'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import type { Vendedor } from '@/types/vendedor'

interface VendedoresTableProps {
  data: Vendedor[]
  loading?: boolean
  onView?: (vendedor: Vendedor) => void
  onEdit?: (vendedor: Vendedor) => void
  onToggleStatus?: (vendedor: Vendedor) => void | Promise<void>
  onViewRutas?: (vendedor: Vendedor) => void
  onViewInventario?: (vendedor: Vendedor) => void
  onViewCreditos?: (vendedor: Vendedor) => void
  onAsignarRuta?: (vendedor: Vendedor) => void
}

export const VendedoresTable: React.FC<VendedoresTableProps> = ({
  data,
  loading,
  onView,
  onEdit,
  onToggleStatus,
  onViewRutas,
  onViewInventario,
  onViewCreditos,
  onAsignarRuta
}) => {
  const columns = [
    {
      key: 'vendedor',
      header: 'Vendedor',
      cell: (item: Vendedor) => (
        <div className="min-w-[200px]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
              {item.nombre.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{item.nombre}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" size="sm">
                  ID: {item.id_vendedor}
                </Badge>
                {item.usuario && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    @{item.usuario.username}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'contacto',
      header: 'Contacto',
      cell: (item: Vendedor) => (
        <div className="min-w-[150px]">
          <p className="text-sm flex items-center gap-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {item.telefono}
          </p>
          {item.usuario?.email && (
            <p className="text-sm flex items-center gap-1 mt-1">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {item.usuario.email}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'rutas',
      header: 'Rutas Asignadas',
      cell: (item: Vendedor) => (
        <div className="min-w-[200px]">
          {item.rutas && item.rutas.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-1 mb-2">
                {item.rutas.slice(0, 3).map((ruta, idx) => (
                  <Badge key={ruta.id_ruta} variant="info" size="sm">
                    {ruta.codigo_ruta}
                  </Badge>
                ))}
                {item.rutas.length > 3 && (
                  <Badge variant="secondary" size="sm">
                    +{item.rutas.length - 3}
                  </Badge>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewRutas?.(item)
                }}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Ver detalle de rutas →
              </button>
            </>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Sin rutas asignadas
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onAsignarRuta?.(item)
                }}
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Asignar Ruta
              </Button>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'inventario',
      header: 'Inventario',
      cell: (item: Vendedor) => {
        const totalProductos = item.inventario?.length || 0
        const valorTotal = item.estadisticas?.valor_inventario || 
          item.inventario?.reduce((sum, inv) => 
            sum + (inv.cantidad * Number(inv.producto.precio_credito)), 0
          ) || 0
        
        return (
          <div className="min-w-[150px]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Productos:</span>
              <Badge variant={totalProductos > 0 ? 'success' : 'secondary'}>
                {totalProductos}
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Valor:</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {formatCurrency(valorTotal)}
              </span>
            </div>
            {totalProductos > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewInventario?.(item)
                }}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-2"
              >
                Ver inventario →
              </button>
            )}
          </div>
        )
      }
    },
    {
      key: 'creditos',
      header: 'Créditos',
      cell: (item: Vendedor) => {
        const activos = item.creditos?.filter(c => c.estado === 'ACTIVO').length || 0
        const total = item.creditos?.length || 0
        const montoPendiente = item.creditos?.reduce(
          (sum, c) => sum + (c.estado === 'ACTIVO' ? Number(c.saldo_pendiente) : 0), 0
        ) || 0
        
        return (
          <div className="min-w-[180px]">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Activos</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{activos}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{total}</p>
              </div>
            </div>
            {montoPendiente > 0 && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Pendiente: {formatCurrency(montoPendiente)}
              </p>
            )}
            {activos > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewCreditos?.(item)
                }}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-2"
              >
                Ver créditos →
              </button>
            )}
          </div>
        )
      }
    },
    {
      key: 'estadisticas',
      header: 'Rendimiento',
      cell: (item: Vendedor) => {
        const stats = item.estadisticas || {
          total_clientes: item.rutas?.reduce((acc, r) => acc + (r.clientes_count || 0), 0) || 0,
          creditos_cobrados: item.creditos?.filter(c => c.estado === 'PAGADO').length || 0
        }
        const creditosCobrados = stats.creditos_cobrados ?? 0
        
        return (
          <div className="min-w-[150px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Clientes:</span>
              <span className="text-sm font-medium">{stats.total_clientes}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Cobrados:</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {creditosCobrados}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Eficiencia:</span>
                <Badge variant="success" size="sm">
                {item.creditos && item.creditos.length > 0
                  ? Math.round((creditosCobrados / item.creditos.length) * 100)
                  : 0}%
                </Badge>
              </div>
          </div>
        )
      }
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (item: Vendedor) => (
        <div className="min-w-[100px]">
          <Badge variant={item.activo ? 'success' : 'error'}>
            {item.activo ? 'Activo' : 'Inactivo'}
          </Badge>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Desde: {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
          </p>
        </div>
      )
    },
    {
      key: 'acciones',
      header: 'Acciones',
      cell: (item: Vendedor) => (
        <div className="flex flex-wrap gap-2 min-w-[250px]">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onView?.(item)
            }}
            title="Ver detalle"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(item)
            }}
            title="Editar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onViewRutas?.(item)
            }}
            title="Ver rutas"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onViewInventario?.(item)
            }}
            title="Ver inventario"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onViewCreditos?.(item)
            }}
            title="Ver créditos"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Button>

          <Button
            variant={item.activo ? 'danger' : 'success'}
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onToggleStatus?.(item)
            }}
            title={item.activo ? 'Desactivar' : 'Activar'}
          >
            {item.activo ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </Button>
        </div>
      )
    }
  ]

  return (
    <Table
      data={data}
      columns={columns}
      loading={loading}
      onRowClick={onView}
    />
  )
}
