// repositories/credito.repository.ts
import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { creditos as Credito } from '@prisma/client'
import { UpdateCreditoDTOType } from '../dto/credito.dto'

export class CreditoRepository extends BaseRepository<Credito> {
  updateSaldo(id_credito: number, monto_pagado: number) {
      throw new Error('Method not implemented.')
  }
  constructor() {
    super()
    this.model = prisma.creditos
    this.idField = 'id_credito'
  }

  // SOBRESCRIBE el método update con el tipo correcto
  async update(id: number, data: UpdateCreditoDTOType): Promise<Credito> {
    try {
      // Preparar los datos para actualizar
      const updateData: any = { ...data }
      
      // Si hay fecha, asegurar que sea Date
      if (data.fecha_vencimiento) {
        updateData.fecha_vencimiento = new Date(data.fecha_vencimiento)
      }

      const credito = await this.model.update({
        where: { id_credito: id },
        data: updateData
      })

      return credito
    } catch (error) {
      console.error('Error en update de crédito:', error)
      throw error
    }
  }

  // También sobrescribe create si es necesario
  async create(data: any): Promise<Credito> {
    // Tu implementación de create
    return this.model.create({ data })
  }

  async findByIdWithAll(id: number): Promise<Credito | null> {
    return this.model.findUnique({
      where: { id_credito: id },
      include: {
        cliente: true,
        vendedor: true,
        usuario_crea: true,
        credito_detalle: {
          include: {
            productos: true
          }
        },
        pagos: true
      }
    })
  }

  async findByCliente(id_cliente: number): Promise<Credito[]> {
    return this.model.findMany({
      where: { id_cliente },
      include: {
        credito_detalle: {
          include: {
            productos: true
          }
        }
      }
    })
  }

  async findByVendedor(id_vendedor: number): Promise<Credito[]> {
    return this.model.findMany({
      where: { id_vendedor },
      include: {
        credito_detalle: {
          include: {
            productos: true
          }
        }
      }
    })
  }

  async findActivos(): Promise<Credito[]> {
    return this.model.findMany({
      where: { estado: 'ACTIVO' },
      include: {
        credito_detalle: {
          include: {
            productos: true
          }
        }
      }
    })
  }

  async findVencidos(): Promise<Credito[]> {
    const hoy = new Date()
    return this.model.findMany({
      where: {
        fecha_vencimiento: {
          lt: hoy
        },
        estado: {
          notIn: ['PAGADO', 'CANCELADO']
        }
      },
      include: {
        credito_detalle: {
          include: {
            productos: true
          }
        }
      }
    })
  }
}