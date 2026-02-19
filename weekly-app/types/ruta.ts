export interface Ruta {
  id_ruta: number
  codigo_ruta: string
  nombre_ruta: string
  zona?: string
  activo: boolean
  vendedores?: Array<{
    id_vendedor: number
    nombre: string
    fecha_asignacion: string
    activo?: boolean
  }>
  clientes?: Array<{
    id_cliente: number
    codigo_cliente?: string
    nombre: string
    telefono?: string | null
    activo: boolean
    creditos?: Array<{
      id_credito: number
      estado?: string
    }>
  }>
}
