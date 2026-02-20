import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { rutas as Ruta } from '../../prisma/generated/prisma/client'

export class RutaRepository extends BaseRepository<Ruta> {
  constructor() {
    super()
    this.model = prisma.rutas
    this.idField = 'id_ruta'
  }

  async findByCodigo(codigo: string): Promise<Ruta | null> {
    return this.model.findUnique({
      where: { codigo_ruta: codigo }
    })
  }

  async findActivas(): Promise<Ruta[]> {
    return this.model.findMany({
      where: { activo: true },
      include: {
        ruta_vendedor: {
          include: {
            vendedores: {
              include: {
                usuarios: true
              }
            }
          }
        },
        clientes: {
          where: { activo: true }
        }
      }
    })
  }

  async getVendedoresAsignados(id_ruta: number): Promise<Ruta | null> {
    return this.model.findUnique({
      where: { id_ruta },
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
    })
  }
}
