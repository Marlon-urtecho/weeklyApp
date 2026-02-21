// repositories/credito.repository.ts
import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { creditos as Credito } from '../../prisma/generated/prisma/client'
import { UpdateCreditoDTOType } from '../dto/credito.dto'

export class CreditoRepository extends BaseRepository<Credito> {
  constructor() {
    super()
    this.model = prisma.creditos
    this.idField = 'id_credito'
  }

  async findAll(): Promise<Credito[]> {
    return this.model.findMany({
      include: {
        clientes: true,
        vendedores: true,
        pagos: {
          include: {
            pago_detalle_producto: {
              include: {
                productos: true
              }
            }
          }
        },
        credito_detalle: {
          include: {
            productos: true
          }
        }
      },
      orderBy: {
        id_credito: 'desc'
      }
    })
  }

  async updateSaldo(id_credito: number, monto_pagado: number): Promise<Credito> {
    const credito = await this.model.findUnique({
      where: { id_credito }
    })

    if (!credito) {
      throw new Error('Crédito no encontrado')
    }

    const saldoActual = Number(credito.saldo_pendiente)
    const nuevoSaldo = Math.max(saldoActual - Number(monto_pagado), 0)

    let estado = credito.estado
    if (nuevoSaldo <= 0) {
      estado = 'PAGADO'
    } else if (estado === 'PAGADO') {
      estado = 'ACTIVO'
    }

    return this.model.update({
      where: { id_credito },
      data: {
        saldo_pendiente: nuevoSaldo,
        estado
      }
    })
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
        clientes: true,
        vendedores: true,
        usuarios_crea: true,
        credito_detalle: {
          include: {
            productos: true
          }
        },
        pagos: {
          include: {
            usuarios: true,
            pago_detalle_producto: {
              include: {
                productos: true
              }
            }
          }
        }
      }
    })
  }

  async findByCliente(id_cliente: number): Promise<Credito[]> {
    return this.model.findMany({
      where: { id_cliente },
      include: {
        clientes: true,
        vendedores: true,
        pagos: {
          include: {
            pago_detalle_producto: {
              include: {
                productos: true
              }
            }
          }
        },
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
        clientes: true,
        vendedores: true,
        pagos: {
          include: {
            pago_detalle_producto: {
              include: {
                productos: true
              }
            }
          }
        },
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
        clientes: true,
        vendedores: true,
        pagos: {
          include: {
            pago_detalle_producto: {
              include: {
                productos: true
              }
            }
          }
        },
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
        clientes: true,
        vendedores: true,
        pagos: {
          include: {
            pago_detalle_producto: {
              include: {
                productos: true
              }
            }
          }
        },
        credito_detalle: {
          include: {
            productos: true
          }
        }
      }
    })
  }
}
