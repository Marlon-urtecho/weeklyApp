import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { tipo_movimiento as TipoMovimiento } from '../../prisma/generated/prisma/client'

export class TipoMovimientoRepository extends BaseRepository<TipoMovimiento> {
  constructor() {
    super()
    this.model = prisma.tipo_movimiento
    this.idField = 'id_tipo_movimiento'
  }

  async findByNombre(nombre: string): Promise<TipoMovimiento | null> {
    return this.model.findFirst({
      where: {
        nombre_tipo: {
          equals: nombre,
          mode: 'insensitive'
        }
      }
    })
  }

  async getTiposEntrada(): Promise<TipoMovimiento[]> {
    return this.model.findMany({
      where: { factor: 1 }
    })
  }

  async getTiposSalida(): Promise<TipoMovimiento[]> {
    return this.model.findMany({
      where: { factor: -1 }
    })
  }
}
