import { z } from 'zod'

const toDate = z.preprocess((value) => {
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? undefined : date
  }
  return undefined
}, z.date())

// DTO para crear pago
export const createPagoDTO = z.object({
  id_credito: z.number().int().positive('ID del credito requerido'),
  monto_pagado: z.number().positive('Monto pagado requerido'),
  fecha_pago: toDate.optional(),
  metodo_pago: z.string().min(3).max(100).optional(),
  registrado_por: z.number().int().positive('ID del usuario que registra el pago requerido'),
  detalle_productos: z.array(
    z.object({
      id_producto: z.number().int().positive('ID del producto requerido'),
      monto_pagado: z.number().positive('Monto por producto requerido')
    })
  ).optional()
})

// DTO para actualizar pago
export const updatePagoDTO = z.object({
  monto_pagado: z.number().positive().optional(),
  fecha_pago: toDate.optional(),
  metodo_pago: z.string().min(3).max(100).optional(),
  registrado_por: z.number().int().positive('ID del usuario que registra el pago requerido').optional()
})

// DTO para obtener pago
export const pagoResponseDTO = z.object({
  id_pago: z.number().int().positive(),
  id_credito: z.number().int().positive(),
  monto_pagado: z.number().positive(),
  fecha_pago: z.date(),
  metodo_pago: z.string().nullable().optional(),
  registrado_por: z.number().int().positive(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
})

// DTO para obtener lista de pagos
export const pagoListResponseDTO = z.array(pagoResponseDTO)

export type CreatePagoDTOType = z.infer<typeof createPagoDTO>
export type UpdatePagoDTOType = z.infer<typeof updatePagoDTO>
export type PagoResponseDTOType = z.infer<typeof pagoResponseDTO>
export type PagoListResponseDTOType = z.infer<typeof pagoListResponseDTO>
