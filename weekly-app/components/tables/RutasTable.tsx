'use client'

import React from 'react'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Ruta } from '@/types/ruta'

interface RutasTableProps {
  data: Ruta[]
  loading?: boolean
  onEdit?: (ruta: Ruta) => void
  onToggleStatus?: (ruta: Ruta) => void | Promise<void>
  onViewVendedores?: (ruta: Ruta) => void
  onViewClientes?: (ruta: Ruta) => void
  onAsignarVendedor?: (ruta: Ruta) => void
}

export const RutasTable: React.FC<RutasTableProps> = ({
  data,
  loading,
  onEdit,
  onToggleStatus,
  onViewVendedores,
  onViewClientes,
  onAsignarVendedor
}) => {
  const columns = [
    {
      key: 'codigo',
      header: 'Código',
      cell: (item: Ruta) => (
        <Badge variant="info">{item.codigo_ruta}</Badge>
      )
    },
    {
      key: 'nombre',
      header: 'Ruta',
      cell: (item: Ruta) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{item.nombre_ruta}</p>
          {item.zona && (
            <p className="text-xs text-gray-500 dark:text-gray-400">Zona: {item.zona}</p>
          )}
        </div>
      )
    },
    {
      key: 'vendedores',
      header: 'Vendedores Asignados',
      cell: (item: Ruta) => (
        <div className="flex flex-wrap gap-1">
          {item.vendedores && item.vendedores.length > 0 ? (
            item.vendedores.map((v, idx) => (
              <Badge key={idx} variant="secondary" size="sm">
                {v.nombre}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">Sin vendedores</span>
          )}
        </div>
      )
    },
    {
      key: 'clientes',
      header: 'Clientes',
      cell: (item: Ruta) => {
        const activos = item.clientes?.filter(c => c.activo).length || 0
        const total = item.clientes?.length || 0
        return (
          <div>
            <p className="text-sm font-medium">{activos} activos</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total: {total}</p>
          </div>
        )
      }
    },
    {
      key: 'activo',
      header: 'Estado',
      cell: (item: Ruta) => (
        <Badge variant={item.activo ? 'success' : 'error'}>
          {item.activo ? 'Activa' : 'Inactiva'}
        </Badge>
      )
    },
    {
      key: 'acciones',
      header: 'Acciones',
      cell: (item: Ruta) => (
        <div className="flex flex-wrap gap-2">
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(item)}>
              Editar
            </Button>
          )}
          {onViewVendedores && (
            <Button variant="outline" size="sm" onClick={() => onViewVendedores(item)}>
              Vendedores
            </Button>
          )}
          {onViewClientes && (
            <Button variant="outline" size="sm" onClick={() => onViewClientes(item)}>
              Clientes
            </Button>
          )}
          {onAsignarVendedor && (
            <Button variant="outline" size="sm" onClick={() => onAsignarVendedor(item)}>
              Asignar
            </Button>
          )}
          {onToggleStatus && (
            <Button
              variant={item.activo ? 'danger' : 'success'}
              size="sm"
              onClick={() => onToggleStatus(item)}
            >
              {item.activo ? 'Desactivar' : 'Activar'}
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
      onRowClick={onEdit}
    />
  )
}
