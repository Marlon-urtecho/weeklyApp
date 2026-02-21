import { TipoMovimientoRepository } from '../repositories/tipo-movimiento.repository'
import {
  CreateTipoMovimientoDTOType,
  UpdateTipoMovimientoDTOType
} from '../dto/tipo-movimiento.dto'
import { prisma } from '../db'
import { ensureTiposMovimientoBase } from './tipo-movimiento-base.service'

const TIPOS_BASE = ['ENTRADA', 'SALIDA', 'AJUSTE', 'TRANSFERENCIA', 'DEVOLUCION', 'DEVOLUCIÓN']

export class TipoMovimientoService {
  private tipoMovimientoRepository: TipoMovimientoRepository

  constructor() {
    this.tipoMovimientoRepository = new TipoMovimientoRepository()
  }

  async getAll(includeInactivos: boolean = true) {
    await ensureTiposMovimientoBase(prisma)

    const tipos = await this.tipoMovimientoRepository.findAll()

    const mapped = tipos.map((tipo: any) => ({
      ...tipo,
      activo: typeof tipo.activo === 'boolean' ? tipo.activo : true
    }))

    if (includeInactivos) return mapped
    return mapped.filter((tipo) => tipo.activo)
  }

  async getById(id: number) {
    const tipo = await this.tipoMovimientoRepository.findById(id)
    if (!tipo) throw new Error('Tipo de movimiento no encontrado')

    return {
      ...tipo,
      activo: typeof (tipo as any).activo === 'boolean' ? (tipo as any).activo : true
    }
  }

  async create(data: CreateTipoMovimientoDTOType) {
    const normalizedName = this.normalizarNombre(data.nombre_tipo)
    const existente = await this.buscarDuplicadoSemantico(normalizedName)
    if (existente) throw new Error('Ya existe un tipo de movimiento con ese nombre')

    return this.tipoMovimientoRepository.create({
      nombre_tipo: normalizedName,
      factor: data.factor,
      descripcion: data.descripcion?.trim() || null
    } as any)
  }

  async update(id: number, data: UpdateTipoMovimientoDTOType) {
    const tipo = await this.tipoMovimientoRepository.findById(id)
    if (!tipo) throw new Error('Tipo de movimiento no encontrado')

    const isBase = this.esTipoBase((tipo as any).nombre_tipo)
    const nextName = data.nombre_tipo ? this.normalizarNombre(data.nombre_tipo) : undefined

    if (nextName && nextName !== (tipo as any).nombre_tipo) {
      const existente = await this.buscarDuplicadoSemantico(nextName, id)
      if (existente && (existente as any).id_tipo_movimiento !== id) {
        throw new Error('Ya existe un tipo de movimiento con ese nombre')
      }
    }

    const updatePayload: any = {}
    if (nextName) updatePayload.nombre_tipo = nextName
    if (typeof data.factor === 'number') updatePayload.factor = data.factor
    if (data.descripcion !== undefined) updatePayload.descripcion = data.descripcion?.trim() || null

    if ((tipo as any).activo !== undefined && typeof data.activo === 'boolean') {
      if (isBase && data.activo === false) {
        throw new Error('No se puede desactivar un tipo base')
      }
      updatePayload.activo = data.activo
    }

    return this.tipoMovimientoRepository.update(id, updatePayload)
  }

  async delete(id: number) {
    const tipo = await this.tipoMovimientoRepository.findById(id)
    if (!tipo) throw new Error('Tipo de movimiento no encontrado')

    if (this.esTipoBase((tipo as any).nombre_tipo)) {
      throw new Error('No se puede eliminar un tipo base')
    }

    if ((tipo as any).activo === undefined) {
      return this.tipoMovimientoRepository.delete(id)
    }

    return this.tipoMovimientoRepository.update(id, { activo: false } as any)
  }

  private esTipoBase(nombre: string): boolean {
    const normalized = this.normalizarNombre(nombre || '')
    return TIPOS_BASE.some((base) => this.normalizarNombre(base) === normalized)
  }

  private normalizarNombre(nombre: string): string {
    return nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toUpperCase()
  }

  private async buscarDuplicadoSemantico(nombre: string, excludeId?: number) {
    const tipos = await this.tipoMovimientoRepository.findAll()
    const canonical = this.normalizarNombre(nombre)

    return tipos.find((t: any) => {
      if (excludeId && t.id_tipo_movimiento === excludeId) return false
      return this.normalizarNombre(t.nombre_tipo) === canonical
    })
  }
}
