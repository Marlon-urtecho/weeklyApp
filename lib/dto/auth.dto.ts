import { z } from 'zod'

// Zod valida los datos antes de procesarlos
export const LoginDTO = z.object({
  username: z.string()
    .min(3, 'Usuario debe tener al menos 3 caracteres')
    .max(50, 'Usuario muy largo'),
  password: z.string()
    .min(6, 'Contraseña debe tener al menos 6 caracteres')
})

export const RegisterDTO = z.object({
  nombre: z.string().min(2, 'Nombre muy corto'),
  username: z.string().min(3, 'Usuario muy corto'),
  password: z.string().min(6, 'Contraseña muy corta'),
  roles: z.array(z.number()).optional()
})

export type LoginDTOType = z.infer<typeof LoginDTO>
export type RegisterDTOType = z.infer<typeof RegisterDTO>