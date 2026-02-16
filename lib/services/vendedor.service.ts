import { VendedorRepository } from '../repositories/vendedor.repository'
import { UsuarioRepository } from '../repositories/usuario.repository'
import { RutaVendedorRepository } from '../repositories/ruta-vendedor.repository'
import { CreateVendedorDTOType, UpdateVendedorDTOType } from '../dto/vendedor.dto'

export class VendedorService {
  private vendedorRepository: VendedorRepository
  private usuarioRepository: UsuarioRepository
  private rutaVendedorRepository: RutaVendedorRepository

  constructor() {
    this.vendedorRepository = new VendedorRepository()
    this.usuarioRepository = new UsuarioRepository()
    this.rutaVendedorRepository = new RutaVendedorRepository()
  }

  async getAll() {
    return this.vendedorRepository.findAll()
  }

  async getById(id: number) {
    const vendedor = await this.vendedorRepository.findByIdWithRelations(id)
    if (!vendedor) throw new Error('Vendedor no encontrado')
    return vendedor
  }

  async create(data: CreateVendedorDTOType) {
    const usuario = await this.usuarioRepository.findById(data.id_usuario)
    if (!usuario) throw new Error('Usuario no existe')

    const existente = await this.vendedorRepository.findByUsuarioId(data.id_usuario)
    if (existente) throw new Error('Usuario ya es vendedor')

    return this.vendedorRepository.create(data)
  }

  async update(id: number, data: UpdateVendedorDTOType) {
    const vendedor = await this.vendedorRepository.findById(id)
    if (!vendedor) throw new Error('Vendedor no encontrado')

    return this.vendedorRepository.update(id, data)
  }

  async delete(id: number) {
    const vendedor = await this.vendedorRepository.findById(id)
    if (!vendedor) throw new Error('Vendedor no encontrado')

    return this.vendedorRepository.update(id, { activo: false })
  }

  async getActivos() {
    return this.vendedorRepository.findActivos()
  }

  async asignarRuta(id_vendedor: number, id_ruta: number) {
    const vendedor = await this.vendedorRepository.findById(id_vendedor)
    if (!vendedor) throw new Error('Vendedor no encontrado')

    return this.rutaVendedorRepository.asignarRuta(id_ruta, id_vendedor)
  }

  async desasignarRuta(id_vendedor: number, id_ruta: number) {
    return this.rutaVendedorRepository.desasignarRuta(id_ruta, id_vendedor)
  }

  async getRutasAsignadas(id_vendedor: number) {
    return this.rutaVendedorRepository.getRutasByVendedor(id_vendedor)
  }

  async getDashboard(id: number) {
    const vendedor = await this.getById(id)
    const estadisticas = await this.vendedorRepository.getEstadisticas(id)

    return {
      vendedor,
      estadisticas
    }
  }
}