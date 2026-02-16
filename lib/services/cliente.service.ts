import { ClienteRepository } from '../repositories/cliente.repository'
import { CreateClienteDTOType, UpdateClienteDTOType } from '../dto/clientes.dto'

export class ClienteService {
  private clienteRepository: ClienteRepository

  constructor() {
    this.clienteRepository = new ClienteRepository()
  }

  async getAll() {
    return this.clienteRepository.findAll()
  }

  async getById(id: number) {
    const cliente = await this.clienteRepository.findById(id)
    if (!cliente) throw new Error('Cliente no encontrado')
    return cliente
  }

  async create(data: CreateClienteDTOType) {
    const existing = await this.clienteRepository.findByCodigo(data.codigo_cliente)
    if (existing) throw new Error('El código de cliente ya existe')

    return this.clienteRepository.create(data)
  }

  async update(id: number, data: UpdateClienteDTOType) {
    const cliente = await this.clienteRepository.findById(id)
    if (!cliente) throw new Error('Cliente no encontrado')

    return this.clienteRepository.update(id, data)
  }

  async delete(id: number) {
    const cliente = await this.clienteRepository.findById(id)
    if (!cliente) throw new Error('Cliente no encontrado')

    return this.clienteRepository.update(id, { activo: false })
  }

  async getActivos() {
    return this.clienteRepository.findActivos()
  }

  async getByRuta(id_ruta: number) {
    return this.clienteRepository.findByRuta(id_ruta)
  }

  async getWithCreditos(id: number) {
    return this.clienteRepository.findByIdWithCreditos(id)
  }

  async buscar(termino: string) {
    return this.clienteRepository.buscarPorNombre(termino)
  }
}