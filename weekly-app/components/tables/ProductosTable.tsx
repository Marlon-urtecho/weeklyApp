'use client'

import React from 'react'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface Pago {
  id_pago: number
  monto_pagado: number
  fecha_pago: string
  metodo_pago: string
  credito: {
    id_credito: number
    cliente: {
      id_cliente: number
      nombre: string
      codigo_cliente: string
    }
    monto_total: number
    saldo_pendiente: number
  }
  usuario: {
    id_usuario: number
    nombre: string
    username: string
  }
}

interface PagosTableProps {
  data: Pago[]
  loading?: boolean
  onView?: (pago: Pago) => void
  onPrint?: (pago: Pago) => void
}

export const PagosTable: React.FC<PagosTableProps> = ({
  data,
  loading,
  onView,
  onPrint
}) => {
  const getMetodoBadge = (metodo: string) => {
    const metodos: Record<string, string> = {
      'EFECTIVO': 'success',
      'TRANSFERENCIA': 'info',
      'TARJETA': 'warning',
      'CHEQUE': 'secondary'
    }
    return metodos[metodo] || 'default'
  }

  const columns = [
    {
      key: 'cliente',
      header: 'Cliente',
      cell: (item: Pago) => (
        <div className="min-w-[200px]">
          <p className="font-medium text-gray-900 dark:text-white">
            {item.credito.cliente.nombre}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Código: {item.credito.cliente.codigo_cliente}
          </p>
        </div>
      )
    },
    {
      key: 'monto',
      header: 'Monto',
      cell: (item: Pago) => (
        <div className="min-w-[120px]">
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatCurrency(item.monto_pagado)}
          </p>
        </div>
      )
    },
    {
      key: 'fecha',
      header: 'Fecha/Hora',
      cell: (item: Pago) => (
        <div className="min-w-[150px]">
          <p className="text-sm font-medium">
            {new Date(item.fecha_pago).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(item.fecha_pago).toLocaleTimeString()}
          </p>
        </div>
      )
    },
    {
      key: 'metodo',
      header: 'Método',
      cell: (item: Pago) => (
        <Badge variant={getMetodoBadge(item.metodo_pago) as any}>
          {item.metodo_pago}
        </Badge>
      )
    },
    {
      key: 'credito',
      header: 'Crédito',
      cell: (item: Pago) => (
        <div>
          <p className="text-sm">Total: {formatCurrency(item.credito.monto_total)}</p>
          <p className="text-xs text-gray-500">
            Saldo: {formatCurrency(item.credito.saldo_pendiente)}
          </p>
        </div>
      )
    },
    {
      key: 'registrado_por',
      header: 'Registrado por',
      cell: (item: Pago) => (
        <div>
          <p className="text-sm font-medium">{item.usuario.nombre}</p>
          <p className="text-xs text-gray-500">@{item.usuario.username}</p>
        </div>
      )
    },
    {
      key: 'acciones',
      header: 'Acciones',
      cell: (item: Pago) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => onView?.(item)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onPrint?.(item)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
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