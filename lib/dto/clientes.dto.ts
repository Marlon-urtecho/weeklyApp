import { z } from 'zod'

// DTO para crear Cliente 
export const createClienteDTO = z.object({
  id_ruta: z.number().int().positive('ID de la ruta requerido'),
  codigo_cliente: z.string().min(3).max(100),
  nombre: z.string().min(3, 'Nombre debe tener al menos 3 caracteres').max(100),
  direccion: z.string().min(3, 'Direccion debe tener al menos 3 caracteres').max(255).optional().nullable(),
  telefono: z.string().min(7, 'Telefono debe tener al menos 7 caracteres').max(20).optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable(),
  activo: z.boolean().default(true).optional()
})

//DTO para actulizar cliente 
export const updateClienteDTO = z.object({
  id_ruta: z.number().int().positive().optional(),
  codigo_cliente: z.string().min(3).max(100).optional(),
  nombre: z.string().min(3, 'Nombre debe tener al menos 3 caracteres').max(100).optional(),
  direccion: z.string().min(3, 'Direccion debe tener al menos 3 caracteres').max(255).optional().nullable(),
  telefono: z.string().min(7, 'Telefono debe tener al menos 7 caracteres').max(20).optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable(),
  activo: z.boolean().optional()
})

// DTO para obtener cliente
export const clienteResponseTDO = z.object({
  id_cliente: z.number().int().positive('ID del cliente requerido'),
  id_ruta: z.number().int().positive('ID de la ruta requerido'),
  codigo_cliente: z.string().min(3).max(100),
  nombre: z.string().min(3, 'Nombre debe tener al menos 3 caracteres').max(100),
  direccion: z.string().min(3).max(255).optional().nullable(),
  telefono: z.string().min(7).max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  activo: z.boolean().default(true).optional()
})

// DTO para obtener lista de clientes
export const clienteListResponseDTO = z.array(clienteResponseTDO)

export type CreateClienteDTOType = z.infer<typeof createClienteDTO>
export type UpdateClienteDTOType = z.infer<typeof updateClienteDTO>
export type ClienteResponseDTOType = z.infer<typeof clienteResponseTDO>
export type ClienteListResponseDTOType = z.infer<typeof clienteListResponseDTO>
