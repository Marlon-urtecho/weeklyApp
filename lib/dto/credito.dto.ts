// dto/credito.dto.ts
import { z } from 'zod'

// ============================================
// DTOs para CREDITO DETALLE
// ============================================

export const createCreditoDetalleDTO = z.object({
    id_producto: z.number().int().positive("ID del producto requerido"),
    cantidad: z.number().int().positive("Cantidad requerida"),
    precio_unitario: z.number().positive("Precio unitario requerido"),
});

export const creditoDetalleResponseDTO = z.object({
    id_detalle: z.number().int().positive(),
    id_credito: z.number().int().positive(),
    id_producto: z.number().int().positive(),
    cantidad: z.number().int().positive(),
    precio_unitario: z.number().positive(),
    subtotal: z.number().positive(),
});

// ============================================
// DTOs para CREDITO
// ============================================

export const createCreditoDTO = z.object({
    id_cliente: z.number().int().positive("ID del cliente requerido"),
    id_vendedor: z.number().int().positive("ID del vendedor requerido"),
    monto_total: z.number().positive("Monto total requerido").optional(),
    cuota: z.number().positive("Cuota requerida"),
    frecuencia_pago: z.string().refine(value => ["SEMANAL", "QUINCENAL", "MENSUAL"].includes(value), {
        message: "Frecuencia de pago inválida. Debe ser SEMANAL, QUINCENAL o MENSUAL"
    }),
    numero_cuotas: z.number().int().positive("Número de cuotas requerido"),
    fecha_inicio: z.date(),
    fecha_vencimiento: z.date(),
    id_usuario_crea: z.number().int().positive("ID del usuario que crea el crédito requerido"),
    productos: z.array(createCreditoDetalleDTO).min(1, "Debe incluir al menos un producto")
});

export const updateCreditoDTO = z.object({
    monto_total: z.number().positive().optional(),
    cuota: z.number().positive().optional(),
    frecuencia_pago: z.string().refine(value => ["SEMANAL", "QUINCENAL", "MENSUAL"].includes(value), {
        message: "Frecuencia de pago inválida. Debe ser SEMANAL, QUINCENAL o MENSUAL"
    }).optional(),
    numero_cuotas: z.number().int().positive().optional(),
    saldo_pendiente: z.number().positive().optional(),
    estado: z.string().refine(value => ["ACTIVO", "MOROSO", "PAGADO", "CANCELADO"].includes(value), {
        message: "Estado inválido. Debe ser ACTIVO, MOROSO, PAGADO o CANCELADO"
    }).optional(),
    fecha_vencimiento: z.date().optional(),
});

export const creditoResponseDTO = z.object({
    id_credito: z.number().int().positive(),
    id_cliente: z.number().int().positive(),
    id_vendedor: z.number().int().positive(),
    monto_total: z.number().positive(),
    cuota: z.number().positive(),
    frecuencia_pago: z.string(),
    numero_cuotas: z.number().int().positive(),
    saldo_pendiente: z.number().positive(),
    estado: z.string(),
    fecha_inicio: z.date(),
    fecha_vencimiento: z.date(),
    created_at: z.date(),
    updated_at: z.date(),
    id_usuario_crea: z.number().int().positive(),
});

// ============================================
// TIPOS (exports)
// ============================================

export type CreateCreditoDTO = z.infer<typeof createCreditoDTO>;
export type UpdateCreditoDTO = z.infer<typeof updateCreditoDTO>;
export type CreditoResponseDTO = z.infer<typeof creditoResponseDTO>;
export type CreateCreditoDetalleDTO = z.infer<typeof createCreditoDetalleDTO>;
export type CreditoDetalleResponseDTO = z.infer<typeof creditoDetalleResponseDTO>;

// Alias para compatibilidad
export type CreateCreditoDTOType = CreateCreditoDTO;
export type UpdateCreditoDTOType = UpdateCreditoDTO;
export type CreateCreditoDetalleDTOType = CreateCreditoDetalleDTO;