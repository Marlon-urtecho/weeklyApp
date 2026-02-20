import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { roles as Rol } from '../../prisma/generated/prisma/client'

export class RolRepository extends BaseRepository<Rol> {
  constructor() {
    super()
    this.model = prisma.roles
  }

  async findByNombre(nombre: string): Promise<Rol | null> {
    return this.model.findUnique({
      where: { nombre_rol: nombre }
    })
  }

  async getUsuariosByRol(id_rol: number): Promise<Rol | null> {
    return this.model.findUnique({
      where: { id_rol },
      include: {
        usuario_roles: {
          include: {
            usuarios: true
          }
        }
      }
    })
  }
}