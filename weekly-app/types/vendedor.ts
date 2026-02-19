export interface Vendedor {
  id_vendedor: number
  id_usuario?: number
  nombre: string
  telefono: string
  activo: boolean
  created_at?: string
  usuario?: {
    id_usuario: number
    username: string
    nombre?: string
    email?: string
    activo?: boolean
  }
  rutas?: Array<{
    id_ruta: number
    nombre_ruta: string
    codigo_ruta?: string
    sitio?: string
    zona?: string
    clientes_count?: number
  }>
  inventario?: Array<{
    id: number
    cantidad: number
    producto: {
      id_producto?: number
      nombre: string
      precio_credito: number
      categoria?: string
    }
  }>
  creditos?: Array<{
    id_credito: number
    estado: string
    monto_total: number
    saldo_pendiente: number
  }>
  estadisticas?: {
    total_clientes: number
    total_creditos_activos?: number
    valor_inventario: number
    total_rutas?: number
    creditos_cobrados?: number
    monto_cobrado?: number
  }
}
