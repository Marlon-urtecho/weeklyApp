import { RolRepository } from '../repositories/rol.repository'
import { CreateRolDTOType, UpdateRolDTOType } from '../dto/rol.dto'

export class RolService {
  private rolRepository: RolRepository

  constructor() {
    this.rolRepository = new RolRepository()
  }

  async getAll() {
    return this.rolRepository.findAll()
  }

  async getById(id: number) {
    const rol = await this.rolRepository.findById(id)
    if (!rol) throw new Error('Rol no encontrado')
    return rol
  }

  async create(data: CreateRolDTOType) {
    const existing = await this.rolRepository.findByNombre(data.nombre_rol)
    if (existing) throw new Error('El rol ya existe')

    return this.rolRepository.create(data)
  }

  async update(id: number, data: UpdateRolDTOType) {
    const rol = await this.rolRepository.findById(id)
    if (!rol) throw new Error('Rol no encontrado')

    return this.rolRepository.update(id, data)
  }

  async delete(id: number) {
    const rol = await this.rolRepository.findById(id)
    if (!rol) throw new Error('Rol no encontrado')

    return this.rolRepository.delete(id)
  }

  async getUsuariosByRol(id_rol: number) {
    return this.rolRepository.getUsuariosByRol(id_rol)
  }
}