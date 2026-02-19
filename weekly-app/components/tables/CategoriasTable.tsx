'use client'

import React from 'react'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface Categoria {
  id_categoria: number
  nombre_categoria: string
  descripcion?: string
  activo: boolean
  productos?: Array<{
    id_producto: number
    nombre: string
  }>
}

interface CategoriasTableProps {
  data: Categoria[]
  loading?: boolean
  onEdit?: (categoria: Categoria) => void
  onToggleStatus?: (categoria: Categoria) => void
  onViewProductos?: (categoria: Categoria) => void
}

export const CategoriasTable: React.FC<CategoriasTableProps> = ({
  data,
  loading,
  onEdit,
  onToggleStatus,
  onViewProductos
}) => {
  const columns = [
    {
      key: 'nombre',
      header: 'Categoría',
      cell: (item: Categoria) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{item.nombre_categoria}</p>
          {item.descripcion && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.descripcion}</p>
          )}
        </div>
      )
    },
    {
      key: 'productos',
      header: 'Productos',
      cell: (item: Categoria) => {
        const count = item.productos?.length || 0
        return (
          <Badge variant={count > 0 ? 'info' : 'secondary'}>
            {count} productos
          </Badge>
        )
      }
    },
    {
      key: 'activo',
      header: 'Estado',
      cell: (item: Categoria) => (
        <Badge variant={item.activo ? 'success' : 'error'}>
          {item.activo ? 'Activa' : 'Inactiva'}
        </Badge>
      )
    },
    {
      key: 'acciones',
      header: 'Acciones',
      cell: (item: Categoria) => (
        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="secondary" size="sm" onClick={() => onEdit?.(item)}>
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={() => onViewProductos?.(item)}>
            Ver Productos
          </Button>
          <Button
            variant={item.activo ? 'danger' : 'success'}
            size="sm"
            onClick={() => onToggleStatus?.(item)}
          >
            {item.activo ? 'Desactivar' : 'Activar'}
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
      onRowClick={onEdit}
    />
  )
}
