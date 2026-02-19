import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { inventario_bodega as InventarioBodega } from '@prisma/client'

export class InventarioBodegaRepository extends BaseRepository<InventarioBodega> {
  constructor() {
    super()
    this.model = prisma.inventario_bodega
    this.idField = 'id_inventario' 
  }

  async findAll(): Promise<InventarioBodega[]> {
    return this.model.findMany({
      include: {
        productos: {
          include: {
            categorias: true
          }
        }
      },
      orderBy: {
        id_producto: 'asc'
      }
    })
  }

  async findByProductoId(id_producto: number): Promise<InventarioBodega | null> {
    return this.model.findUnique({
      where: { id_producto },
      include: {
        productos: true
      }
    })
  }

  async getStockBajo(limite: number = 10): Promise<InventarioBodega[]> {
    return this.model.findMany({
      where: {
        stock_disponible: {
          lte: limite
        }
      },
      include: {
        productos: true
      },
      orderBy: {
        stock_disponible: 'asc'
      }
    })
  }

  async aumentarStock(id_producto: number, cantidad: number): Promise<InventarioBodega> {
    return this.model.update({
      where: { id_producto },
      data: {
        stock_total: { increment: cantidad },
        stock_disponible: { increment: cantidad }
      }
    })
  }

  async disminuirStock(id_producto: number, cantidad: number): Promise<InventarioBodega> {
    const inventario = await this.findByProductoId(id_producto)
    
    if (!inventario || inventario.stock_disponible < cantidad) {
      throw new Error('Stock insuficiente en bodega')
    }

    return this.model.update({
      where: { id_producto },
      data: {
        stock_disponible: { decrement: cantidad }
      }
    })
  }

 
  async findById(id_inventario: number): Promise<InventarioBodega | null> {
    return this.model.findUnique({
      where: { id_inventario },
      include: {
        productos: true
      }
    })
  }

  async update(id_inventario: number, data: any): Promise<InventarioBodega> {
    return this.model.update({
      where: { id_inventario },
      data
    })
  }

  async delete(id_inventario: number): Promise<InventarioBodega> {
    return this.model.delete({
      where: { id_inventario }
    })
  }
}
