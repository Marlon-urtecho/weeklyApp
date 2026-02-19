'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LayoutContainer from '@/components/layout/LayoutContainer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { RutasTable } from '@/components/tables/RutasTable'
import { RutaForm } from '@/components/forms/RutaForm'
import { AsignarRutaForm } from '@/components/forms/AsignarRutaForm'
import { useToast } from '@/contexts/ToastContext'
import { apiClient } from '@/lib/api/client'
import type { Ruta } from '@/types/ruta'
import { useAuth } from '@/contexts/AuthContext'

export default function RutasPage() {
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalAsignar, setModalAsignar] = useState(false)
  const [modalVendedores, setModalVendedores] = useState(false)
  const [modalClientes, setModalClientes] = useState(false)
  const [searchClientesRuta, setSearchClientesRuta] = useState('')
  const [rutaEditando, setRutaEditando] = useState<Ruta | null>(null)
  const [rutaSeleccionada, setRutaSeleccionada] = useState<Ruta | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'activas' | 'inactivas'>('todos')
  const { showToast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  const roleNames = (user?.roles || []).map((r) => (r.nombre_rol || '').toUpperCase().trim())
  const hasRole = (keyword: string) => roleNames.some((r) => r.includes(keyword))
  const canManageRutas = hasRole('ADMIN') || hasRole('SUPERVISOR')
  const canViewRutas = canManageRutas || hasRole('VENDEDOR')

  useEffect(() => {
    if (!canViewRutas) return
    cargarRutas()
  }, [canViewRutas])

  const cargarRutas = async () => {
    try {
      setLoading(true)
      const data = await apiClient.get('/api/rutas?include=all')
      setRutas(data)
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (ruta: Ruta) => {
    setRutaEditando(ruta)
    setModalAbierto(true)
  }

  const handleToggleStatus = async (ruta: Ruta) => {
    try {
      await apiClient.put(`/api/rutas/${ruta.id_ruta}`, {
        activo: !ruta.activo
      })
      showToast(`Ruta ${!ruta.activo ? 'activada' : 'desactivada'}`, 'success')
      cargarRutas()
    } catch (error: any) {
      showToast(error.message, 'error')
    }
  }

  const handleViewVendedores = (ruta: Ruta) => {
    setRutaSeleccionada(ruta)
    setModalVendedores(true)
  }

  const handleViewClientes = (ruta: Ruta) => {
    setRutaSeleccionada(ruta)
    setModalClientes(true)
  }

  const handleAsignarRuta = (ruta: Ruta) => {
    setRutaSeleccionada(ruta)
    setModalAsignar(true)
  }

  const handleDesasignarVendedor = async (id_ruta: number, id_vendedor: number) => {
    try {
      await apiClient.delete(`/api/vendedores/${id_vendedor}/rutas?id_ruta=${id_ruta}`)
      showToast('Vendedor desasignado', 'success')
      cargarRutas()
      setModalVendedores(false)
    } catch (error: any) {
      showToast(error.message, 'error')
    }
  }

  const filteredRutas = rutas.filter(r => {
    const matchesSearch = r.codigo_ruta.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.nombre_ruta.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (r.zona || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filtroActivo === 'todos' ? true :
                         filtroActivo === 'activas' ? r.activo :
                         !r.activo
    
    return matchesSearch && matchesFilter
  })

  const clientesRutaFiltrados = (rutaSeleccionada?.clientes || []).filter((cliente) => {
    const term = searchClientesRuta.toLowerCase().trim()
    if (!term) return true
    const creditosTotal = (cliente.creditos || []).length
    const creditosMorosos = (cliente.creditos || []).filter((c) => c.estado === 'MOROSO').length
    const data = [
      cliente.codigo_cliente || '',
      cliente.nombre || '',
      cliente.telefono || '',
      cliente.activo ? 'activo' : 'inactivo',
      String(creditosTotal),
      String(creditosMorosos)
    ].join(' ').toLowerCase()
    return data.includes(term)
  })

  const stats = {
    total: rutas.length,
    activas: rutas.filter(r => r.activo).length,
    conVendedores: rutas.filter(r => r.vendedores && r.vendedores.length > 0).length,
    totalVendedores: rutas.reduce((sum, r) => sum + (r.vendedores?.length || 0), 0),
    totalClientes: rutas.reduce((sum, r) => sum + (r.clientes?.length || 0), 0)
  }

  return (
    <LayoutContainer>
      <div className="space-y-6">
        {!canViewRutas && (
          <Card>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No tienes permisos para ver el módulo de rutas.
            </p>
          </Card>
        )}

        {canViewRutas && (
          <>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Rutas
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Gestiona las rutas de venta y asignación a vendedores
            </p>
          </div>
          <Button 
            onClick={() => {
              setRutaEditando(null)
              setModalAbierto(true)
            }}
            disabled={!canManageRutas}
            className="w-full sm:w-auto"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nueva Ruta
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Rutas</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 dark:text-gray-400">Rutas Activas</p>
            <p className="text-2xl font-bold text-green-600">{stats.activas}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 dark:text-gray-400">Con Vendedores</p>
            <p className="text-2xl font-bold text-blue-600">{stats.conVendedores}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 dark:text-gray-400">Vendedores Asignados</p>
            <p className="text-2xl font-bold text-purple-600">{stats.totalVendedores}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600 dark:text-gray-400">Clientes en Rutas</p>
            <p className="text-2xl font-bold text-orange-600">{stats.totalClientes}</p>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <div className="space-y-4">
            <Input
              placeholder="Buscar por código, nombre o zona..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />

            <div className="flex gap-2">
              <button
                onClick={() => setFiltroActivo('todos')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filtroActivo === 'todos'
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltroActivo('activas')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filtroActivo === 'activas'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
                }`}
              >
                Activas
              </button>
              <button
                onClick={() => setFiltroActivo('inactivas')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filtroActivo === 'inactivas'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
                }`}
              >
                Inactivas
              </button>
            </div>
          </div>
        </Card>

        {/* Tabla */}
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <RutasTable
              data={filteredRutas}
              loading={loading}
              onEdit={canManageRutas ? handleEdit : undefined}
              onToggleStatus={canManageRutas ? handleToggleStatus : undefined}
              onViewVendedores={handleViewVendedores}
              onViewClientes={handleViewClientes}
              onAsignarVendedor={canManageRutas ? handleAsignarRuta : undefined}
            />
          </div>
        </Card>

        {/* Modal de Ruta */}
        <Modal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          title={rutaEditando ? 'Editar Ruta' : 'Nueva Ruta'}
          size="md"
        >
          <RutaForm
            rutaId={rutaEditando?.id_ruta}
            onSuccess={() => {
              setModalAbierto(false)
              cargarRutas()
            }}
            onCancel={() => setModalAbierto(false)}
          />
        </Modal>

        {/* Modal de Asignar Vendedor a Ruta */}
        <Modal
          isOpen={modalAsignar}
          onClose={() => setModalAsignar(false)}
          title={`Asignar Vendedor - ${rutaSeleccionada?.nombre_ruta}`}
          size="md"
        >
          {rutaSeleccionada && (
            <AsignarRutaForm
              rutaId={rutaSeleccionada.id_ruta}
              rutaNombre={rutaSeleccionada.nombre_ruta}
              onSuccess={() => {
                setModalAsignar(false)
                cargarRutas()
              }}
              onCancel={() => setModalAsignar(false)}
            />
          )}
        </Modal>

        {/* Modal de Vendedores Asignados */}
        <Modal
          isOpen={modalVendedores}
          onClose={() => setModalVendedores(false)}
          title={`Vendedores - ${rutaSeleccionada?.nombre_ruta}`}
          size="lg"
        >
          {rutaSeleccionada && (
            <div className="space-y-4">
              {rutaSeleccionada.vendedores && rutaSeleccionada.vendedores.length > 0 ? (
                <div className="space-y-3">
                  {rutaSeleccionada.vendedores.map((vendedor) => (
                    <div
                      key={vendedor.id_vendedor}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {vendedor.nombre}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Asignado: {new Date(vendedor.fecha_asignacion).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={!canManageRutas}
                        onClick={() => handleDesasignarVendedor(
                          rutaSeleccionada.id_ruta,
                          vendedor.id_vendedor
                        )}
                      >
                        Desasignar
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay vendedores asignados a esta ruta
                </p>
              )}
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="primary"
                  fullWidth
                  disabled={!canManageRutas}
                  onClick={() => {
                    setModalVendedores(false)
                    setModalAsignar(true)
                  }}
                >
                  Asignar Nuevo Vendedor
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal de Clientes en Ruta */}
        <Modal
          isOpen={modalClientes}
          onClose={() => {
            setModalClientes(false)
            setSearchClientesRuta('')
          }}
          title={`Clientes - ${rutaSeleccionada?.nombre_ruta}`}
          size="xl"
        >
          {rutaSeleccionada && (
            <div className="space-y-4">
              {(rutaSeleccionada.clientes || []).length > 0 ? (
                <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="Buscar por código, nombre, teléfono, estado o créditos..."
                    value={searchClientesRuta}
                    onChange={(e) => setSearchClientesRuta(e.target.value)}
                  />
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm">
                    Clientes en ruta: <b>{(rutaSeleccionada.clientes || []).length}</b>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm">
                    Mostrando: <b>{clientesRutaFiltrados.length}</b>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-[65vh]">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr className="text-left text-gray-600 dark:text-gray-300">
                        <th className="px-3 py-2">Código</th>
                        <th className="px-3 py-2">Cliente</th>
                        <th className="px-3 py-2">Teléfono</th>
                        <th className="px-3 py-2">Créditos</th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientesRutaFiltrados.map((cliente) => {
                        const creditosTotal = (cliente.creditos || []).length
                        const creditosMorosos = (cliente.creditos || []).filter((c) => c.estado === 'MOROSO').length
                        return (
                          <tr key={cliente.id_cliente} className="border-t border-gray-100 dark:border-gray-800">
                            <td className="px-3 py-2">
                              <span className="font-medium">{cliente.codigo_cliente || `C-${cliente.id_cliente}`}</span>
                            </td>
                            <td className="px-3 py-2">{cliente.nombre}</td>
                            <td className="px-3 py-2">{cliente.telefono || '-'}</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-col">
                                <span>{creditosTotal} créditos</span>
                                <span className="text-xs text-red-600">{creditosMorosos} morosos</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 rounded text-xs ${cliente.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {cliente.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setModalClientes(false)
                                  router.push(`/dashboard/clientes?openCliente=${cliente.id_cliente}`)
                                }}
                              >
                                Ver Detalle Crédito
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                </>
              ) : (
                <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay clientes en esta ruta
                </p>
              )}
            </div>
          )}
        </Modal>
          </>
        )}
      </div>
    </LayoutContainer>
  )
}
