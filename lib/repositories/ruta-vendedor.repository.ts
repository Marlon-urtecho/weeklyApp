import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { ruta_vendedor as RutaVendedor } from '../../prisma/generated/prisma/client'

export class RutaVendedorRepository extends BaseRepository<RutaVendedor> {
  constructor() {
    super()
    this.model = prisma.ruta_vendedor
    this.idField = 'id_ruta_vendedor'
  }

  async asignarRuta(id_ruta: number, id_vendedor: number): Promise<RutaVendedor> {
    const existente = await this.model.findUnique({
      where: {
        id_ruta_id_vendedor: {
          id_ruta,
          id_vendedor
        }
      }
    })

    if (existente) {
      return this.model.update({
        where: {
          id_ruta_id_vendedor: {
            id_ruta,
            id_vendedor
          }
        },
        data: {
          activo: true,
          fecha_asignacion: new Date()
        }
      })
    }

    return this.model.create({
      data: {
        id_ruta,
        id_vendedor,
        activo: true
      }
    })
  }

  async desasignarRuta(id_ruta: number, id_vendedor: number): Promise<void> {
    await this.model.update({
      where: {
        id_ruta_id_vendedor: {
          id_ruta,
          id_vendedor
        }
      },
      data: { activo: false }
    })
  }

  async getRutasByVendedor(id_vendedor: number): Promise<RutaVendedor[]> {
    return this.model.findMany({
      where: { 
        id_vendedor,
        activo: true
      },
      include: {
        rutas: {
          include: {
            clientes: true
          }
        }
      }
    })
  }

  async getVendedoresByRuta(id_ruta: number): Promise<RutaVendedor[]> {
    return this.model.findMany({
      where: { 
        id_ruta,
        activo: true
      },
      include: {
        vendedores: {
          include: {
            usuarios: true
          }
        }
      }
    })
  }
}
