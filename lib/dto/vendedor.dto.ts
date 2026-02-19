import { z } from 'zod'

//dto para crear vendedor 
export const CreateVendedorDto = z.object({
    id_usuario: z.number().int().positive("ID de usuario invalido").optional().nullable(),
    nombre: z.string()
    .min(3, "Minimimode 3 caracteres")
    .max(100, "Maximo de 100 caracteres"),
    telefono: z.string()
    .min(7, "Minimo de 7 caracteres")
    .max(20, "Maximo de 15 caracteres"),
    activo: z.boolean().default(true).optional(),
    created_at: z.date().optional(),
    updated_at: z.date().optional()
})

// para actualizar vendedor
export const UpdateVendedoresDTO = z.object({
    nombre: z.string().min(3).max(100).optional(),
    telefono: z.string().min(8).max(100).optional(),
    activo: z.boolean().optional()

})

// para obtener vendedor
export const VendedorResponseDTO = z.object({
    id_vendedor: z.number().int().positive(),
    id_usuario: z.number().int().positive().optional().nullable(),
    nombre: z.string(),
    telefono: z.string(),
    activo: z.boolean()
})

// para obtener lista de vendedores
export const VendedorListResponseDTO = z.array(VendedorResponseDTO)

// para eliminar vendedor
export const DeleteVendedorDTO = z.object({
    id_vendedor: z.number().int().positive()
})

export type CreateVendedorDTOType = z.infer<typeof CreateVendedorDto>
export type UpdateVendedorDTOType = z.infer<typeof UpdateVendedoresDTO>
export type VendedorResponseDTOType = z.infer<typeof VendedorResponseDTO>
export type VendedorListResponseDTOType = z.infer<typeof VendedorListResponseDTO>
export type DeleteVendedorDTOType = z.infer<typeof DeleteVendedorDTO>
