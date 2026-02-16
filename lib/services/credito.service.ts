import { CreditoRepository } from '../repositories/credito.repository'
import { CreditoDetalleRepository } from '../repositories/credito-detalle.repository'
import { ClienteRepository } from '../repositories/cliente.repository'
import { VendedorRepository } from '../repositories/vendedor.repository'
import { ProductoRepository } from '../repositories/producto.respository'
import { CreateCreditoDTOType, UpdateCreditoDTOType } from '../dto/credito.dto'
import prisma from '../db'

export class CreditoService {
  private creditoRepository: CreditoRepository
  private creditoDetalleRepository: CreditoDetalleRepository
  private clienteRepository: ClienteRepository
  private vendedorRepository: VendedorRepository
  private productoRepository: ProductoRepository

  constructor() {
    this.creditoRepository = new CreditoRepository()
    this.creditoDetalleRepository = new CreditoDetalleRepository()
    this.clienteRepository = new ClienteRepository()
    this.vendedorRepository = new VendedorRepository()
    this.productoRepository = new ProductoRepository()
  }

  async getAll() {
    return this.creditoRepository.findAll()
  }

  async getById(id: number) {
    const credito = await this.creditoRepository.findByIdWithAll(id)
    if (!credito) throw new Error('Crédito no encontrado')
    return credito
  }

  async create(data: CreateCreditoDTOType) {
    return await prisma.$transaction(async (tx) => {
      // Validar cliente
      const cliente = await this.clienteRepository.findById(data.id_cliente)
      if (!cliente) throw new Error('Cliente no encontrado')

      // Validar vendedor
      const vendedor = await this.vendedorRepository.findById(data.id_vendedor)
      if (!vendedor) throw new Error('Vendedor no encontrado')

      // Crear crédito
      const credito = await this.creditoRepository.create({
        id_cliente: data.id_cliente,
        id_vendedor: data.id_vendedor,
        monto_total: data.monto_total,
        cuota: data.cuota,
        frecuencia_pago: data.frecuencia_pago,
        numero_cuotas: data.numero_cuotas,
        saldo_pendiente: data.monto_total,
        estado: 'ACTIVO',
        fecha_inicio: data.fecha_inicio,
        fecha_vencimiento: data.fecha_vencimiento,
        id_usuario_crea: data.id_usuario_crea
      })

      // Crear detalles del crédito (productos)
      if (data.productos && data.productos.length > 0) {
        for (const item of data.productos) {
          await this.creditoDetalleRepository.agregarProducto({
            id_credito: credito.id_credito,
            id_producto: item.id_producto,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.cantidad * item.precio_unitario
          })
        }
      }

      return credito
    })
  }

  async update(id: number, data: UpdateCreditoDTOType) {
    const credito = await this.creditoRepository.findById(id)
    if (!credito) throw new Error('Crédito no encontrado')

    return this.creditoRepository.update(id, data)
  }

  async getByCliente(id_cliente: number) {
    return this.creditoRepository.findByCliente(id_cliente)
  }

  async getByVendedor(id_vendedor: number) {
    return this.creditoRepository.findByVendedor(id_vendedor)
  }

  async getActivos() {
    return this.creditoRepository.findActivos()
  }

  async getVencidos() {
    return this.creditoRepository.findVencidos()
  }

  async marcarMorosos() {
    const vencidos = await this.getVencidos()
    
    for (const credito of vencidos) {
      await this.creditoRepository.update(credito.id_credito, {
        estado: 'MOROSO'
      })
    }

    return vencidos.length
  }
}