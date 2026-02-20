import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { usuario_roles as UsuarioRol } from '../../prisma/generated/prisma/client'

export class UsuarioRolRepository extends BaseRepository<UsuarioRol> {
  constructor() {
    super()
    this.model = prisma.usuario_roles
  }

  async assignRole(id_usuario: number, id_rol: number): Promise<UsuarioRol> {
    return this.model.create({
      data: {
        id_usuario,
        id_rol
      }
    })
  }

  async removeRole(id_usuario: number, id_rol: number): Promise<void> {
    await this.model.delete({
      where: {
        id_usuario_id_rol: {
          id_usuario,
          id_rol
        }
      }
    })
  }

  async getUserRoles(id_usuario: number): Promise<UsuarioRol[]> {
    return this.model.findMany({
      where: { id_usuario },
      include: {
        roles: true
      }
    })
  }
}