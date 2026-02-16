import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { credito_detalle as CreditoDetalle } from '@prisma/client'

export class CreditoDetalleRepository extends BaseRepository<CreditoDetalle> {
  constructor() {
    super()
    this.model = prisma.credito_detalle
  }

  async findByCredito(id_credito: number): Promise<CreditoDetalle[]> {
    return this.model.findMany({
      where: { id_credito },
      include: {
        productos: true
      }
    })
  }

  async getTotalByCredito(id_credito: number): Promise<number> {
    const detalles = await this.model.findMany({
      where: { id_credito }
    })
    return detalles.reduce((sum, d) => sum + Number(d.subtotal), 0)
  }

  async agregarProducto(data: any): Promise<CreditoDetalle> {
    return this.model.upsert({
      where: {
        id_credito_id_producto: {
          id_credito: data.id_credito,
          id_producto: data.id_producto
        }
      },
      update: {
        cantidad: { increment: data.cantidad },
        subtotal: { increment: data.subtotal }
      },
      create: data
    })
  }
}