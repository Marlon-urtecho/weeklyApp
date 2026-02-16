import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { movimientos_inventario as MovimientoInventario } from '@prisma/client'

export class MovimientoInventarioRepository extends BaseRepository<MovimientoInventario> {
  constructor() {
    super()
    this.model = prisma.movimientos_inventario
  }

  async findByProducto(id_producto: number): Promise<MovimientoInventario[]> {
    return this.model.findMany({
      where: { id_producto },
      include: {
        productos: true,
        tipo_movimiento: true,
        usuarios: true
      },
      orderBy: {
        fecha_movimiento: 'desc'
      }
    })
  }

  async findByFecha(rangoInicio: Date, rangoFin: Date): Promise<MovimientoInventario[]> {
    return this.model.findMany({
      where: {
        fecha_movimiento: {
          gte: rangoInicio,
          lte: rangoFin
        }
      },
      include: {
        productos: true,
        tipo_movimiento: true,
        usuarios: true
      },
      orderBy: {
        fecha_movimiento: 'desc'
      }
    })
  }

  async findByTipo(id_tipo_movimiento: number): Promise<MovimientoInventario[]> {
    return this.model.findMany({
      where: { id_tipo_movimiento },
      include: {
        productos: true,
        usuarios: true
      },
      orderBy: {
        fecha_movimiento: 'desc'
      }
    })
  }

  async getUltimosMovimientos(limite: number = 50): Promise<MovimientoInventario[]> {
    return this.model.findMany({
      take: limite,
      include: {
        productos: true,
        tipo_movimiento: true,
        usuarios: true
      },
      orderBy: {
        fecha_movimiento: 'desc'
      }
    })
  }

  async registrarMovimiento(data: any): Promise<MovimientoInventario> {
    return this.model.create({
      data,
      include: {
        productos: true,
        tipo_movimiento: true,
        usuarios: true
      }
    })
  }
}