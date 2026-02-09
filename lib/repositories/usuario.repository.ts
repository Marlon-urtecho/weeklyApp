import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { Usuario } from '../models'
import bcrypt from 'bcryptjs'

export class UsuarioRepository extends BaseRepository<Usuario> {
  constructor() {
    super()
    this.model = prisma.usuarios
  }

  async findByUsername(username: string): Promise<Usuario | null> {
    return this.model.findUnique({
      where: { username },
      include: {
        usuario_roles: {
          include: {
            roles: true
          }
        }
      }
    })
  }

  async createWithRoles(data: any): Promise<Usuario> {
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    return prisma.$transaction(async (tx: { usuarios: { create: (arg0: { data: { nombre: any; username: any; password: string; activo: any } }) => any }; usuario_roles: { createMany: (arg0: { data: any }) => any } }) => {
      // 1. Crear usuario
      const usuario = await tx.usuarios.create({
        data: {
          nombre: data.nombre,
          username: data.username,
          password: hashedPassword,
          activo: data.activo ?? true
        }
      })

      // 2. Asignar roles si existen
      if (data.roles && data.roles.length > 0) {
        await tx.usuario_roles.createMany({
          data: data.roles.map((id_rol: number) => ({
            id_usuario: usuario.id_usuario,
            id_rol
          }))
        })
      }

      // 3. Retornar usuario con roles
      return this.findById(usuario.id_usuario) as Promise<Usuario>
    })
  }

  async verifyPassword(user: Usuario, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password!)
  }
}