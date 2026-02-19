import { prisma } from '../db'
import { BaseRepository } from './base.repository'
import type { categorias as CategoriaPrisma } from '@prisma/client'

// Definir el tipo para crear una categoría
export type CreateCategoriaDTO = {
  nombre_categoria: string
  descripcion?: string
  activo?: boolean
}

export type UpdateCategoriaDTO = Partial<CreateCategoriaDTO>

export class CategoriaRepository extends BaseRepository<CategoriaPrisma, CreateCategoriaDTO, UpdateCategoriaDTO> {
  constructor() {
    super()
    this.model = prisma.categorias
    this.idField = 'id_categoria'
  }

  async findAll(): Promise<CategoriaPrisma[]> {
    return this.model.findMany({
      include: {
        productos: true
      },
      orderBy: {
        nombre_categoria: 'asc'
      }
    })
  }

  async findByNombre(nombre: string): Promise<CategoriaPrisma | null> {
    return this.model.findUnique({
      where: { nombre_categoria: nombre }
    })
  }

  async findActivas(): Promise<CategoriaPrisma[]> {
    return this.model.findMany({
      where: { activo: true },
      include: {
        productos: true
      }
    })
  }

  async getProductosByCategoria(id_categoria: number): Promise<CategoriaPrisma | null> {
    return this.model.findUnique({
      where: { id_categoria },
      include: {
        productos: true
      }
    })
  }
}
