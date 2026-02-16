import {z} from 'zod'
import { id } from 'zod/v4/locales'

// DTO para crear ruta
export const createRutaDTO = z.object({
    id_ruta: z.number().int().positive("ID de la ruta requerido"),
    id_vendedor: z.number().int().positive("ID del vendedor requerido"),
    codigo_ruta: z.string().min(3).max(100),
    nombre_ruta: z.string().min(3).max(100),
    zona: z.string().min(3).max(100),
    activo: z.boolean().default(true).optional(),
})

// DTO para actualizar ruta
export const updateRutaDTO = z.object({
    nombre_ruta: z.string().min(3).max(100).optional(),
    codigo_ruta: z.string().min(3).max(100).optional(),
    zona: z.string().min(3).max(100).optional(),
    activo: z.boolean().optional()
})

// DTO para obtener ruta
export const rutaResponseDTO = z.object({
    id_ruta: z.number().int().positive(),
    id_vendedor: z.number().int().positive(),
    nombre_ruta: z.string(),
    zona: z.string(),
    activo: z.boolean()
})

// DTO para obtener lista de rutas
export const rutaListResponseDTO = z.array(rutaResponseDTO)

export type CreateRutaDTOType = z.infer<typeof createRutaDTO>
export type UpdateRutaDTOType = z.infer<typeof updateRutaDTO>
export type RutaResponseDTOType = z.infer<typeof rutaResponseDTO>
export type RutaListResponseDTOType = z.infer<typeof rutaListResponseDTO>