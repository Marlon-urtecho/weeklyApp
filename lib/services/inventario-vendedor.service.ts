import { InventarioVendedorRepository } from '../repositories/inventario-vendedor.repository'
import { VendedorRepository } from '../repositories/vendedor.repository'
import { ProductoRepository } from '../repositories/producto.respository'
import { AsignarProductoVendedorDTOType } from '../dto/inventario.dto'

export class InventarioVendedorService {
  private inventarioVendedorRepository: InventarioVendedorRepository
  private vendedorRepository: VendedorRepository
  private productoRepository: ProductoRepository

  constructor() {
    this.inventarioVendedorRepository = new InventarioVendedorRepository()
    this.vendedorRepository = new VendedorRepository()
    this.productoRepository = new ProductoRepository()
  }

  async getByVendedor(id_vendedor: number) {
    const vendedor = await this.vendedorRepository.findById(id_vendedor)
    if (!vendedor) throw new Error('Vendedor no encontrado')

    return this.inventarioVendedorRepository.getInventarioByVendedor(id_vendedor)
  }

  async asignarProducto(data: AsignarProductoVendedorDTOType) {
    const vendedor = await this.vendedorRepository.findById(data.id_vendedor)
    if (!vendedor) throw new Error('Vendedor no encontrado')

    const producto = await this.productoRepository.findById(data.id_producto)
    if (!producto) throw new Error('Producto no encontrado')

    return this.inventarioVendedorRepository.asignarProducto(
      data.id_vendedor,
      data.id_producto,
      data.cantidad
    )
  }

  async retirarProducto(id_vendedor: number, id_producto: number, cantidad: number) {
    const vendedor = await this.vendedorRepository.findById(id_vendedor)
    if (!vendedor) throw new Error('Vendedor no encontrado')

    return this.inventarioVendedorRepository.retirarProducto(id_vendedor, id_producto, cantidad)
  }

  async getValorTotalInventario(id_vendedor: number) {
    return this.inventarioVendedorRepository.getValorTotalInventario(id_vendedor)
  }

  async verificarStock(id_vendedor: number, id_producto: number, cantidad: number) {
    const inventario = await this.inventarioVendedorRepository.findByVendedorYProducto(
      id_vendedor,
      id_producto
    )

    return inventario && inventario.cantidad >= cantidad
  }
}