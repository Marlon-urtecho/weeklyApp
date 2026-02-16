import {z} from 'zod'

//Dto para crear movimiento
export const createMovimientoDTO = z.object({
    id_tipo_movimiento: z.number().int().positive("ID del tipo de movimiento requerido"),
    nombre_tipo: z.string().min(3).max(100),
    factor : z.number().positive("Factor requerido"),
    descripcion: z.string().min(3).max(255),
})

//Dto para actualizar movimiento
export const updateMovimientoDTO = z.object({
    nombre_tipo: z.string().min(3).max(100).optional(),
    factor : z.number().positive().optional(),
    descripcion: z.string().min(3).max(255).optional(),
})

//Dto para obtener movimiento
export const movimientoResponseDTO = z.object({
    id_tipo_movimiento: z.number().int().positive(),
    nombre_tipo: z.string(),
    factor : z.number().positive(),
    descripcion: z.string(),
})

//Dto para obtener lista de movimientos
export const movimientoListResponseDTO = z.array(movimientoResponseDTO)

//Tipos de datos para movimientos
export type CreateMovimientoDTO = z.infer<typeof createMovimientoDTO>
export type UpdateMovimientoDTO = z.infer<typeof updateMovimientoDTO>
export type MovimientoResponseDTO = z.infer<typeof movimientoResponseDTO>
export type MovimientoListResponseDTO = z.infer<typeof movimientoListResponseDTO>

//DTO para Movieminto de inventario
export const createMovimientoInventarioDTO = z.object({
    id_movimiento: z.number().int().positive("ID del movimiento requerido"),
    id_producto: z.number().int().positive("ID del producto requerido"),
    id_tipo_movimiento: z.number().int().positive("ID del tipo de movimiento requerido"),
    cantidad: z.number().int().positive("Cantidad requerida"),
    origen: z.string().min(3).max(100),
    destino: z.string().min(3).max(100),
    observacion: z.string().min(3).max(255).optional(),
    fecha_movimiento: z.date().optional(),
    id_usuario_registra: z.number().int().positive("ID del usuario que registra el movimiento requerido"),
})

export const updateMovimientoInventarioDTO = z.object({
    cantidad: z.number().int().positive().optional(),
    origen: z.string().min(3).max(100).optional(),
    destino: z.string().min(3).max(100).optional(),
    observacion: z.string().min(3).max(255).optional(),
    fecha_movimiento: z.date().optional(),
    id_usuario_registra: z.number().int().positive("ID del usuario que registra el movimiento requerido").optional(),
})

export const movimientoInventarioResponseDTO = z.object({
    id_movimiento: z.number().int().positive(),
    id_producto: z.number().int().positive(),
    id_tipo_movimiento: z.number().int().positive(),
    cantidad: z.number().int().positive(),
    origen: z.string().min(3).max(100),
    destino: z.string().min(3).max(100),
    observacion: z.string().min(3).max(255).optional(),
    fecha_movimiento: z.date().optional(),
    id_usuario_registra: z.number().int().positive(),
})

export const movimientoInventarioListResponseDTO = z.array(movimientoInventarioResponseDTO)

//tipos de datos para movimiento de inventario
export type CreateMovimientoInventarioDTO = z.infer<typeof createMovimientoInventarioDTO>
export type UpdateMovimientoInventarioDTO = z.infer<typeof updateMovimientoInventarioDTO>
export type MovimientoInventarioResponseDTO = z.infer<typeof movimientoInventarioResponseDTO>
export type MovimientoInventarioListResponseDTO = z.infer<typeof movimientoInventarioListResponseDTO>

