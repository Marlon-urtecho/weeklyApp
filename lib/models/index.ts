
// TIPOS BASE PARA TYPESCRIPT INTERFACES Y TIPOS DE DATOS

// USUARIOS
export interface Usuario {
  id_usuario: number;
  nombre: string;
  username: string;
  password?: string; 
  activo: boolean;
  created_at?: Date;
  updated_at?: Date;
  
  // Relaciones (opcionales, para cuando se incluyan)
  roles?: Rol[];
  vendedor?: Vendedor;
}

// ROLES
export interface Rol {
  id_rol: number;
  nombre_rol: string;
}

// USUARIO_ROLES (tabla intermedia)
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
  rutas?: Ruta[];
  inventario?: InventarioVendedor[];
}

// RUTAS
export interface Ruta {
  id_ruta: number;
  id_vendedor: number;
  nombre_ruta: string;
  sitio: string;
  
  vendedor?: Vendedor;
  clientes?: Cliente[];
}

// CLIENTES
export interface Cliente {
  id_cliente: number;
  codigo_cliente: string;
  nombre: string;
  direccion: string;
  telefono: string;
  id_ruta: number;
  
  ruta?: Ruta;
  creditos?: Credito[];
}

// PRODUCTOS
export interface Producto {
  id_producto: number;
  nombre: string;
  categoria: string;
  precio_contado: number;
  precio_credito: number;
  created_at?: Date;
  updated_at?: Date;
  
  inventario_bodega?: InventarioBodega;
  inventario_vendedores?: InventarioVendedor[];
  creditos?: Credito[];
  movimientos?: MovimientoInventario[];
}

// INVENTARIO BODEGA
export interface InventarioBodega {
  id_inventario: number;
  id_producto: number;
  stock_total: number;
  stock_disponible: number;
  producto?: Producto;
}

// INVENTARIO VENDEDOR
export interface InventarioVendedor {
  id: number;
  id_vendedor: number;
  id_producto: number;
  cantidad: number;
  
  vendedor?: Vendedor;
  producto?: Producto;
}

// MOVIMIENTOS DE INVENTARIO
export interface MovimientoInventario {
  id_movimiento: number;
  id_producto: number;
  tipo: "ENTRADA" | "SALIDA" | "AJUSTE";
  cantidad: number;
  origen: string;
  destino: string;
  referencia?: string;
  fecha: Date;
  
  producto?: Producto;
}

// CRÉDITOS
export interface Credito {
  id_credito: number;
  id_cliente: number;
  id_producto: number;
  cantidad: number;
  monto_total: number;
  cuota: number;
  frecuencia_pago: "SEMANAL" | "QUINCENAL" | "MENSUAL";
  saldo_pendiente: number;
  estado: "ACTIVO" | "MOROSO" | "PAGADO" | "CANCELADO";
  fecha_inicio: Date;
  created_at?: Date;
  updated_at?: Date;
  
  cliente?: Cliente;
  producto?: Producto;
  pagos?: Pago[];
}

// PAGOS
export interface Pago {
  id_pago: number;
  id_credito: number;
  monto_pagado: number;
  fecha_pago: Date;
  registrado_por: number;
  
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
  user: Omit<Usuario, "password">; // User sin password
  token: string;
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

// CLIENTES DTOs
export interface CreateClienteDTO {
  codigo_cliente: string;
  nombre: string;
  direccion: string;
  telefono: string;
  id_ruta: number;
}

// PRODUCTOS DTOs
export interface CreateProductoDTO {
  nombre: string;
  categoria: string;
  precio_contado: number;
  precio_credito: number;
}

export interface UpdateProductoDTO {
  nombre?: string;
  categoria?: string;
  precio_contado?: number;
  precio_credito?: number;
}

// CRÉDITOS DTOs
export interface CreateCreditoDTO {
  id_cliente: number;
  id_producto: number;
  cantidad: number;
  monto_total: number;
  cuota: number;
  frecuencia_pago: "SEMANAL" | "QUINCENAL" | "MENSUAL";
  saldo_pendiente: number;
  fecha_inicio: Date;
}

export interface CreatePagoDTO {
  id_credito: number;
  monto_pagado: number;
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
// UNION TYPES ÚTILES
// ============================================

export type ModelType =
  | Usuario
  | Rol
  | UsuarioRol
  | Vendedor
  | Ruta
  | Cliente
  | Producto
  | InventarioBodega
  | InventarioVendedor
  | MovimientoInventario
  | Credito
  | Pago;

export type RoleName = "ADMIN" | "VENDEDOR" | "SUPERVISOR";

// ============================================
// TIPOS PARA PRISMA (si necesitas los tipos exactos)
// ============================================

// Opcional: Importar tipos de Prisma si los necesitas específicamente
import type {
  usuarios as PrismaUsuario,
  roles as PrismaRol,
  usuario_roles as PrismaUsuarioRol,
  vendedores as PrismaVendedor,
  rutas as PrismaRuta,
  clientes as PrismaCliente,
  productos as PrismaProducto,
  inventario_bodega as PrismaInventarioBodega,
  inventario_vendedor as PrismaInventarioVendedor,
  movimientos_inventario as PrismaMovimientoInventario,
  creditos as PrismaCredito,
  pagos as PrismaPago,
} from "@prisma/client";

// Exportarlos con alias si los necesitas
export type {
  PrismaUsuario,
  PrismaRol,
  PrismaUsuarioRol,
  PrismaVendedor,
  PrismaRuta,
  PrismaCliente,
  PrismaProducto,
  PrismaInventarioBodega,
  PrismaInventarioVendedor,
  PrismaMovimientoInventario,
  PrismaCredito,
  PrismaPago,
};