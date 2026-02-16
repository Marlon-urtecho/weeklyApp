import { prisma } from '../db'

// Repository Pattern: Aísla el acceso a datos
export abstract class BaseRepository<T, TCreate = any, TUpdate = any> {
  protected model: any
  protected idField: string = 'id' 

  async findAll(): Promise<T[]> {
    return this.model.findMany()
  }
  
  async findById(id: number | string): Promise<T | null> {
    return this.model.findUnique({
      where: { [this.idField]: id }
    })
  }
  
  async create(data: TCreate): Promise<T> {
    return this.model.create({ data })
  }
  
  async update(id: number | string, data: TUpdate): Promise<T> {
    return this.model.update({
      where: { [this.idField]: id },
      data
    })
  }
  
  async delete(id: number | string): Promise<T> {
    return this.model.delete({
      where: { [this.idField]: id }
    })
  }
}