import { UsuarioRepository } from '../repositories/usuario.repository'
import { CreateUsuarioDTOType, UpdateUsuarioDTOType } from '../dto/usuario.dto'

export class UsuarioService {
  private usuarioRepository: UsuarioRepository

  constructor() {
    this.usuarioRepository = new UsuarioRepository()
  }

  async getAll() {
    const usuarios = await this.usuarioRepository.findAll()
    // Remover passwords
    return usuarios.map(u => {
      const { password, ...usuarioSinPassword } = u
      return usuarioSinPassword
    })
  }

  async getById(id: number) {
    const user = await this.usuarioRepository.findById(id)
    if (!user) {
      throw new Error('Usuario no encontrado')
    }
    const { password, ...usuarioSinPassword } = user
    return usuarioSinPassword
  }

  async create(data: CreateUsuarioDTOType) {
    // Validar que no exista
    const existing = await this.usuarioRepository.findByUsername(data.username)
    if (existing) {
      throw new Error('El usuario ya existe')
    }

    const user = await this.usuarioRepository.createWithRoles(data)
    const { password, ...usuarioSinPassword } = user
    return usuarioSinPassword
  }

  async update(id: number, data: UpdateUsuarioDTOType) {
    const existing = await this.usuarioRepository.findById(id)
    if (!existing) {
      throw new Error('Usuario no encontrado')
    }
    const user = await this.usuarioRepository.updateWithRoles(id, data)
    const { password, ...usuarioSinPassword } = user
    return usuarioSinPassword
  }

  async delete(id: number) {
    const existing = await this.usuarioRepository.findById(id)
    if (!existing) {
      throw new Error('Usuario no encontrado')
    }
    const user = await this.usuarioRepository.updateWithRoles(id, { activo: false })
    const { password, ...usuarioSinPassword } = user
    return usuarioSinPassword
  }

  async asignarRol(id_usuario: number, id_rol: number) {
    const user = await this.usuarioRepository.findById(id_usuario)
    if (!user) throw new Error('Usuario no encontrado')

    const rolesActuales = (user.roles || []).map((r) => r.id_rol)
    if (rolesActuales.includes(id_rol)) return user

    return this.usuarioRepository.updateWithRoles(id_usuario, {
      roles: [...rolesActuales, id_rol]
    })
  }

  async quitarRol(id_usuario: number, id_rol: number) {
    const user = await this.usuarioRepository.findById(id_usuario)
    if (!user) throw new Error('Usuario no encontrado')

    const rolesActuales = (user.roles || []).map((r) => r.id_rol)
    return this.usuarioRepository.updateWithRoles(id_usuario, {
      roles: rolesActuales.filter((rid) => rid !== id_rol)
    })
  }

  async getProfile(id_usuario: number) {
    const profile = await this.usuarioRepository.findProfileById(id_usuario)
    if (!profile) throw new Error('Usuario no encontrado')
    const { password, ...sinPassword } = profile as any
    return sinPassword
  }

  async updateProfile(id_usuario: number, data: { nombre?: string; username?: string; telefono_vendedor?: string }) {
    const updated = await this.usuarioRepository.updateProfile(id_usuario, data)
    const { password, ...sinPassword } = updated as any
    return sinPassword
  }

  async changePassword(id_usuario: number, currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres')
    }
    return this.usuarioRepository.changePassword(id_usuario, currentPassword, newPassword)
  }
}
