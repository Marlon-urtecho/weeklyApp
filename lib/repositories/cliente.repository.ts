import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { clientes as Cliente } from '@prisma/client'
import type { Prisma } from '@prisma/client'

type ClienteConCreditos = Prisma.clientesGetPayload<{
  include: {
    rutas: true
    creditos: {
      include: {
        vendedores: {
          include: {
            usuarios: true
          }
        }
        credito_detalle: {
          include: {
            productos: true
          }
        }
        pagos: true
      }
    }
  }
}>

export class ClienteRepository extends BaseRepository<Cliente> {
  constructor() {
    super()
    this.model = prisma.clientes
    this.idField = 'id_cliente'
  }

  async findAllWithRelations(): Promise<Cliente[]> {
    return this.model.findMany({
      include: {
        rutas: {
          include: {
            ruta_vendedor: {
              where: { activo: true },
              include: {
                vendedores: true
              }
            }
          }
        },
        creditos: {
          include: {
            pagos: {
              include: {
                pago_detalle_producto: {
                  include: {
                    productos: true
                  }
                }
              }
            }
          }
        }
      } as any,
      orderBy: {
        id_cliente: 'asc'
      }
    })
  }

  async findByCodigo(codigo: string): Promise<Cliente | null> {
    return this.model.findUnique({
      where: { codigo_cliente: codigo }
    })
  }

  async findByRuta(id_ruta: number): Promise<Cliente[]> {
    return this.model.findMany({
      where: { 
        id_ruta,
        activo: true 
      },
      include: {
        rutas: true
      }
    })
  }

  async findActivos(): Promise<Cliente[]> {
    return this.model.findMany({
      where: { activo: true },
      include: {
        rutas: true,
        creditos: {
          include: {
            pagos: true,
            credito_detalle: {
              include: {
                productos: true
              }
            }
          }
        }
      }
    })
  }

  async findByIdWithCreditos(id: number): Promise<ClienteConCreditos | null> {
    return this.model.findUnique({
      where: { id_cliente: id },
      include: {
        rutas: {
          include: {
            ruta_vendedor: {
              where: { activo: true },
              include: {
                vendedores: {
                  include: {
                    usuarios: true
                  }
                }
              }
            }
          }
        },
        creditos: {
          include: {
            vendedores: {
              include: {
                usuarios: true
              }
            },
            credito_detalle: {
              include: {
                productos: true
              }
            },
            pagos: {
              include: {
                pago_detalle_producto: {
                  include: {
                    productos: true
                  }
                }
              },
              orderBy: {
                fecha_pago: 'desc'
              }
            }
          }
        }
      } as any
    })
  }

  async buscarPorNombre(termino: string): Promise<Cliente[]> {
    return this.model.findMany({
      where: {
        OR: [
          { nombre: { contains: termino, mode: 'insensitive' } },
          { codigo_cliente: { contains: termino, mode: 'insensitive' } }
        ],
        activo: true
      },
      include: {
        rutas: true
      }
    })
  }
}
