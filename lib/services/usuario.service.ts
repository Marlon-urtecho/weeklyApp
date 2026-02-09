import { UsuarioRepository } from '../repositories/Usuario.repository'
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
    const user = await this.usuarioRepository.update(id, data)
    const { password, ...usuarioSinPassword } = user
    return usuarioSinPassword
  }

  async delete(id: number) {
    return this.usuarioRepository.delete(id)
  }
}