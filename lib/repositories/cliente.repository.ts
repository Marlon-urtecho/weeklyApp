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
            pagos: true
          }
        }
      }
    })
  }

  async findByIdWithCreditos(id: number): Promise<ClienteConCreditos | null> {
    return this.model.findUnique({
      where: { id_cliente: id },
      include: {
        rutas: true,
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
              orderBy: {
                fecha_pago: 'desc'
              }
            }
          }
        }
      }
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
