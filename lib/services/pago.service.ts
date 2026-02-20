import { PagoRepository } from '../repositories/pago.repository'
import { pagos as Pago } from '@prisma/client'
import { CreditoRepository } from '../repositories/credito.repository'
import { UsuarioRepository } from '../repositories/usuario.repository'
import { CreatePagoDTOType } from '../dto/pagos.dto'
import prisma from '../db'

export class PagoService {
  private pagoRepository: PagoRepository
  private creditoRepository: CreditoRepository
  private usuarioRepository: UsuarioRepository

  constructor() {
    this.pagoRepository = new PagoRepository()
    this.creditoRepository = new CreditoRepository()
    this.usuarioRepository = new UsuarioRepository()
  }

  async getAll() {
    return this.pagoRepository.findAll()
  }

  async getById(id: number) {
    const pago = await this.pagoRepository.findById(id)
    if (!pago) throw new Error('Pago no encontrado')
    return pago
  }

  async registrar(data: CreatePagoDTOType) {
    return await prisma.$transaction(async (tx) => {
      // Validar usuario
      const usuario = await this.usuarioRepository.findById(data.registrado_por)
      if (!usuario) throw new Error('Usuario no encontrado')

      const credito = await tx.creditos.findUnique({
        where: { id_credito: data.id_credito },
        include: {
          credito_detalle: true
        }
      })
      if (!credito) throw new Error('Crédito no encontrado')

      const saldoActual = Number(credito.saldo_pendiente || 0)
      const montoPago = Number(data.monto_pagado || 0)
      if (montoPago > saldoActual) {
        throw new Error('El monto del pago no puede ser mayor al saldo pendiente')
      }

      // Registrar pago
      const pago = await tx.pagos.create({
        data: {
        id_credito: data.id_credito,
        monto_pagado: montoPago,
        fecha_pago: data.fecha_pago ?? new Date(),
        metodo_pago: data.metodo_pago,
        registrado_por: data.registrado_por
        }
      })

      const detallesCredito = credito.credito_detalle || []
      const pagoDetalleModel = (tx as any).pago_detalle_producto
      const soporteDetalleProducto = !!pagoDetalleModel

      if (detallesCredito.length > 0 && soporteDetalleProducto) {

        const distribucionManual = data.detalle_productos && data.detalle_productos.length > 0
          ? data.detalle_productos.map((d) => ({
              id_producto: d.id_producto,
              monto_pagado: Number(d.monto_pagado || 0)
            }))
          : null

        const pagosAnteriores = await pagoDetalleModel.groupBy({
          by: ['id_producto'],
          where: { id_credito: data.id_credito },
          _sum: { monto_pagado: true }
        })
        const pagosPreviosPorProducto = new Map<number, number>(
          pagosAnteriores.map((p: any) => [p.id_producto, Number(p._sum?.monto_pagado || 0)])
        )

        let distribucionFinal: Array<{ id_producto: number; monto_pagado: number }> = []

        if (distribucionManual) {
          const productosPermitidos = new Set(detallesCredito.map((d) => d.id_producto))
          const sumaManual = distribucionManual.reduce((sum, d) => sum + d.monto_pagado, 0)
          if (Math.abs(sumaManual - montoPago) > 0.01) {
            throw new Error('La suma del detalle por producto debe coincidir con el monto total del pago')
          }

          for (const d of distribucionManual) {
            if (!productosPermitidos.has(d.id_producto)) {
              throw new Error(`El producto ${d.id_producto} no pertenece al crédito`)
            }
          }

          distribucionFinal = distribucionManual
        } else {
          const pendientes = detallesCredito.map((d) => {
            const subtotal = Number(d.subtotal || 0)
            const pagadoPrevio = pagosPreviosPorProducto.get(d.id_producto) || 0
            return {
              id_producto: d.id_producto,
              pendiente: Math.max(subtotal - pagadoPrevio, 0)
            }
          })

          const totalPendiente = pendientes.reduce((sum, p) => sum + p.pendiente, 0)
          if (totalPendiente <= 0) {
            throw new Error('No hay saldo pendiente por producto para aplicar el pago')
          }

          let acumulado = 0
          distribucionFinal = pendientes.map((p, idx) => {
            let monto = idx === pendientes.length - 1
              ? Number(Math.max(montoPago - acumulado, 0).toFixed(2))
              : Number(((montoPago * p.pendiente) / totalPendiente).toFixed(2))
            acumulado += monto
            return { id_producto: p.id_producto, monto_pagado: monto }
          })
        }

        for (const d of distribucionFinal) {
          const detalleCredito = detallesCredito.find((dc) => dc.id_producto === d.id_producto)
          const subtotal = Number(detalleCredito?.subtotal || 0)
          const pagadoPrevio = pagosPreviosPorProducto.get(d.id_producto) || 0
          const pagadoNuevo = pagadoPrevio + d.monto_pagado
          if (pagadoNuevo - subtotal > 0.01) {
            throw new Error(`El pago excede el saldo del producto ${d.id_producto}`)
          }
        }

        await pagoDetalleModel.createMany({
          data: distribucionFinal
            .filter((d) => d.monto_pagado > 0)
            .map((d) => ({
              id_pago: pago.id_pago,
              id_credito: data.id_credito,
              id_producto: d.id_producto,
              monto_pagado: d.monto_pagado
            }))
        })
      }

      if (detallesCredito.length > 0 && !soporteDetalleProducto && data.detalle_productos?.length) {
        throw new Error('La base/cliente Prisma no está sincronizada para detalle por producto. Ejecuta prisma generate.')
      }

      // Actualizar saldo y estado del crédito en la misma transacción
      const nuevoSaldo = Math.max(saldoActual - montoPago, 0)
      const nuevoEstado = nuevoSaldo <= 0 ? 'CANCELADO' : credito.estado
      await tx.creditos.update({
        where: { id_credito: data.id_credito },
        data: {
          saldo_pendiente: nuevoSaldo,
          estado: nuevoEstado
        }
      })

      return pago
    })
  }

  async getByCredito(id_credito: number) {
    return this.pagoRepository.findByCredito(id_credito)
  }

  async getByUsuario(registrado_por: number) {
    return this.pagoRepository.findByUsuario(registrado_por)
  }

  async getByFecha(fechaInicio: Date, fechaFin: Date) {
    return this.pagoRepository.findByFecha(fechaInicio, fechaFin)
  }

  async getResumenPorFecha(fechaInicio: Date, fechaFin: Date) {
    return this.pagoRepository.getResumenPorFecha(fechaInicio, fechaFin)
  }

  async getPagosPorCliente(id_cliente: number) {
    const creditos = await this.creditoRepository.findByCliente(id_cliente)
    
    const pagos: Pago[] = []
    for (const credito of creditos) {
      const pagosCredito = await this.pagoRepository.findByCredito(credito.id_credito)
      pagos.push(...pagosCredito)
    }

    return pagos.sort((a, b) => b.fecha_pago.getTime() - a.fecha_pago.getTime())
  }

  async getHistorialPagos(id_credito: number) {
    const credito = await this.creditoRepository.findById(id_credito)
    if (!credito) throw new Error('Crédito no encontrado')

    const pagos = await this.pagoRepository.findByCredito(id_credito)
    
    return {
      credito,
      pagos,
      totalPagado: pagos.reduce((sum, p) => sum + Number(p.monto_pagado), 0),
      saldoRestante: Number(credito.saldo_pendiente),
      porcentajePagado: (pagos.reduce((sum, p) => sum + Number(p.monto_pagado), 0) / Number(credito.monto_total)) * 100
    }
  }
}
