'use client'

import { useEffect, useMemo, useState } from 'react'
import LayoutContainer from '@/components/layout/LayoutContainer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { CategoriasTable } from '@/components/tables/CategoriasTable'
import { CategoriaForm } from '@/components/forms/CategoriaForm'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'

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

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'activas' | 'inactivas'>('todas')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalProductos, setModalProductos] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    cargarCategorias()
  }, [])

  const cargarCategorias = async () => {
    try {
      setLoading(true)
      const data = await apiClient.get('/api/categorias')
      setCategorias(Array.isArray(data) ? data : [])
    } catch (error: any) {
      showToast(error.message || 'Error al cargar categorías', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (categoria: Categoria) => {
    setCategoriaEditando(categoria)
    setModalAbierto(true)
  }

  const handleCrear = () => {
    setCategoriaEditando(null)
    setModalAbierto(true)
  }

  const handleToggleStatus = async (categoria: Categoria) => {
    try {
      await apiClient.put(`/api/categorias/${categoria.id_categoria}`, {
        activo: !categoria.activo
      })
      showToast(`Categoría ${!categoria.activo ? 'activada' : 'desactivada'} correctamente`, 'success')
      cargarCategorias()
    } catch (error: any) {
      showToast(error.message || 'No se pudo actualizar el estado', 'error')
    }
  }

  const handleViewProductos = (categoria: Categoria) => {
    setCategoriaSeleccionada(categoria)
    setModalProductos(true)
  }

  const categoriasFiltradas = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return categorias.filter((c) => {
      const nombre = (c.nombre_categoria || '').toLowerCase()
      const descripcion = (c.descripcion || '').toLowerCase()
      const matchSearch = nombre.includes(term) || descripcion.includes(term)
      const matchEstado = filtroEstado === 'todas'
        ? true
        : filtroEstado === 'activas'
          ? c.activo
          : !c.activo
      return matchSearch && matchEstado
    })
  }, [categorias, searchTerm, filtroEstado])

  const stats = useMemo(() => ({
    total: categorias.length,
    activas: categorias.filter((c) => c.activo).length,
    inactivas: categorias.filter((c) => !c.activo).length,
    productos: categorias.reduce((sum, c) => sum + (c.productos?.length || 0), 0)
  }), [categorias])

  return (
    <LayoutContainer>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Categorías</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Administra categorías y su disponibilidad para productos
            </p>
          </div>
          <Button onClick={handleCrear}>Nueva Categoría</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><p className="text-sm text-gray-500">Total</p><p className="text-2xl font-bold">{stats.total}</p></Card>
          <Card><p className="text-sm text-gray-500">Activas</p><p className="text-2xl font-bold text-green-600">{stats.activas}</p></Card>
          <Card><p className="text-sm text-gray-500">Inactivas</p><p className="text-2xl font-bold text-red-600">{stats.inactivas}</p></Card>
          <Card><p className="text-sm text-gray-500">Productos vinculados</p><p className="text-2xl font-bold">{stats.productos}</p></Card>
        </div>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as 'todas' | 'activas' | 'inactivas')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="todas">Todas</option>
              <option value="activas">Solo activas</option>
              <option value="inactivas">Solo inactivas</option>
            </select>
            <div className="flex items-center">
              <Button variant="secondary" onClick={cargarCategorias}>Recargar</Button>
            </div>
          </div>
        </Card>

        <Card>
          <CategoriasTable
            data={categoriasFiltradas}
            loading={loading}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onViewProductos={handleViewProductos}
          />
        </Card>

        <Modal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          title={categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}
          size="md"
        >
          <CategoriaForm
            categoriaId={categoriaEditando?.id_categoria}
            onSuccess={() => {
              setModalAbierto(false)
              cargarCategorias()
            }}
            onCancel={() => setModalAbierto(false)}
          />
        </Modal>

        <Modal
          isOpen={modalProductos}
          onClose={() => setModalProductos(false)}
          title={`Productos de ${categoriaSeleccionada?.nombre_categoria || ''}`}
          size="lg"
        >
          <div className="space-y-2">
            {(categoriaSeleccionada?.productos || []).length === 0 && (
              <p className="text-sm text-gray-500">No hay productos en esta categoría.</p>
            )}
            {(categoriaSeleccionada?.productos || []).map((p) => (
              <div key={p.id_producto} className="px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800">
                <p className="text-sm font-medium">{p.nombre}</p>
                <p className="text-xs text-gray-500">ID: {p.id_producto}</p>
              </div>
            ))}
          </div>
        </Modal>
      </div>
    </LayoutContainer>
  )
}
