import { MovimientoInventarioRepository } from '../repositories/movimiento-inventario.repository'
import { TipoMovimientoRepository } from '../repositories/tipo-movimiento.repository'
import { CreateMovimientoInventarioDTO } from '../dto/inventario.dto' 
import { prisma } from '../db'
import { ensureTipoMovimientoBase } from './tipo-movimiento-base.service'

export class MovimientoInventarioService {
  private movimientoRepository: MovimientoInventarioRepository
  private tipoMovimientoRepository: TipoMovimientoRepository

  constructor() {
    this.movimientoRepository = new MovimientoInventarioRepository()
    this.tipoMovimientoRepository = new TipoMovimientoRepository()
  }

  async getAll() {
    const movimientos = await this.movimientoRepository.findAll()
    
    return Promise.all(
      movimientos.map(async (movimiento) => {
        const tipo = await this.tipoMovimientoRepository.findById(movimiento.id_tipo_movimiento)
        return {
          ...movimiento,
          tipo_movimiento: tipo
        }
      })
    )
  }

  async getById(id: number) {
    const movimiento = await this.movimientoRepository.findById(id)
    if (!movimiento) throw new Error('Movimiento no encontrado')
    
    const tipo = await this.tipoMovimientoRepository.findById(movimiento.id_tipo_movimiento)
    return {
      ...movimiento,
      tipo_movimiento: tipo
    }
  }

  async create(data: CreateMovimientoInventarioDTO) {
    const movimiento = await this.movimientoRepository.registrarMovimiento(data)
    const tipo = await this.tipoMovimientoRepository.findById(movimiento.id_tipo_movimiento)
    
    return {
      ...movimiento,
      tipo_movimiento: tipo
    }
  }

  async getByProducto(id_producto: number) {
    const movimientos = await this.movimientoRepository.findByProducto(id_producto)
    
    return Promise.all(
      movimientos.map(async (movimiento) => {
        const tipo = await this.tipoMovimientoRepository.findById(movimiento.id_tipo_movimiento)
        return {
          ...movimiento,
          tipo_movimiento: tipo
        }
      })
    )
  }

  async getByFecha(rangoInicio: Date, rangoFin: Date) {
    const movimientos = await this.movimientoRepository.findByFecha(rangoInicio, rangoFin)
    
    return Promise.all(
      movimientos.map(async (movimiento) => {
        const tipo = await this.tipoMovimientoRepository.findById(movimiento.id_tipo_movimiento)
        return {
          ...movimiento,
          tipo_movimiento: tipo
        }
      })
    )
  }

  async getUltimos(limite: number = 50) {
    const movimientos = await this.movimientoRepository.getUltimosMovimientos(limite)
    
    return Promise.all(
      movimientos.map(async (movimiento) => {
        const tipo = await this.tipoMovimientoRepository.findById(movimiento.id_tipo_movimiento)
        return {
          ...movimiento,
          tipo_movimiento: tipo
        }
      })
    )
  }

  async getByTipo(nombre_tipo: string) {
    const tipo = await ensureTipoMovimientoBase(prisma, nombre_tipo)
    if (!tipo) return []

    const movimientos = await this.movimientoRepository.findByTipo(tipo.id_tipo_movimiento)
    
    return movimientos.map(movimiento => ({
      ...movimiento,
      tipo_movimiento: tipo
    }))
  }

  async getResumenPorFecha(fechaInicio: Date, fechaFin: Date) {
    // Usar getByFecha que ya incluye los tipos
    const movimientosConTipo = await this.getByFecha(fechaInicio, fechaFin)

    return {
      total: movimientosConTipo.length,
      entradas: movimientosConTipo.filter(m => m.tipo_movimiento?.factor === 1).length,
      salidas: movimientosConTipo.filter(m => m.tipo_movimiento?.factor === -1).length,
      cantidadTotalEntradas: movimientosConTipo
        .filter(m => m.tipo_movimiento?.factor === 1)
        .reduce((sum, m) => sum + m.cantidad, 0),
      cantidadTotalSalidas: movimientosConTipo
        .filter(m => m.tipo_movimiento?.factor === -1)
        .reduce((sum, m) => sum + m.cantidad, 0),
      movimientos: movimientosConTipo
    }
  }
}
