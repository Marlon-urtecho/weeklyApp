'use client'

import React from 'react'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import type { Credito } from '@/types/credito'

interface CreditosTableProps {
  data: Credito[]
  loading?: boolean
  onView?: (credito: Credito) => void
  onRegistrarPago?: (credito: Credito) => void
}

export const CreditosTable: React.FC<CreditosTableProps> = ({
  data,
  loading,
  onView,
  onRegistrarPago
}) => {
  const getEstadoBadge = (estado: string) => {
    const variants = {
      ACTIVO: 'success',
      MOROSO: 'error',
      PAGADO: 'info',
      CANCELADO: 'warning'
    }
    return variants[estado as keyof typeof variants] || 'default'
  }

  const columns = [
    {
      key: 'cliente',
      header: 'Cliente',
      cell: (item: Credito) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{item.clientes?.nombre || '-'}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Código: {item.clientes?.codigo_cliente || '-'}</p>
        </div>
      )
    },
    {
      key: 'vendedor',
      header: 'Vendedor',
      cell: (item: Credito) => (
        <span>{item.vendedores?.nombre || '-'}</span>
      )
    },
    {
      key: 'monto',
      header: 'Monto',
      cell: (item: Credito) => (
        <div>
          <p className="font-medium">{formatCurrency(Number(item.monto_total || 0))}</p>
          <p className="text-sm text-gray-500">Pendiente: {formatCurrency(Number(item.saldo_pendiente || 0))}</p>
        </div>
      )
    },
    {
      key: 'cuota',
      header: 'Cuota',
      cell: (item: Credito) => (
        <div>
          <p className="font-medium">{formatCurrency(Number(item.cuota || 0))}</p>
          <p className="text-sm text-gray-500">{item.frecuencia_pago}</p>
        </div>
      )
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (item: Credito) => (
        <Badge variant={getEstadoBadge(item.estado) as any}>
          {item.estado}
        </Badge>
      )
    },
    {
      key: 'fecha',
      header: 'Fecha Inicio',
      cell: (item: Credito) => (
        <span>{item.fecha_inicio ? new Date(item.fecha_inicio).toLocaleDateString() : '-'}</span>
      )
    },
    {
      key: 'acciones',
      header: 'Acciones',
      cell: (item: Credito) => (
        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="secondary" size="sm" onClick={() => onView?.(item)}>
            Ver
          </Button>
          {item.estado !== 'PAGADO' && item.estado !== 'CANCELADO' && (
            <Button variant="primary" size="sm" onClick={() => onRegistrarPago?.(item)}>
              Registrar Pago
            </Button>
          )}
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
