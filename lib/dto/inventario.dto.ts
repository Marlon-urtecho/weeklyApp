import {z} from 'zod'

//dto para crear inventario de Bodega 
export const createInevtarioDTO = z.object({
    id_inventario: z.number().int().positive("ID del inventario requerido"),
    id_producto: z.number().int().positive("ID del producto requerido"),
    stock_total: z.number().int().positive("Stock total requerido"),
    stock_disponible: z.number().int().positive("Stock disponible requerido"),
    updated_at: z.date().optional(),
})

//Dto para actualizar invetario de bodega 
export const updateInventarioDTO = z.object({
    stock_total: z.number().int().positive().optional(),
    stock_disponible: z.number().int().positive().optional(),
    updated_at: z.date().optional(),
})  

// DTO para obtener inventario de bodega
export const inventarioResponseDTO = z.object({
    id_inventario: z.number().int().positive(),
    id_producto: z.number().int().positive(),
    stock_total: z.number().int().positive(),
    stock_disponible: z.number().int().positive(),
    updated_at: z.date().optional(),
})

// DTO para obtener lista de inventarios de bodega
export const inventarioListResponseDTO = z.array(inventarioResponseDTO)


//Tipos de datos para inventario de bodega
export type CreateInventarioDTO = z.infer<typeof createInevtarioDTO>
export type UpdateInventarioBodegaDTOType = z.infer<typeof updateInventarioDTO>
export type InventarioResponseDTO = z.infer<typeof inventarioResponseDTO>
export type InventarioListResponseDTO = z.infer<typeof inventarioListResponseDTO>


//DTO para inventario de Vendedor
export const createInventarioVendedorDTO = z.object({
    id_vendedor: z.number().int().positive("ID del vendedor requerido"),
    id_producto: z.number().int().positive("ID del producto requerido"),
    cantidad: z.number().int().positive("Cantidad requerida"),
    fecha_asignacion: z.date().optional(),
    updated_at: z.date().optional(),
})

export const updateInventarioVendedorDTO = z.object({
    cantidad: z.number().int().positive().optional(),
    updated_at: z.date().optional(),
})

export const inventarioVendedorResponseDTO = z.object({
    id: z.number().int().positive(),
    id_vendedor: z.number().int().positive(),
    id_producto: z.number().int().positive(),
    cantidad: z.number().int().positive(),
    fecha_asignacion: z.date().optional(),
    updated_at: z.date().optional(),
})

export const inventarioVendedorListResponseDTO = z.array(inventarioVendedorResponseDTO)

export type AsignarProductoVendedorDTOType = z.infer<typeof createInventarioVendedorDTO>
export type UpdateInventarioVendedorDTOType = z.infer<typeof updateInventarioVendedorDTO>
export type InventarioVendedorResponseDTOType = z.infer<typeof inventarioVendedorResponseDTO>
export type InventarioVendedorListResponseDTOType = z.infer<typeof inventarioVendedorListResponseDTO>


//Dto para crear movimiento (tipo de movimiento)
export const createMovimientoDTO = z.object({
    id_tipo_movimiento: z.number().int().positive("ID del tipo de movimiento requerido"),
    nombre_tipo: z.string().min(3).max(100),
    factor: z.union([z.literal(1), z.literal(-1)]),
    descripcion: z.string().min(3).max(255),
})

//Dto para actualizar movimiento
export const updateMovimientoDTO = z.object({
    nombre_tipo: z.string().min(3).max(100).optional(),
    factor: z.union([z.literal(1), z.literal(-1)]).optional(),
    descripcion: z.string().min(3).max(255).optional(),
})

//Dto para obtener movimiento (tipo de movimiento)
export const movimientoResponseDTO = z.object({
    id_tipo_movimiento: z.number().int().positive(),
    nombre_tipo: z.string(),
    factor: z.union([z.literal(1), z.literal(-1)]),
    descripcion: z.string(),
})

export const movimientoListResponseDTO = z.array(movimientoResponseDTO)

//Tipos de datos para movimientos
export type CreateMovimientoInventarioDTO = z.infer<typeof createMovimientoDTO>
export type UpdateMovimientoInventarioDTO = z.infer<typeof updateMovimientoDTO>
export type MovimientoResponseDTOType = z.infer<typeof movimientoResponseDTO>
export type MovimientoListResponseDTO = z.infer<typeof movimientoListResponseDTO>
