import { InventarioBodegaRepository } from '../repositories/inventario-bodega.repository'
import { MovimientoInventarioRepository } from '../repositories/movimiento-inventario.repository'
import { TipoMovimientoRepository } from '../repositories/tipo-movimiento.repository'
import { UpdateInventarioBodegaDTOType } from '../dto/inventario.dto'
import prisma from '../db'

export class InventarioBodegaService {
  private inventarioBodegaRepository: InventarioBodegaRepository
  private movimientoRepository: MovimientoInventarioRepository
  private tipoMovimientoRepository: TipoMovimientoRepository

  constructor() {
    this.inventarioBodegaRepository = new InventarioBodegaRepository()
    this.movimientoRepository = new MovimientoInventarioRepository()
    this.tipoMovimientoRepository = new TipoMovimientoRepository()
  }

  async getAll() {
    return this.inventarioBodegaRepository.findAll()
  }

  async getByProducto(id_producto: number) {
    return this.inventarioBodegaRepository.findByProductoId(id_producto)
  }

  async entrada(id_producto: number, cantidad: number, id_usuario: number, observacion?: string) {
    return await prisma.$transaction(async (tx) => {
      // Obtener tipo movimiento entrada
      const tipoEntrada = await this.tipoMovimientoRepository.findByNombre('ENTRADA')
      if (!tipoEntrada) throw new Error('Tipo de movimiento no configurado')

      // Actualizar stock
      const inventario = await this.inventarioBodegaRepository.aumentarStock(id_producto, cantidad)

      // Registrar movimiento
      await this.movimientoRepository.registrarMovimiento({
        id_producto,
        id_tipo_movimiento: tipoEntrada.id_tipo_movimiento,
        cantidad,
        origen: 'PROVEEDOR',
        destino: 'BODEGA',
        observacion,
        id_usuario_registra: id_usuario
      })

      return inventario
    })
  }

  async salida(id_producto: number, cantidad: number, destino: string, id_usuario: number, observacion?: string) {
    return await prisma.$transaction(async (tx) => {
      // Validar stock
      const inventario = await this.inventarioBodegaRepository.findByProductoId(id_producto)
      if (!inventario || inventario.stock_disponible < cantidad) {
        throw new Error('Stock insuficiente en bodega')
      }

      // Obtener tipo movimiento salida
      const tipoSalida = await this.tipoMovimientoRepository.findByNombre('SALIDA')
      if (!tipoSalida) throw new Error('Tipo de movimiento no configurado')

      // Actualizar stock
      const inventarioActualizado = await this.inventarioBodegaRepository.disminuirStock(id_producto, cantidad)

      // Registrar movimiento
      await this.movimientoRepository.registrarMovimiento({
        id_producto,
        id_tipo_movimiento: tipoSalida.id_tipo_movimiento,
        cantidad,
        origen: 'BODEGA',
        destino,
        observacion,
        id_usuario_registra: id_usuario
      })

      return inventarioActualizado
    })
  }

  async getStockBajo(limite: number = 10) {
    return this.inventarioBodegaRepository.getStockBajo(limite)
  }
}