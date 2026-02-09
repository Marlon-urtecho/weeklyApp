import { z } from 'zod'

export const CreateUsuarioDTO = z.object({
  nombre: z.string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  username: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos'),
  password: z.string()
    .min(6, 'Mínimo 6 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  activo: z.boolean().default(true),
  roles: z.array(z.number()).optional()
})

export const UpdateUsuarioDTO = z.object({
  nombre: z.string().min(2).max(100).optional(),
  username: z.string().min(3).max(50).optional(),
  activo: z.boolean().optional(),
  roles: z.array(z.number()).optional()
})

export type CreateUsuarioDTOType = z.infer<typeof CreateUsuarioDTO>
export type UpdateUsuarioDTOType = z.infer<typeof UpdateUsuarioDTO>