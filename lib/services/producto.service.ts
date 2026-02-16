import { ProductoRepository } from '../repositories/producto.respository'
import { InventarioBodegaRepository } from '../repositories/inventario-bodega.repository'
import { CreateProductoDTOType, UpdateProductoDTOType } from '../dto/producto.dto'
import { prisma } from '../db'

export class ProductoService {
  private productoRepository: ProductoRepository
  private inventarioBodegaRepository: InventarioBodegaRepository

  constructor() {
    this.productoRepository = new ProductoRepository()
    this.inventarioBodegaRepository = new InventarioBodegaRepository()
  }

  async getAll() {
    return this.productoRepository.findAll()
  }

  async getById(id: number) {
    const producto = await this.productoRepository.findByIdWithRelations(id)
    if (!producto) throw new Error('Producto no encontrado')
    return producto
  }

  async create(data: CreateProductoDTOType) {
    return await prisma.$transaction(async (tx) => {
      const producto = await this.productoRepository.create(data)

      // Crear inventario inicial en bodega
      await this.inventarioBodegaRepository.create({
        id_producto: producto.id_producto,
        stock_total: 0,
        stock_disponible: 0
      })

      return producto
    })
  }

  async update(id: number, data: UpdateProductoDTOType) {
    const producto = await this.productoRepository.findById(id)
    if (!producto) throw new Error('Producto no encontrado')

    return this.productoRepository.update(id, data)
  }

  async delete(id: number) {
    const producto = await this.productoRepository.findById(id)
    if (!producto) throw new Error('Producto no encontrado')

    return this.productoRepository.delete(id)
  }

  async getByCategoria(id_categoria: number) {
    return this.productoRepository.findByCategoria(id_categoria)
  }

  async getInventarioCompleto() {
    return this.productoRepository.getInventarioCompleto()
  }

  async buscar(termino: string) {
    return this.productoRepository.buscarPorNombre(termino)
  }
}