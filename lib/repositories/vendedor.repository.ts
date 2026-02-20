import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { vendedores as Vendedor } from '../../prisma/generated/prisma/client'

export class VendedorRepository extends BaseRepository<Vendedor> {
  constructor() {
    super()
    this.model = prisma.vendedores
    this.idField = 'id_vendedor'
  }

  async findAll(): Promise<Vendedor[]> {
    return this.model.findMany({
      include: {
        usuarios: true,
        ruta_vendedor: {
          where: { activo: true },
          include: {
            rutas: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })
  }

  async findByUsuarioId(id_usuario: number): Promise<Vendedor | null> {
    return this.model.findUnique({
      where: { id_usuario }
    })
  }

  async findByIdWithRelations(id: number): Promise<Vendedor | null> {
    return this.model.findUnique({
      where: { id_vendedor: id },
      include: {
        usuarios: true,
        ruta_vendedor: {
          include: {
            rutas: true
          }
        },
        inventario_vendedor: {
          include: {
            productos: true
          }
        },
        creditos: {
          include: {
            clientes: true,
            pagos: true
          }
        }
      }
    })
  }

  async findActivos(): Promise<Vendedor[]> {
    return this.model.findMany({
      where: { activo: true },
      include: {
        usuarios: true,
        ruta_vendedor: {
          where: { activo: true },
          include: {
            rutas: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })
  }

  async getEstadisticas(id_vendedor: number) {
    const vendedor = await this.model.findUnique({
      where: { id_vendedor: id_vendedor },
      include: {
        ruta_vendedor: {
          include: {
            rutas: {
              include: {
                clientes: {
                  include: {
                    creditos: {
                      where: { estado: 'ACTIVO' }
                    }
                  }
                }
              }
            }
          }
        },
        inventario_vendedor: {
          include: {
            productos: true
          }
        },
        creditos: {
          where: { estado: 'ACTIVO' },
          include: {
            clientes: true
          }
        }
      }
    })

    if (!vendedor) return null

    const totalClientes = vendedor.ruta_vendedor.reduce(
      (acc, rv) => acc + rv.rutas.clientes.length, 0
    )

    const totalCreditosActivos = vendedor.creditos.length

    const valorInventario = vendedor.inventario_vendedor.reduce(
      (acc, item) => acc + (item.cantidad * Number(item.productos.precio_credito)), 0
    )

    return {
      totalRutas: vendedor.ruta_vendedor.length,
      totalClientes,
      totalCreditosActivos,
      valorInventario,
      totalProductosInventario: vendedor.inventario_vendedor.length
    }
  }
}
