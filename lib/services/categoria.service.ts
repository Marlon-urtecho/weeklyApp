import { CategoriaRepository } from '../repositories/categoria.repository'
import { createcategoriaDTOType, updatecategoriaDTOType } from '../dto/categoria.dto'

export class CategoriaService {
  private categoriaRepository: CategoriaRepository

  constructor() {
    this.categoriaRepository = new CategoriaRepository()
  }

  async getAll() {
    return this.categoriaRepository.findAll()
  }

  async getById(id: number) {
    const categoria = await this.categoriaRepository.findById(id)
    if (!categoria) throw new Error('Categoría no encontrada')
    return categoria
  }

  async create(data: createcategoriaDTOType) {
    const existing = await this.categoriaRepository.findByNombre(data.nombre_categoria)
    if (existing) throw new Error('La categoría ya existe')

    return this.categoriaRepository.create(data)
  }

  async update(id: number, data: updatecategoriaDTOType) {
    const categoria = await this.categoriaRepository.findById(id)
    if (!categoria) throw new Error('Categoría no encontrada')

    if (data.nombre_categoria && data.nombre_categoria !== (categoria as any).nombre_categoria) {
      const existente = await this.categoriaRepository.findByNombre(data.nombre_categoria)
      if (existente && (existente as any).id_categoria !== id) {
        throw new Error('La categoría ya existe')
      }
    }

    return this.categoriaRepository.update(id, data)
  }

  async delete(id: number) {
    const categoria = await this.categoriaRepository.findById(id)
    if (!categoria) throw new Error('Categoría no encontrada')

    return this.categoriaRepository.update(id, { activo: false })
  }

  async getActivas() {
    return this.categoriaRepository.findActivas()
  }

  async getProductosByCategoria(id_categoria: number) {
    return this.categoriaRepository.getProductosByCategoria(id_categoria)
  }
}
