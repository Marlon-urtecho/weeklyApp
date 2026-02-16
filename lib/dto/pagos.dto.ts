import {z} from 'zod'

// DTO para crear pago
export const createPagoDTO = z.object({
    id_pago: z.number().int().positive("ID del pago requerido"),
    id_credito: z.number().int().positive("ID del credito requerido"),
    monto_pagado: z.number().positive("Monto pagado requerido"),
    fecha_pago: z.date(),
    metodo_pago: z.string().min(3).max(100),
    registrado_por: z.number().int().positive("ID del usuario que registra el pago requerido"),
    created_at: z.date().optional()
})

// DTO para actualizar pago
export const updatePagoDTO = z.object({
    monto_pagado: z.number().positive().optional(),
    fecha_pago: z.date().optional(),
    metodo_pago: z.string().min(3).max(100).optional(),
    registrado_por: z.number().int().positive("ID del usuario que registra el pago requerido").optional(),
    updated_at: z.date().optional()
})

// DTO para obtener pago
export const pagoResponseDTO = z.object({
    id_pago: z.number().int().positive(),
    id_credito: z.number().int().positive(),
    monto_pagado: z.number().positive(),
    fecha_pago: z.date(),
    metodo_pago: z.string(),
    registrado_por: z.number().int().positive(),
    created_at: z.date(),
    updated_at: z.date()
})

// DTO para obtener lista de pagos
export const pagoListResponseDTO = z.array(pagoResponseDTO)

export type CreatePagoDTOType = z.infer<typeof createPagoDTO>
export type UpdatePagoDTOType = z.infer<typeof updatePagoDTO>
export type PagoResponseDTOType = z.infer<typeof pagoResponseDTO>
export type PagoListResponseDTOType = z.infer<typeof pagoListResponseDTO>