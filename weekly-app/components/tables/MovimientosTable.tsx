'use client'

import React from 'react'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDateTime, formatCurrency } from '@/lib/utils'

interface Movimiento {
  id_movimiento: number
  fecha_movimiento: string
  tipo_movimiento: {
    nombre_tipo: string
    factor: number
  }
  producto: {
    nombre: string
    categoria: string
  }
  cantidad: number
  origen: string
  destino: string
  observacion?: string
  usuario: {
    nombre: string
    username: string
  }
}

interface MovimientosTableProps {
  data: Movimiento[]
  loading?: boolean
  onView?: (movimiento: Movimiento) => void
}

export const MovimientosTable: React.FC<MovimientosTableProps> = ({
  data,
  loading,
  onView
}) => {
  const getTipoBadge = (factor: number) => {
    return factor === 1 ? 'success' : 'danger'
  }

  const getTipoTexto = (factor: number) => {
    return factor === 1 ? 'Entrada' : 'Salida'
  }

  const columns = [
    {
      key: 'fecha',
      header: 'Fecha/Hora',
      cell: (item: Movimiento) => (
        <div className="min-w-[150px]">
          <p className="text-sm font-medium">{formatDateTime(item.fecha_movimiento)}</p>
        </div>
      )
    },
    {
      key: 'tipo',
      header: 'Tipo',
      cell: (item: Movimiento) => (
        <Badge variant={getTipoBadge(item.tipo_movimiento.factor) as any}>
          {getTipoTexto(item.tipo_movimiento.factor)}
        </Badge>
      )
    },
    {
      key: 'producto',
      header: 'Producto',
      cell: (item: Movimiento) => (
        <div className="min-w-[200px]">
          <p className="font-medium text-gray-900 dark:text-white">{item.producto.nombre}</p>
          <Badge variant="secondary" size="sm">{item.producto.categoria}</Badge>
        </div>
      )
    },
    {
      key: 'cantidad',
      header: 'Cantidad',
      cell: (item: Movimiento) => (
        <p className={`font-bold ${
          item.tipo_movimiento.factor === 1 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        }`}>
          {item.tipo_movimiento.factor === 1 ? '+' : '-'}{item.cantidad}
        </p>
      )
    },
    {
      key: 'origen_destino',
      header: 'Origen/Destino',
      cell: (item: Movimiento) => (
        <div className="min-w-[150px]">
          <p className="text-sm">Origen: <span className="font-medium">{item.origen}</span></p>
          <p className="text-sm">Destino: <span className="font-medium">{item.destino}</span></p>
        </div>
      )
    },
    {
      key: 'registrado_por',
      header: 'Registrado por',
      cell: (item: Movimiento) => (
        <div>
          <p className="text-sm font-medium">{item.usuario.nombre}</p>
          <p className="text-xs text-gray-500">@{item.usuario.username}</p>
        </div>
      )
    },
    {
      key: 'acciones',
      header: 'Acciones',
      cell: (item: Movimiento) => (
        <Button variant="outline" size="sm" onClick={() => onView?.(item)}>
          Ver Detalle
        </Button>
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