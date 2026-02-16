import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { inventario_vendedor as InventarioVendedor } from '@prisma/client'

export class InventarioVendedorRepository extends BaseRepository<InventarioVendedor> {
  constructor() {
    super()
    this.model = prisma.inventario_vendedor
  }

  async findByVendedorYProducto(id_vendedor: number, id_producto: number): Promise<InventarioVendedor | null> {
    return this.model.findUnique({
      where: {
        id_vendedor_id_producto: {
          id_vendedor,
          id_producto
        }
      },
      include: {
        productos: true,
        vendedores: true
      }
    })
  }

  async getInventarioByVendedor(id_vendedor: number): Promise<InventarioVendedor[]> {
    return this.model.findMany({
      where: { id_vendedor },
      include: {
        productos: {
          include: {
            categorias: true
          }
        }
      },
      orderBy: {
        fecha_asignacion: 'desc'
      }
    })
  }

  async asignarProducto(id_vendedor: number, id_producto: number, cantidad: number): Promise<InventarioVendedor> {
    return this.model.upsert({
      where: {
        id_vendedor_id_producto: {
          id_vendedor,
          id_producto
        }
      },
      update: {
        cantidad: { increment: cantidad }
      },
      create: {
        id_vendedor,
        id_producto,
        cantidad
      }
    })
  }

  async retirarProducto(id_vendedor: number, id_producto: number, cantidad: number): Promise<InventarioVendedor | null> {
    const inventario = await this.findByVendedorYProducto(id_vendedor, id_producto)
    
    if (!inventario || inventario.cantidad < cantidad) {
      throw new Error('Stock insuficiente del vendedor')
    }

    if (inventario.cantidad === cantidad) {
      await this.model.delete({
        where: {
          id_vendedor_id_producto: {
            id_vendedor,
            id_producto
          }
        }
      })
      return null
    }

    return this.model.update({
      where: {
        id_vendedor_id_producto: {
          id_vendedor,
          id_producto
        }
      },
      data: {
        cantidad: { decrement: cantidad }
      }
    })
  }

  async getValorTotalInventario(id_vendedor: number): Promise<number> {
    const inventario = await this.model.findMany({
      where: { id_vendedor },
      include: {
        productos: true
      }
    })

    return inventario.reduce(
      (total, item) => total + (item.cantidad * Number(item.productos.precio_credito)), 0
    )
  }
}