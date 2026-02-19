import { z } from 'zod'

// DTO para crear categoria
export const createcategoriaDTO = z.object({
  nombre_categoria: z.string().min(3, 'almenos 3 caracteres requeridos').max(100),
  descripcion: z.string().min(3, 'almenos 3 caracteres requeridos').max(255).optional(),
  activo: z.boolean().default(true).optional()
})

// DTO para actualizar categoria
export const updatecategoriaDTO = z.object({
  nombre_categoria: z.string().min(3, 'almenos 3 caracteres requeridos').max(100).optional(),
  descripcion: z.string().min(3, 'almenos 3 caracteres requeridos').max(255).optional(),
  activo: z.boolean().optional()
})


// DTO para obtener categoria
export const categoriaResponseDTO = z.object({
  id_categoria: z.number().int().positive(),
  nombre_categoria: z.string(),
  descripcion: z.string().nullable().optional(),
  activo: z.boolean()
})

// DTO para obtener lista de categorias
export const categoriaListResponsivedTO = z.array(categoriaResponseDTO)


export type createcategoriaDTOType = z.infer<typeof createcategoriaDTO>
export type updatecategoriaDTOType = z.infer<typeof updatecategoriaDTO>
export type categoriaResponseDTOType = z.infer<typeof categoriaResponseDTO>
export type categoriaListResponseDTOType = z.infer<typeof categoriaListResponsivedTO>
