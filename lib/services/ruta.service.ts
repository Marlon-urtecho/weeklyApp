import { RutaRepository } from '../repositories/ruta.repository'
import { RutaVendedorRepository } from '../repositories/ruta-vendedor.repository'
import { CreateRutaDTOType, UpdateRutaDTOType } from '../dto/rutas.dto'

export class RutaService {
  private rutaRepository: RutaRepository
  private rutaVendedorRepository: RutaVendedorRepository

  constructor() {
    this.rutaRepository = new RutaRepository()
    this.rutaVendedorRepository = new RutaVendedorRepository()
  }

  async getAll() {
    return this.rutaRepository.findAll()
  }

  async getById(id: number) {
    const ruta = await this.rutaRepository.findById(id)
    if (!ruta) throw new Error('Ruta no encontrada')
    return ruta
  }

  async create(data: CreateRutaDTOType) {
    const existing = await this.rutaRepository.findByCodigo(data.codigo_ruta)
    if (existing) throw new Error('El código de ruta ya existe')

    return this.rutaRepository.create(data)
  }

  async update(id: number, data: UpdateRutaDTOType) {
    const ruta = await this.rutaRepository.findById(id)
    if (!ruta) throw new Error('Ruta no encontrada')

    return this.rutaRepository.update(id, data)
  }

  async delete(id: number) {
    const ruta = await this.rutaRepository.findById(id)
    if (!ruta) throw new Error('Ruta no encontrada')

    return this.rutaRepository.update(id, { activo: false })
  }

  async getActivas() {
    return this.rutaRepository.findActivas()
  }

  async getVendedoresAsignados(id_ruta: number) {
    return this.rutaRepository.getVendedoresAsignados(id_ruta)
  }

  async getClientesByRuta(id_ruta: number) {
    const ruta = await this.rutaRepository.findById(id_ruta)
    if (!ruta) throw new Error('Ruta no encontrada')

    return this.rutaRepository.findById(id_ruta)
  }
}