import { UsuarioRepository } from '../repositories/usuario.repository'
import { VendedorRepository } from '../repositories/vendedor.repository'
import { ClienteRepository } from '../repositories/cliente.repository'
import { ProductoRepository } from '../repositories/producto.respository'
import { CreditoRepository } from '../repositories/credito.repository'
import { PagoRepository } from '../repositories/pago.repository'
import { InventarioBodegaRepository } from '../repositories/inventario-bodega.repository'
import { MovimientoInventarioRepository } from '../repositories/movimiento-inventario.repository'

export class DashboardService {
  private usuarioRepository: UsuarioRepository
  private vendedorRepository: VendedorRepository
  private clienteRepository: ClienteRepository
  private productoRepository: ProductoRepository
  private creditoRepository: CreditoRepository
  private pagoRepository: PagoRepository
  private inventarioBodegaRepository: InventarioBodegaRepository
  private movimientoRepository: MovimientoInventarioRepository

  constructor() {
    this.usuarioRepository = new UsuarioRepository()
    this.vendedorRepository = new VendedorRepository()
    this.clienteRepository = new ClienteRepository()
    this.productoRepository = new ProductoRepository()
    this.creditoRepository = new CreditoRepository()
    this.pagoRepository = new PagoRepository()
    this.inventarioBodegaRepository = new InventarioBodegaRepository()
    this.movimientoRepository = new MovimientoInventarioRepository()
  }

  async getResumenGeneral() {
    const [
      usuarios,
      vendedoresActivos,
      clientesActivos,
      productos,
      creditosActivos,
      stockBajo
    ] = await Promise.all([
      this.usuarioRepository.findActivos(),
      this.vendedorRepository.findActivos(),
      this.clienteRepository.findActivos(),
      this.productoRepository.findAll(),
      this.creditoRepository.findActivos(),
      this.inventarioBodegaRepository.getStockBajo(10)
    ])

    return {
      usuarios: usuarios.length,
      vendedores: vendedoresActivos.length,
      clientes: clientesActivos.length,
      productos: productos.length,
      creditosActivos: creditosActivos.length,
      stockBajo: stockBajo.length,
      alertas: {
        stockBajo: stockBajo.length,
        creditosVencidos: (await this.creditoRepository.findVencidos()).length
      }
    }
  }

  async getResumenCreditos() {
    const [activos, vencidos, pagosHoy] = await Promise.all([
      this.creditoRepository.findActivos(),
      this.creditoRepository.findVencidos(),
      this.getPagosDelDia()
    ])

    const totalPendiente = activos.reduce((sum, c) => sum + Number(c.saldo_pendiente), 0)
    const totalVencido = vencidos.reduce((sum, c) => sum + Number(c.saldo_pendiente), 0)

    return {
      creditosActivos: activos.length,
      creditosVencidos: vencidos.length,
      montoPendiente: totalPendiente,
      montoVencido: totalVencido,
      pagosHoy
    }
  }

  async getResumenInventario() {
    const [inventario, movimientosRecientes] = await Promise.all([
      this.inventarioBodegaRepository.findAll(),
      this.movimientoRepository.getUltimosMovimientos(10)
    ])

    const valorTotal = inventario.reduce(
      (sum, item) => sum + (item.stock_disponible * Number(item.productos?.precio_credito || 0)), 0
    )

    return {
      productosConStock: inventario.length,
      unidadesTotales: inventario.reduce((sum, item) => sum + item.stock_total, 0),
      valorTotal,
      movimientosRecientes
    }
  }

  private async getPagosDelDia() {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    const manana = new Date(hoy)
    manana.setDate(manana.getDate() + 1)

    return this.pagoRepository.findByFecha(hoy, manana)
  }

  async getDashboardCompleto() {
    const [general, creditos, inventario] = await Promise.all([
      this.getResumenGeneral(),
      this.getResumenCreditos(),
      this.getResumenInventario()
    ])

    return {
      general,
      creditos,
      inventario,
      ultimaActualizacion: new Date()
    }
  }
}