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

  private async registrarSalidaInventarioCredito(
    tx: any,
    credito: { id_credito: number; id_cliente: number; id_vendedor: number; id_usuario_crea: number },
    productos: Array<{ id_producto: number; cantidad: number }>
  ) {
    if (!productos.length) return

    const tipoSalida = await tx.tipo_movimiento.findFirst({
      where: {
        nombre_tipo: {
          equals: 'SALIDA',
          mode: 'insensitive'
        }
      }
    })

    for (const item of productos) {
      const inv = await tx.inventario_vendedor.findUnique({
        where: {
          id_vendedor_id_producto: {
            id_vendedor: credito.id_vendedor,
            id_producto: item.id_producto
          }
        }
      })

      if (!inv || Number(inv.cantidad) < Number(item.cantidad)) {
        throw new Error(`Stock insuficiente del vendedor para producto ${item.id_producto}`)
      }

      if (Number(inv.cantidad) === Number(item.cantidad)) {
        await tx.inventario_vendedor.delete({
          where: {
            id_vendedor_id_producto: {
              id_vendedor: credito.id_vendedor,
              id_producto: item.id_producto
            }
          }
        })
      } else {
        await tx.inventario_vendedor.update({
          where: {
            id_vendedor_id_producto: {
              id_vendedor: credito.id_vendedor,
              id_producto: item.id_producto
            }
          },
          data: {
            cantidad: { decrement: Number(item.cantidad) }
          }
        })
      }

      if (tipoSalida) {
        await tx.movimientos_inventario.create({
          data: {
            id_producto: item.id_producto,
            id_tipo_movimiento: tipoSalida.id_tipo_movimiento,
            cantidad: Number(item.cantidad),
            origen: `VENDEDOR_${credito.id_vendedor}`,
            destino: `CLIENTE_${credito.id_cliente}`,
            referencia: `CREDITO_${credito.id_credito}`,
            observacion: `Salida por crédito #${credito.id_credito}`,
            id_usuario_registra: credito.id_usuario_crea
          }
        })
      }
    }
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
      const cliente = await tx.clientes.findUnique({
        where: { id_cliente: data.id_cliente }
      })
      if (!cliente) throw new Error('Cliente no encontrado')

      // Validar vendedor
      const vendedor = await tx.vendedores.findUnique({
        where: { id_vendedor: data.id_vendedor }
      })
      if (!vendedor) throw new Error('Vendedor no encontrado')

      // Calcular monto total si no viene en el DTO
      const calculatedTotal = data.monto_total ?? data.productos.reduce((acc, curr) => acc + (curr.cantidad * curr.precio_unitario), 0)

      // Crear crédito
      const credito = await tx.creditos.create({
        data: {
        id_cliente: data.id_cliente,
        id_vendedor: data.id_vendedor,
        monto_total: calculatedTotal,
        cuota: data.cuota,
        frecuencia_pago: data.frecuencia_pago,
        numero_cuotas: data.numero_cuotas,
        saldo_pendiente: calculatedTotal,
        estado: 'ACTIVO',
        fecha_inicio: data.fecha_inicio,
        fecha_vencimiento: data.fecha_vencimiento,
        id_usuario_crea: data.id_usuario_crea
        }
      })

      // Crear detalles del crédito (productos)
      if (data.productos && data.productos.length > 0) {
        for (const item of data.productos) {
          await tx.credito_detalle.create({
            data: {
              id_credito: credito.id_credito,
              id_producto: item.id_producto,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
              subtotal: item.cantidad * item.precio_unitario
            }
          })
        }

        // Regla de negocio: toda venta a crédito descuenta inventario del vendedor.
        await this.registrarSalidaInventarioCredito(
          tx,
          {
            id_credito: credito.id_credito,
            id_cliente: data.id_cliente,
            id_vendedor: data.id_vendedor,
            id_usuario_crea: data.id_usuario_crea
          },
          data.productos.map((p) => ({
            id_producto: p.id_producto,
            cantidad: p.cantidad
          }))
        )
      }

      return credito
    })
  }

  async update(id: number, data: UpdateCreditoDTOType) {
    return prisma.$transaction(async (tx) => {
      const credito = await tx.creditos.findUnique({
        where: { id_credito: id },
        include: {
          credito_detalle: true
        }
      })
      if (!credito) throw new Error('Crédito no encontrado')

      // Compatibilidad con créditos antiguos: si pasan a CANCELADO y aún no existe salida registrada,
      // descuenta inventario del vendedor según detalle del crédito.
      if (data.estado === 'CANCELADO' && credito.estado !== 'CANCELADO') {
        const existingOut = await tx.movimientos_inventario.findFirst({
          where: {
            referencia: `CREDITO_${credito.id_credito}`
          }
        })

        if (!existingOut && Array.isArray(credito.credito_detalle) && credito.credito_detalle.length > 0) {
          await this.registrarSalidaInventarioCredito(
            tx,
            {
              id_credito: credito.id_credito,
              id_cliente: credito.id_cliente,
              id_vendedor: credito.id_vendedor,
              id_usuario_crea: credito.id_usuario_crea
            },
            credito.credito_detalle.map((d: any) => ({
              id_producto: d.id_producto,
              cantidad: d.cantidad
            }))
          )
        }
      }

      const updateData: any = { ...data }
      if (data.fecha_vencimiento) {
        updateData.fecha_vencimiento = new Date(data.fecha_vencimiento as any)
      }
      return tx.creditos.update({
        where: { id_credito: id },
        data: updateData
      })
    })
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
