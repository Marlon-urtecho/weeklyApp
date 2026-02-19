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

export const RefreshTokenDTO = z.object({
  refresh_token: z.string().min(10, 'Refresh token inválido')
})

export const ForgotPasswordDTO = z.object({
  username: z.string().min(3, 'Usuario inválido'),
  email: z.string().email('Correo inválido')
})

export const ResetPasswordDTO = z.object({
  username: z.string().min(3, 'Usuario inválido'),
  code: z.string().regex(/^\d{6}$/, 'El código debe tener 6 dígitos'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
})

export type LoginDTOType = z.infer<typeof LoginDTO>
export type RegisterDTOType = z.infer<typeof RegisterDTO>
export type RefreshTokenDTOType = z.infer<typeof RefreshTokenDTO>
export type ForgotPasswordDTOType = z.infer<typeof ForgotPasswordDTO>
export type ResetPasswordDTOType = z.infer<typeof ResetPasswordDTO>
