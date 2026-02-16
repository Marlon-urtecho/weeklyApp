import { create } from 'node:domain'
import {z} from 'zod'
import { id } from 'zod/v4/locales'

// DTO para crear producto
export const createProductoDTO = z.object({
    id_producto: z.number().int().positive("ID del producto requerido"),
    id_categoria: z.number().int().positive("ID de la categoria requerido"),
    nombre: z.string().min(3).max(100),
    precio_contado: z.number().positive("Precio contado requerido"),
    precio_credito: z.number().positive("precio credito requerido"),
    created_at: z.date().optional(),
    updated_at: z.date().optional()
})

// DTO para actualizar producto
export const updateProductoDTO = z.object({
    nombre: z.string().min(3).max(100).optional(),
    precio_contado: z.number().positive().optional(),
    precio_credito: z.number().positive().optional(),
    created_at: z.date().optional(),
    updated_at: z.date().optional()
})

// DTO para obtener producto
export const productoResponseDTO = z.object({
    id_producto: z.number().int().positive(),
    id_categoria: z.number().int().positive(),
    nombre: z.string(),
    precio_contado: z.number().positive(),
    precio_credito: z.number().positive()
})

// DTO para obtener lista de productos
export const productoListResponseDTO = z.array(productoResponseDTO)

export type CreateProductoDTOType = z.infer<typeof createProductoDTO>
export type UpdateProductoDTOType = z.infer<typeof updateProductoDTO>
export type ProductoResponseDTOType = z.infer<typeof productoResponseDTO>
export type ProductoListResponseDTOType = z.infer<typeof productoListResponseDTO>