import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { tipo_movimiento as TipoMovimiento } from '@prisma/client'

export class TipoMovimientoRepository extends BaseRepository<TipoMovimiento> {
  constructor() {
    super()
    this.model = prisma.tipo_movimiento
  }

  async findByNombre(nombre: string): Promise<TipoMovimiento | null> {
    return this.model.findUnique({
      where: { nombre_tipo: nombre }
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