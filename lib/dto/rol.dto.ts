import {z} from 'zod'
import { id } from 'zod/v4/locales'

//Dto para crear un nuevo rol
export const CreateRolDTO = z.object({
    id_rol: z.number().optional(),
    nombre_rol: z.string().min(3, 'El nombre del rol debe tener al menos 3 caracteres'),
})

//Dto para actualizar un rol existente
export const UpdateRolDTO = z.object({
    id_rol: z.number(),
    nombre_rol: z.string().min(3, 'El nombre del rol debe tener al menos 3 caracteres').optional(),
})

export type CreateRolDTOType = z.infer<typeof CreateRolDTO>
export type UpdateRolDTOType = z.infer<typeof UpdateRolDTO>

//Dtos para usuario rol
export const UserRolDTO = z.object({
    id_usuario: z.number(),
    id_rol: z.number(),
})

export type UserRolDTOType = z.infer<typeof UserRolDTO>