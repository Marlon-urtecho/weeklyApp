// ============================================
// TIPOS BASE PARA TYPESCRIPT INTERFACES Y TIPOS DE DATOS
// ============================================

// USUARIOS
export interface Usuario {
  id_usuario: number;
  nombre: string;
  username: string;
  password?: string;
  activo: boolean;
  created_at?: Date;
  updated_at?: Date;

  // Relaciones 
  roles?: Rol[];
  vendedor?: Vendedor;
  movimientos_registrados?: MovimientoInventario[];
  creditos_creados?: Credito[];
  pagos_registrados?: Pago[];
}

// ROLES
export interface Rol {
  id_rol: number;
  nombre_rol: string;
}

// USUARIO_ROLES 
export interface UsuarioRol {
  id_usuario: number;
  id_rol: number;
  usuario?: Usuario;
  rol?: Rol;
}

// VENDEDORES
export interface Vendedor {
  id_vendedor: number;
  id_usuario: number;
  nombre: string;
  telefono: string;
  activo: boolean;
  created_at?: Date;
  updated_at?: Date;

  usuario?: Usuario;
  rutas_asignadas?: RutaVendedor[];
  inventario?: InventarioVendedor[];
  creditos_gestionados?: Credito[];
}

// CATEGORIAS
export interface Categoria {
  id_categoria: number;
  nombre_categoria: string;
  descripcion?: string;
  activo: boolean;

  productos?: Producto[];
}

// PRODUCTOS
export interface Producto {
  id_producto: number;
  nombre: string;
  id_categoria: number;
  precio_contado: number;
  precio_credito: number;
  created_at?: Date;
  updated_at?: Date;

  categoria?: Categoria;
  inventario_bodega?: InventarioBodega;
  inventario_vendedores?: InventarioVendedor[];
  creditos_detalle?: CreditoDetalle[];
  movimientos?: MovimientoInventario[];
}

// RUTAS
export interface Ruta {
  id_ruta: number;
  codigo_ruta: string;
  nombre_ruta: string;
  zona?: string;
  activo: boolean;

  vendedores_asignados?: RutaVendedor[];
  clientes?: Cliente[];
}

// RUTA_VENDEDOR 
export interface RutaVendedor {
  id_ruta_vendedor: number;
  id_ruta: number;
  id_vendedor: number;
  fecha_asignacion: Date;
  activo: boolean;

  ruta?: Ruta;
  vendedor?: Vendedor;
}

// CLIENTES
export interface Cliente {
  id_cliente: number;
  codigo_cliente: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  id_ruta: number;
  activo: boolean;

  ruta?: Ruta;
  creditos?: Credito[];
}

// INVENTARIO BODEGA
export interface InventarioBodega {
  id_inventario: number;
  id_producto: number;
  stock_total: number;
  stock_disponible: number;
  updated_at?: Date;

  producto?: Producto;
}

// INVENTARIO VENDEDOR
export interface InventarioVendedor {
  id: number;
  id_vendedor: number;
  id_producto: number;
  cantidad: number;
  fecha_asignacion: Date;
  updated_at?: Date;

  vendedor?: Vendedor;
  producto?: Producto;
}

// TIPO MOVIMIENTO
export interface TipoMovimiento {
  id_tipo_movimiento: number;
  nombre_tipo: string; // 'ENTRADA_COMPRA', 'SALIDA_VENTA', 'TRASPASO', 'AJUSTE'
  factor: number; // 1 para entrada, -1 para salida
  descripcion?: string;

  movimientos?: MovimientoInventario[];
}

// MOVIMIENTOS DE INVENTARIO
export interface MovimientoInventario {
  id_movimiento: number;
  id_producto: number;
  id_tipo_movimiento: number;
  cantidad: number;
  origen: string; // 'BODEGA', 'VENDEDOR:ID', 'CLIENTE:ID'
  destino: string; // 'BODEGA', 'VENDEDOR:ID', 'CLIENTE:ID'
  referencia?: string; // Número de factura, pedido, etc.
  observacion?: string;
  fecha_movimiento: Date;
  id_usuario_registra: number;

  producto?: Producto;
  tipo_movimiento?: TipoMovimiento;
  usuario_registra?: Usuario;
}

// CRÉDITOS
export interface Credito {
  id_credito: number;
  id_cliente: number;
  id_vendedor: number;
  monto_total: number;
  cuota: number;
  frecuencia_pago: "SEMANAL" | "QUINCENAL" | "MENSUAL";
  numero_cuotas: number;
  saldo_pendiente: number;
  estado: "ACTIVO" | "MORA" | "PAGADO" | "CANCELADO";
  fecha_inicio: Date;
  fecha_vencimiento: Date;
  created_at?: Date;
  updated_at?: Date;
  id_usuario_crea: number;

  cliente?: Cliente;
  vendedor?: Vendedor;
  usuario_crea?: Usuario;
  detalles?: CreditoDetalle[];
  pagos?: Pago[];
}

// CREDITO_DETALLE
export interface CreditoDetalle {
  id_detalle: number;
  id_credito: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;

  credito?: Credito;
  producto?: Producto;
}

// PAGOS
export interface Pago {
  id_pago: number;
  id_credito: number;
  monto_pagado: number;
  fecha_pago: Date;
  metodo_pago?: string; // 'EFECTIVO', 'TRANSFERENCIA', 'TARJETA'
  registrado_por: number;
  created_at?: Date;

  credito?: Credito;
  usuario?: Usuario;
}

// ============================================
// TIPOS PARA API (DTOs - Data Transfer Objects)
// ============================================

// AUTH
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  username: string;
  password: string;
  roles?: number[];
}

export interface AuthResponse {
  user: Omit<Usuario, "password">;
  token: string;
  refresh_token?: string;
}

// USUARIOS DTOs
export interface CreateUsuarioDTO {
  nombre: string;
  username: string;
  password: string;
  activo?: boolean;
  roles?: number[];
}

export interface UpdateUsuarioDTO {
  nombre?: string;
  username?: string;
  activo?: boolean;
  roles?: number[];
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

// VENDEDORES DTOs
export interface CreateVendedorDTO {
  id_usuario: number;
  nombre: string;
  telefono: string;
  activo?: boolean;
}

export interface UpdateVendedorDTO {
  nombre?: string;
  telefono?: string;
  activo?: boolean;
}

// CATEGORIAS DTOs
export interface CreateCategoriaDTO {
  nombre_categoria: string;
  descripcion?: string;
  activo?: boolean;
}

export interface UpdateCategoriaDTO {
  nombre_categoria?: string;
  descripcion?: string;
  activo?: boolean;
}

// PRODUCTOS DTOs
export interface CreateProductoDTO {
  nombre: string;
  id_categoria: number;
  precio_contado: number;
  precio_credito: number;
}

export interface UpdateProductoDTO {
  nombre?: string;
  id_categoria?: number;
  precio_contado?: number;
  precio_credito?: number;
}

// RUTAS DTOs
export interface CreateRutaDTO {
  codigo_ruta: string;
  nombre_ruta: string;
  zona?: string;
  activo?: boolean;
}

export interface UpdateRutaDTO {
  codigo_ruta?: string;
  nombre_ruta?: string;
  zona?: string;
  activo?: boolean;
}

// RUTA_VENDEDOR DTOs
export interface AsignarRutaVendedorDTO {
  id_ruta: number;
  id_vendedor: number;
  fecha_asignacion?: Date;
  activo?: boolean;
}

// CLIENTES DTOs
export interface CreateClienteDTO {
  codigo_cliente: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  id_ruta: number;
  activo?: boolean;
}

export interface UpdateClienteDTO {
  nombre?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  id_ruta?: number;
  activo?: boolean;
}

// INVENTARIO DTOs
export interface AsignarInventarioVendedorDTO {
  id_vendedor: number;
  id_producto: number;
  cantidad: number;
}

export interface TransferirInventarioDTO {
  id_producto: number;
  cantidad: number;
  origen: string; // 'BODEGA' o 'VENDEDOR:ID'
  destino: string; // 'BODEGA' o 'VENDEDOR:ID' o 'CLIENTE:ID'
  referencia?: string;
  observacion?: string;
}

// CRÉDITOS DTOs
export interface CreateCreditoDTO {
  id_cliente: number;
  id_vendedor: number;
  productos: {
    id_producto: number;
    cantidad: number;
    precio_unitario: number;
  }[];
  cuota: number;
  frecuencia_pago: "SEMANAL" | "QUINCENAL" | "MENSUAL";
  numero_cuotas: number;
  fecha_inicio: Date;
  fecha_vencimiento: Date;
}

export interface UpdateCreditoEstadoDTO {
  estado: "ACTIVO" | "MORA" | "PAGADO" | "CANCELADO";
}

// PAGOS DTOs
export interface CreatePagoDTO {
  id_credito: number;
  monto_pagado: number;
  metodo_pago?: string;
  registrado_por: number;
}

// ============================================
// TIPOS PARA RESPONSE (lo que retorna la API)
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// ENUMS Y UNION TYPES
// ============================================

export type ModelType =
  | Usuario
  | Rol
  | UsuarioRol
  | Vendedor
  | Categoria
  | Producto
  | Ruta
  | RutaVendedor
  | Cliente
  | InventarioBodega
  | InventarioVendedor
  | TipoMovimiento
  | MovimientoInventario
  | Credito
  | CreditoDetalle
  | Pago;

export type RoleName = "ADMIN" | "VENDEDOR" | "SUPERVISOR" | "BODEGA";

export type FrecuenciaPago = "SEMANAL" | "QUINCENAL" | "MENSUAL";
export type EstadoCredito = "ACTIVO" | "MORA" | "PAGADO" | "CANCELADO";
export type MetodoPago = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA";

// ============================================
// TIPOS PARA PRISMA (si necesitas los tipos exactos)
// ============================================

import type {
  usuarios as PrismaUsuario,
  roles as PrismaRol,
  usuario_roles as PrismaUsuarioRol,
  vendedores as PrismaVendedor,
  categorias as PrismaCategoria,
  productos as PrismaProducto,
  rutas as PrismaRuta,
  ruta_vendedor as PrismaRutaVendedor,
  clientes as PrismaCliente,
  inventario_bodega as PrismaInventarioBodega,
  inventario_vendedor as PrismaInventarioVendedor,
  tipo_movimiento as PrismaTipoMovimiento,
  movimientos_inventario as PrismaMovimientoInventario,
  creditos as PrismaCredito,
  credito_detalle as PrismaCreditoDetalle,
  pagos as PrismaPago,
} from "@prisma/client";

export type {
  PrismaUsuario,
  PrismaRol,
  PrismaUsuarioRol,
  PrismaVendedor,
  PrismaCategoria,  
  PrismaProducto,
  PrismaRuta,
  PrismaRutaVendedor,
  PrismaCliente,
  PrismaInventarioBodega,
  PrismaInventarioVendedor,
  PrismaTipoMovimiento,
  PrismaMovimientoInventario,
  PrismaCredito,
  PrismaCreditoDetalle,
  PrismaPago,
};
