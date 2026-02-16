import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { pagos as Pago } from '@prisma/client'

export class PagoRepository extends BaseRepository<Pago> {
  constructor() {
    super()
    this.model = prisma.pagos
  }

  async findByCredito(id_credito: number): Promise<Pago[]> {
    return this.model.findMany({
      where: { id_credito },
      include: {
        usuarios: true,
        creditos: {
          include: {
            clientes: true
          }
        }
      },
      orderBy: {
        fecha_pago: 'desc'
      }
    })
  }

  async findByUsuario(registrado_por: number): Promise<Pago[]> {
    return this.model.findMany({
      where: { registrado_por },
      include: {
        creditos: {
          include: {
            clientes: true
          }
        }
      },
      orderBy: {
        fecha_pago: 'desc'
      }
    })
  }

  async findByFecha(fechaInicio: Date, fechaFin: Date): Promise<Pago[]> {
    return this.model.findMany({
      where: {
        fecha_pago: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        creditos: {
          include: {
            clientes: true,
            vendedores: true
          }
        },
        usuarios: true
      },
      orderBy: {
        fecha_pago: 'desc'
      }
    })
  }

  async getResumenPorFecha(fechaInicio: Date, fechaFin: Date): Promise<any> {
    const pagos = await this.findByFecha(fechaInicio, fechaFin)
    
    return {
      total: pagos.length,
      montoTotal: pagos.reduce((sum, p) => sum + Number(p.monto_pagado), 0),
      porMetodoPago: this.agruparPorMetodoPago(pagos),
      pagos
    }
  }

  private agruparPorMetodoPago(pagos: Pago[]): any {
    return pagos.reduce((acc: any, pago) => {
      const metodo = pago.metodo_pago || 'OTRO'
      if (!acc[metodo]) {
        acc[metodo] = {
          cantidad: 0,
          monto: 0
        }
      }
      acc[metodo].cantidad++
      acc[metodo].monto += Number(pago.monto_pagado)
      return acc
    }, {})
  }
}