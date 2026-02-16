import { PagoRepository } from '../repositories/pago.repository'
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

      // Registrar pago
      const pago = await this.pagoRepository.create({
        id_credito: data.id_credito,
        monto_pagado: data.monto_pagado,
        metodo_pago: data.metodo_pago,
        registrado_por: data.registrado_por
      })

      // Actualizar saldo del crédito
      await this.creditoRepository.updateSaldo(data.id_credito, data.monto_pagado)

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
    
    const pagos = []
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