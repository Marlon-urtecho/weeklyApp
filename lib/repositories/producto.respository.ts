import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { productos as Producto } from '@prisma/client'

export class ProductoRepository extends BaseRepository<Producto> {
  constructor() {
    super()
    this.model = prisma.productos
  }

  async findByCategoria(id_categoria: number): Promise<Producto[]> {
    return this.model.findMany({
      where: { id_categoria },
      include: {
        categorias: true
      }
    })
  }

  async findByIdWithRelations(id: number): Promise<Producto | null> {
    return this.model.findUnique({
      where: { id_producto: id },
      include: {
        categorias: true,
        inventario_bodega: true,
        inventario_vendedor: {
          include: {
            vendedores: true
          }
        },
        movimientos_inventario: true,
        credito_detalle: true
      }
    })
  }

  async getInventarioCompleto(): Promise<Producto[]> {
    return this.model.findMany({
      include: {
        categorias: true,
        inventario_bodega: true,
        inventario_vendedor: {
          include: {
            vendedores: true
          }
        }
      }
    })
  }

  async buscarPorNombre(termino: string): Promise<Producto[]> {
    return this.model.findMany({
      where: {
        nombre: {
          contains: termino,
          mode: 'insensitive'
        }
      },
      include: {
        categorias: true,
        inventario_bodega: true
      }
    })
  }
}