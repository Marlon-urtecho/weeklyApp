import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import { Usuario } from '../models'
import bcrypt from 'bcryptjs'

export class UsuarioRepository extends BaseRepository<Usuario> {
  private mapUsuario(raw: any): Usuario {
    const uniqueRolesMap = new Map<number, any>()
    for (const rol of (raw?.usuario_roles || []).map((ur: any) => ur.roles).filter(Boolean)) {
      if (!uniqueRolesMap.has(rol.id_rol)) {
        uniqueRolesMap.set(rol.id_rol, rol)
      }
    }

    return {
      ...raw,
      roles: Array.from(uniqueRolesMap.values())
    }
  }

  findActivos(): any {
    return this.model.findMany({
      where: { activo: true },
      include: {
        usuario_roles: {
          include: {
            roles: true
          }
        }
      }
    })
  }
  constructor() {
    super()
    this.model = prisma.usuarios
    this.idField = 'id_usuario'
  }

  async findAll(): Promise<Usuario[]> {
    const rows = await this.model.findMany({
      include: {
        usuario_roles: {
          include: {
            roles: true
          }
        }
      },
      orderBy: { id_usuario: 'asc' }
    })
    return rows.map((row: any) => this.mapUsuario(row))
  }

  async findById(id: number | string): Promise<Usuario | null> {
    const row = await this.model.findUnique({
      where: { [this.idField]: id },
      include: {
        usuario_roles: {
          include: {
            roles: true
          }
        }
      }
    })
    return row ? this.mapUsuario(row) : null
  }

  async findByUsername(username: string): Promise<Usuario | null> {
    const row = await this.model.findUnique({
      where: { username },
      include: {
        usuario_roles: {
          include: {
            roles: true
          }
        }
      }
    })
    return row ? this.mapUsuario(row) : null
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

  async updateWithRoles(id_usuario: number, data: any): Promise<Usuario> {
    return prisma.$transaction(async (tx) => {
      const payload: any = {}
      if (data.nombre !== undefined) payload.nombre = data.nombre
      if (data.username !== undefined) payload.username = data.username
      if (data.activo !== undefined) payload.activo = data.activo

      await tx.usuarios.update({
        where: { id_usuario },
        data: payload
      })

      if (Array.isArray(data.roles)) {
        await tx.usuario_roles.deleteMany({ where: { id_usuario } })
        if (data.roles.length > 0) {
          await tx.usuario_roles.createMany({
            data: data.roles.map((id_rol: number) => ({ id_usuario, id_rol }))
          })
        }
      }

      const updated = await tx.usuarios.findUnique({
        where: { id_usuario },
        include: {
          usuario_roles: {
            include: {
              roles: true
            }
          }
        }
      })

      if (!updated) throw new Error('Usuario no encontrado')
      return this.mapUsuario(updated)
    })
  }

  async verifyPassword(user: Usuario, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password!)
  }

  async findProfileById(id_usuario: number) {
    const row = await this.model.findUnique({
      where: { id_usuario },
      include: {
        usuario_roles: {
          include: {
            roles: true
          }
        },
        vendedores: true
      }
    })

    if (!row) return null

    const mapped = this.mapUsuario(row) as any
    return {
      ...mapped,
      vendedor: row.vendedores || null
    }
  }

  async updateProfile(id_usuario: number, data: { nombre?: string; username?: string; telefono_vendedor?: string }) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.usuarios.findUnique({
        where: { id_usuario },
        include: { vendedores: true }
      })
      if (!user) throw new Error('Usuario no encontrado')

      if (data.username && data.username !== user.username) {
        const exists = await tx.usuarios.findUnique({
          where: { username: data.username }
        })
        if (exists && exists.id_usuario !== id_usuario) {
          throw new Error('El nombre de usuario ya existe')
        }
      }

      const userPayload: any = {}
      if (data.nombre !== undefined) userPayload.nombre = data.nombre
      if (data.username !== undefined) userPayload.username = data.username

      if (Object.keys(userPayload).length > 0) {
        await tx.usuarios.update({
          where: { id_usuario },
          data: userPayload
        })
      }

      if (typeof data.telefono_vendedor === 'string' && user.vendedores) {
        await tx.vendedores.update({
          where: { id_usuario },
          data: { telefono: data.telefono_vendedor }
        })
      }

      const updated = await tx.usuarios.findUnique({
        where: { id_usuario },
        include: {
          usuario_roles: {
            include: { roles: true }
          },
          vendedores: true
        }
      })

      if (!updated) throw new Error('Usuario no encontrado')
      const mapped = this.mapUsuario(updated) as any
      return {
        ...mapped,
        vendedor: updated.vendedores || null
      }
    })
  }

  async changePassword(id_usuario: number, currentPassword: string, newPassword: string) {
    const user = await this.model.findUnique({
      where: { id_usuario }
    })

    if (!user) throw new Error('Usuario no encontrado')

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) throw new Error('La contraseña actual es incorrecta')

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await this.model.update({
      where: { id_usuario },
      data: { password: hashedPassword }
    })
  }
}
