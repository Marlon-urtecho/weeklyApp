import { z } from 'zod'

export const createTipoMovimientoDTO = z.object({
  nombre_tipo: z.string().min(3, 'Nombre requerido').max(100),
  factor: z.number().int().refine((value) => value >= -1 && value <= 1, {
    message: 'El factor debe ser -1, 0 o 1'
  }),
  descripcion: z.string().max(255).optional(),
  activo: z.boolean().optional().default(true)
})

export const updateTipoMovimientoDTO = z.object({
  nombre_tipo: z.string().min(3, 'Nombre requerido').max(100).optional(),
  factor: z.number().int().refine((value) => value >= -1 && value <= 1, {
    message: 'El factor debe ser -1, 0 o 1'
  }).optional(),
  descripcion: z.string().max(255).nullable().optional(),
  activo: z.boolean().optional()
})

export type CreateTipoMovimientoDTOType = z.infer<typeof createTipoMovimientoDTO>
export type UpdateTipoMovimientoDTOType = z.infer<typeof updateTipoMovimientoDTO>
