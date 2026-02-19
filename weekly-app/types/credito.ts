export interface CreditoCliente {
  id_cliente: number
  codigo_cliente: string
  nombre: string
  id_ruta?: number
}

export interface CreditoVendedor {
  id_vendedor: number
  nombre: string
}

export interface CreditoDetalleItem {
  id_detalle?: number
  id_producto: number
  cantidad: number
  precio_unitario: number
  subtotal: number
  productos?: {
    id_producto: number
    nombre: string
    categorias?: {
      id_categoria: number
      nombre_categoria: string
    }
  }
}

export interface PagoDetalleProducto {
  id_pago_detalle?: number
  id_producto: number
  monto_pagado: number
  productos?: {
    id_producto: number
    nombre: string
  }
}

export interface PagoCredito {
  id_pago: number
  monto_pagado: number
  fecha_pago: string
  metodo_pago?: string | null
  usuarios?: {
    id_usuario: number
    nombre: string
  }
  pago_detalle_producto?: PagoDetalleProducto[]
}

export interface Credito {
  id_credito: number
  id_cliente: number
  id_vendedor: number
  monto_total: number
  saldo_pendiente: number
  cuota: number
  frecuencia_pago: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | string
  numero_cuotas: number
  estado: 'ACTIVO' | 'MOROSO' | 'PAGADO' | 'CANCELADO' | string
  fecha_inicio: string
  fecha_vencimiento: string
  created_at?: string
  updated_at?: string
  clientes?: CreditoCliente
  vendedores?: CreditoVendedor
  credito_detalle?: CreditoDetalleItem[]
  pagos?: PagoCredito[]
}
