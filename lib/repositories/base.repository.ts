import { prisma } from '../db'

// Repository Pattern: Aísla el acceso a datos
export abstract class BaseRepository<T> {
  protected model: any
  
  async findAll(): Promise<T[]> {
    return this.model.findMany()
  }
  
  async findById(id: number): Promise<T | null> {
    return this.model.findUnique({
      where: { id }
    })
  }
  
  async create(data: any): Promise<T> {
    return this.model.create({ data })
  }
  
  async update(id: number, data: any): Promise<T> {
    return this.model.update({
      where: { id },
      data
    })
  }
  
  async delete(id: number): Promise<T> {
    return this.model.delete({
      where: { id }
    })
  }
}