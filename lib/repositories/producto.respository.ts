import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { Producto } from '../models'

export class ProductoRepository extends BaseRepository<Producto> {
  constructor() {
    super()
    this.model = prisma.productos
  }

  async findByCategoria(categoria: string): Promise<Producto[]> {
    return this.model.findMany({
      where: { categoria }
    })
  }

  async updateStock(id_producto: number, cantidad: number, tipo: 'ENTRADA' | 'SALIDA') {
    return prisma.$transaction(async (tx: { inventario_bodega: { findUnique: (arg0: { where: { id_producto: number } }) => any; update: (arg0: { where: { id_producto: number }; data: { stock_total: any; stock_disponible: any } }) => any }; movimientos_inventario: { create: (arg0: { data: { id_producto: number; tipo: "ENTRADA" | "SALIDA"; cantidad: number; origen: string; destino: string } }) => any } }) => {
      // 1. Actualizar inventario bodega
      const inventario = await tx.inventario_bodega.findUnique({
        where: { id_producto }
      })

      if (!inventario) {
        throw new Error('Producto sin inventario')
      }

      // 2. Calcular nuevo stock
      const nuevoStock = tipo === 'ENTRADA' 
        ? inventario.stock_disponible + cantidad
        : inventario.stock_disponible - cantidad

      if (nuevoStock < 0) {
        throw new Error('Stock insuficiente')
      }

      // 3. Actualizar
      await tx.inventario_bodega.update({
        where: { id_producto },
        data: {
          stock_total: tipo === 'ENTRADA' 
            ? inventario.stock_total + cantidad
            : inventario.stock_total,
          stock_disponible: nuevoStock
        }
      })

      // 4. Registrar movimiento
      await tx.movimientos_inventario.create({
        data: {
          id_producto,
          tipo,
          cantidad,
          origen: 'BODEGA',
          destino: tipo === 'SALIDA' ? 'VENDEDOR' : 'PROVEEDOR'
        }
      })
    })
  }
}