import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL no esta definido')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seed...')

  // ============================================
  // 1. ROLES (ya existente)
  // ============================================
  await prisma.roles.createMany({
    data: [
      { nombre_rol: 'ADMIN' },
      { nombre_rol: 'VENDEDOR' },
      { nombre_rol: 'SUPERVISOR' },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Roles creados')

  // ============================================
  // 2. USUARIO ADMIN (ya existente)
  // ============================================
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.usuarios.upsert({
    where: { username: 'admin' },
    update: {
      nombre: 'Administrador',
      password: hashedPassword,
      activo: true,
    },
    create: {
      nombre: 'Administrador',
      username: 'admin',
      password: hashedPassword,
      activo: true,
    },
  })

  const rolAdmin = await prisma.roles.findFirst({
    where: { nombre_rol: 'ADMIN' },
  })

  if (rolAdmin) {
    await prisma.usuario_roles.createMany({
      data: [
        {
          id_usuario: admin.id_usuario,
          id_rol: rolAdmin.id_rol,
        },
      ],
      skipDuplicates: true,
    })
  }
  console.log('✅ Usuario admin creado: admin / admin123')

  // ============================================
  // 3. USUARIOS ADICIONALES
  // ============================================
  const usuariosData = [
    {
      nombre: 'Carlos López',
      username: 'clopez',
      password: await bcrypt.hash('vendedor123', 10),
      activo: true,
    },
    {
      nombre: 'María García',
      username: 'mgarcia',
      password: await bcrypt.hash('vendedor123', 10),
      activo: true,
    },
    {
      nombre: 'Juan Pérez',
      username: 'jperez',
      password: await bcrypt.hash('supervisor123', 10),
      activo: true,
    },
    {
      nombre: 'Ana Martínez',
      username: 'amartinez',
      password: await bcrypt.hash('vendedor123', 10),
      activo: true,
    },
    {
      nombre: 'Roberto Sánchez',
      username: 'rsanchez',
      password: await bcrypt.hash('vendedor123', 10),
      activo: false,
    },
  ]

  for (const usuario of usuariosData) {
    await prisma.usuarios.upsert({
      where: { username: usuario.username },
      update: usuario,
      create: usuario,
    })
  }
  console.log('✅ Usuarios adicionales creados')

  // Obtener roles para asignar
  const rolVendedor = await prisma.roles.findFirst({ where: { nombre_rol: 'VENDEDOR' } })
  const rolSupervisor = await prisma.roles.findFirst({ where: { nombre_rol: 'SUPERVISOR' } })

  // Asignar roles a usuarios
  const usuarios = await prisma.usuarios.findMany({
    where: { username: { in: ['clopez', 'mgarcia', 'jperez', 'amartinez', 'rsanchez'] } },
  })

  for (const usuario of usuarios) {
    if (usuario.username === 'jperez' && rolSupervisor) {
      await prisma.usuario_roles.createMany({
        data: [{ id_usuario: usuario.id_usuario, id_rol: rolSupervisor.id_rol }],
        skipDuplicates: true,
      })
    } else if (rolVendedor && usuario.username !== 'jperez') {
      await prisma.usuario_roles.createMany({
        data: [{ id_usuario: usuario.id_usuario, id_rol: rolVendedor.id_rol }],
        skipDuplicates: true,
      })
    }
  }
  console.log('✅ Roles asignados a usuarios')

  // ============================================
  // 4. VENDEDORES
  // ============================================
  const vendedoresData = [
    {
      id_usuario: (await prisma.usuarios.findUnique({ where: { username: 'clopez' } }))!.id_usuario,
      nombre: 'Carlos López',
      telefono: '1234-5678',
      activo: true,
    },
    {
      id_usuario: (await prisma.usuarios.findUnique({ where: { username: 'mgarcia' } }))!.id_usuario,
      nombre: 'María García',
      telefono: '2345-6789',
      activo: true,
    },
    {
      id_usuario: (await prisma.usuarios.findUnique({ where: { username: 'amartinez' } }))!.id_usuario,
      nombre: 'Ana Martínez',
      telefono: '3456-7890',
      activo: true,
    },
    {
      id_usuario: (await prisma.usuarios.findUnique({ where: { username: 'rsanchez' } }))!.id_usuario,
      nombre: 'Roberto Sánchez',
      telefono: '4567-8901',
      activo: false,
    },
  ]

  for (const vendedor of vendedoresData) {
    await prisma.vendedores.upsert({
      where: { id_usuario: vendedor.id_usuario },
      update: vendedor,
      create: vendedor,
    })
  }
  console.log('✅ Vendedores creados')

  // ============================================
  // 5. CATEGORIAS
  // ============================================
  const categoriasData = [
    { nombre_categoria: 'Electrónicos', descripcion: 'Productos electrónicos y tecnología', activo: true },
    { nombre_categoria: 'Ropa', descripcion: 'Prendas de vestir para toda la familia', activo: true },
    { nombre_categoria: 'Hogar', descripcion: 'Artículos para el hogar y decoración', activo: true },
    { nombre_categoria: 'Alimentos', descripcion: 'Productos alimenticios no perecederos', activo: true },
    { nombre_categoria: 'Herramientas', descripcion: 'Herramientas manuales y eléctricas', activo: true },
    { nombre_categoria: 'Juguetes', descripcion: 'Juguetes para niños y niñas', activo: false },
  ]

  for (const categoria of categoriasData) {
    await prisma.categorias.upsert({
      where: { nombre_categoria: categoria.nombre_categoria },
      update: categoria,
      create: categoria,
    })
  }
  console.log('✅ Categorías creadas')

  // ============================================
  // 6. PRODUCTOS
  // ============================================
  const categorias = await prisma.categorias.findMany()

  const productosData = [
    // Electrónicos
    { 
      nombre: 'Televisor 50" Smart TV', 
      id_categoria: categorias.find(c => c.nombre_categoria === 'Electrónicos')!.id_categoria,
      precio_contado: 4500.00, 
      precio_credito: 4999.00 
    },
    { 
      nombre: 'Laptop HP 15"', 
      id_categoria: categorias.find(c => c.nombre_categoria === 'Electrónicos')!.id_categoria,
      precio_contado: 6800.00, 
      precio_credito: 7499.00 
    },
    { 
      nombre: 'Smartphone Samsung A54', 
      id_categoria: categorias.find(c => c.nombre_categoria === 'Electrónicos')!.id_categoria,
      precio_contado: 3200.00, 
      precio_credito: 3599.00 
    },
    { 
      nombre: 'Tablet Lenovo', 
      id_categoria: categorias.find(c => c.nombre_categoria === 'Electrónicos')!.id_categoria,
      precio_contado: 1800.00, 
      precio_credito: 2099.00 
    },
    // Ropa
    { 
      nombre: 'Jeans Hombre', 
      id_categoria: categorias.find(c => c.nombre_categoria === 'Ropa')!.id_categoria,
      precio_contado: 250.00, 
      precio_credito: 299.00 
    },
    { 
      nombre: 'Camisa Manga Larga', 
      id_categoria: categorias.find(c => c.nombre_categoria === 'Ropa')!.id_categoria,
      precio_contado: 180.00, 
      precio_credito: 219.00 
    },
    { 
      nombre: 'Vestido Dama', 
      id_categoria: categorias.find(c => c.nombre_categoria === 'Ropa')!.id_categoria,
      precio_contado: 350.00, 
      precio_credito: 399.00 
    },
    // Hogar
    { 
      nombre: 'Juego de Sábanas', 
      id_categoria: categorias.find(c => c.nombre_categoria === 'Hogar')!.id_categoria,
      precio_contado: 280.00, 
      precio_credito: 329.00 
    },
    { 
      nombre: 'Olla Express 6L', 
      id_categoria: categorias.find(c => c.nombre_categoria === 'Hogar')!.id_categoria,
      precio_contado: 450.00, 
      precio_credito: 499.00 
    },
    { 
      nombre: 'Juego de Toallas', 
      id_categoria: categorias.find(c => c.nombre_categoria === 'Hogar')!.id_categoria,
      precio_contado: 190.00, 
      precio_credito: 229.00 
    },
    // Alimentos
    { 
      nombre: 'Aceite Vegetal 1L', 
      id_categoria: categorias.find(c => c.nombre_categoria === 'Alimentos')!.id_categoria,
      precio_contado: 25.00, 
      precio_credito: 29.00 
    },
    { 
      nombre: 'Arroz 5kg', 
      id_categoria: categorias.find(c => c.nombre_categoria === 'Alimentos')!.id_categoria,
      precio_contado: 45.00, 
      precio_credito: 49.00 
    },
    { 
      nombre: 'Frijol 2kg', 
      id_categoria: categorias.find(c => c.nombre_categoria === 'Alimentos')!.id_categoria,
      precio_contado: 35.00, 
      precio_credito: 39.00 
    },
    // Herramientas
    { 
      nombre: 'Taladro Inalámbrico', 
      id_categoria: categorias.find(c => c.nombre_categoria === 'Herramientas')!.id_categoria,
      precio_contado: 650.00, 
      precio_credito: 699.00 
    },
    { 
      nombre: 'Juego de Llaves', 
      id_categoria: categorias.find(c => c.nombre_categoria === 'Herramientas')!.id_categoria,
      precio_contado: 280.00, 
      precio_credito: 319.00 
    },
  ]

  for (const producto of productosData) {
    await prisma.productos.create({
      data: producto,
    })
  }
  console.log('✅ Productos creados')

  // ============================================
  // 7. INVENTARIO BODEGA
  // ============================================
  const productos = await prisma.productos.findMany()

  for (const producto of productos) {
    const stockTotal = Math.floor(Math.random() * 50) + 10 // 10-60 unidades
    const stockDisponible = Math.floor(stockTotal * (Math.random() * 0.3 + 0.6)) // 60-90% del total

    await prisma.inventario_bodega.upsert({
      where: { id_producto: producto.id_producto },
      update: {
        stock_total: stockTotal,
        stock_disponible: stockDisponible,
      },
      create: {
        id_producto: producto.id_producto,
        stock_total: stockTotal,
        stock_disponible: stockDisponible,
      },
    })
  }
  console.log('✅ Inventario en bodega creado')

  // ============================================
  // 8. TIPOS DE MOVIMIENTO
  // ============================================
  const tiposMovimientoData = [
    { nombre_tipo: 'ENTRADA', factor: 1, descripcion: 'Entrada de productos a bodega' },
    { nombre_tipo: 'SALIDA', factor: -1, descripcion: 'Salida de productos de bodega' },
    { nombre_tipo: 'AJUSTE', factor: 0, descripcion: 'Ajuste manual de inventario' },
    { nombre_tipo: 'TRANSFERENCIA', factor: -1, descripcion: 'Transferencia a vendedor' },
    { nombre_tipo: 'DEVOLUCIÓN', factor: 1, descripcion: 'Devolución de productos' },
  ]

  for (const tipo of tiposMovimientoData) {
    await prisma.tipo_movimiento.upsert({
      where: { nombre_tipo: tipo.nombre_tipo },
      update: tipo,
      create: tipo,
    })
  }
  console.log('✅ Tipos de movimiento creados')

  // ============================================
  // 9. RUTAS
  // ============================================
  const rutasData = [
    { codigo_ruta: 'R001', nombre_ruta: 'Ruta Norte', zona: 'Zona 1-5', activo: true },
    { codigo_ruta: 'R002', nombre_ruta: 'Ruta Sur', zona: 'Zona 6-10', activo: true },
    { codigo_ruta: 'R003', nombre_ruta: 'Ruta Centro', zona: 'Zona 11-15', activo: true },
    { codigo_ruta: 'R004', nombre_ruta: 'Ruta Este', zona: 'Zona 16-20', activo: true },
    { codigo_ruta: 'R005', nombre_ruta: 'Ruta Oeste', zona: 'Zona 21-25', activo: false },
  ]

  for (const ruta of rutasData) {
    await prisma.rutas.upsert({
      where: { codigo_ruta: ruta.codigo_ruta },
      update: ruta,
      create: ruta,
    })
  }
  console.log('✅ Rutas creadas')

  // ============================================
  // 10. RUTA_VENDEDOR (Asignación de rutas a vendedores)
  // ============================================
  const vendedores = await prisma.vendedores.findMany({ where: { activo: true } })
  const rutas = await prisma.rutas.findMany({ where: { activo: true } })

  const asignacionesData = [
    { id_ruta: rutas[0].id_ruta, id_vendedor: vendedores[0].id_vendedor, activo: true },
    { id_ruta: rutas[1].id_ruta, id_vendedor: vendedores[0].id_vendedor, activo: true },
    { id_ruta: rutas[2].id_ruta, id_vendedor: vendedores[1].id_vendedor, activo: true },
    { id_ruta: rutas[3].id_ruta, id_vendedor: vendedores[2].id_vendedor, activo: true },
    { id_ruta: rutas[0].id_ruta, id_vendedor: vendedores[2].id_vendedor, activo: true },
  ]

  for (const asignacion of asignacionesData) {
    await prisma.ruta_vendedor.upsert({
      where: {
        id_ruta_id_vendedor: {
          id_ruta: asignacion.id_ruta,
          id_vendedor: asignacion.id_vendedor,
        },
      },
      update: asignacion,
      create: {
        id_ruta: asignacion.id_ruta,
        id_vendedor: asignacion.id_vendedor,
        fecha_asignacion: new Date(),
        activo: asignacion.activo,
      },
    })
  }
  console.log('✅ Rutas asignadas a vendedores')

  // ============================================
  // 11. CLIENTES
  // ============================================
  const rutasActivas = await prisma.rutas.findMany({ where: { activo: true } })

  const clientesData = [
    { 
      codigo_cliente: 'CLI001', 
      nombre: 'Pedro Ramírez', 
      direccion: 'Av. Reforma 1-23', 
      telefono: '5123-4567',
      email: 'pedro@email.com',
      id_ruta: rutasActivas[0].id_ruta,
      activo: true 
    },
    { 
      codigo_cliente: 'CLI002', 
      nombre: 'Luisa Fernández', 
      direccion: 'Zona 10, Calle 5', 
      telefono: '5234-5678',
      email: 'luisa@email.com',
      id_ruta: rutasActivas[0].id_ruta,
      activo: true 
    },
    { 
      codigo_cliente: 'CLI003', 
      nombre: 'Miguel Ángel', 
      direccion: 'Zona 1, 6a Avenida', 
      telefono: '5345-6789',
      email: 'miguel@email.com',
      id_ruta: rutasActivas[1].id_ruta,
      activo: true 
    },
    { 
      codigo_cliente: 'CLI004', 
      nombre: 'Carmen Rosa', 
      direccion: 'Zona 5, Blvd. Los Próceres', 
      telefono: '5456-7890',
      email: 'carmen@email.com',
      id_ruta: rutasActivas[1].id_ruta,
      activo: true 
    },
    { 
      codigo_cliente: 'CLI005', 
      nombre: 'José Luis', 
      direccion: 'Zona 15, Colonia San José', 
      telefono: '5567-8901',
      email: 'joseluis@email.com',
      id_ruta: rutasActivas[2].id_ruta,
      activo: true 
    },
    { 
      codigo_cliente: 'CLI006', 
      nombre: 'Ana Lucía', 
      direccion: 'Zona 12, Calzada Aguilar', 
      telefono: '5678-9012',
      email: 'analucia@email.com',
      id_ruta: rutasActivas[2].id_ruta,
      activo: false 
    },
  ]

  for (const cliente of clientesData) {
    await prisma.clientes.upsert({
      where: { codigo_cliente: cliente.codigo_cliente },
      update: cliente,
      create: cliente,
    })
  }
  console.log('✅ Clientes creados')

  // ============================================
  // 12. INVENTARIO VENDEDOR
  // ============================================
  const productosInventario = await prisma.productos.findMany()
  const vendedoresActivos = await prisma.vendedores.findMany({ where: { activo: true } })

  const inventarioVendedorData = [
    { id_vendedor: vendedoresActivos[0].id_vendedor, id_producto: productosInventario[0].id_producto, cantidad: 5 },
    { id_vendedor: vendedoresActivos[0].id_vendedor, id_producto: productosInventario[1].id_producto, cantidad: 3 },
    { id_vendedor: vendedoresActivos[0].id_vendedor, id_producto: productosInventario[4].id_producto, cantidad: 8 },
    { id_vendedor: vendedoresActivos[1].id_vendedor, id_producto: productosInventario[2].id_producto, cantidad: 2 },
    { id_vendedor: vendedoresActivos[1].id_vendedor, id_producto: productosInventario[3].id_producto, cantidad: 4 },
    { id_vendedor: vendedoresActivos[1].id_vendedor, id_producto: productosInventario[5].id_producto, cantidad: 6 },
    { id_vendedor: vendedoresActivos[2].id_vendedor, id_producto: productosInventario[6].id_producto, cantidad: 3 },
    { id_vendedor: vendedoresActivos[2].id_vendedor, id_producto: productosInventario[7].id_producto, cantidad: 2 },
  ]

  for (const inv of inventarioVendedorData) {
    await prisma.inventario_vendedor.upsert({
      where: {
        id_vendedor_id_producto: {
          id_vendedor: inv.id_vendedor,
          id_producto: inv.id_producto,
        },
      },
      update: { cantidad: inv.cantidad },
      create: inv,
    })
  }
  console.log('✅ Inventario de vendedores creado')

  // ============================================
  // 13. MOVIMIENTOS DE INVENTARIO
  // ============================================
  const tiposMovimiento = await prisma.tipo_movimiento.findMany()
  const usuarioAdmin = await prisma.usuarios.findUnique({ where: { username: 'admin' } })

  const movimientosData = [
    {
      id_producto: productosInventario[0].id_producto,
      id_tipo_movimiento: tiposMovimiento.find(t => t.nombre_tipo === 'ENTRADA')!.id_tipo_movimiento,
      cantidad: 20,
      origen: 'PROVEEDOR',
      destino: 'BODEGA',
      referencia: 'FACT-001',
      observacion: 'Compra inicial',
      id_usuario_registra: usuarioAdmin!.id_usuario,
    },
    {
      id_producto: productosInventario[1].id_producto,
      id_tipo_movimiento: tiposMovimiento.find(t => t.nombre_tipo === 'ENTRADA')!.id_tipo_movimiento,
      cantidad: 15,
      origen: 'PROVEEDOR',
      destino: 'BODEGA',
      referencia: 'FACT-001',
      observacion: 'Compra inicial',
      id_usuario_registra: usuarioAdmin!.id_usuario,
    },
    {
      id_producto: productosInventario[0].id_producto,
      id_tipo_movimiento: tiposMovimiento.find(t => t.nombre_tipo === 'TRANSFERENCIA')!.id_tipo_movimiento,
      cantidad: 5,
      origen: 'BODEGA',
      destino: `VENDEDOR_${vendedoresActivos[0].id_vendedor}`,
      referencia: 'ASIG-001',
      observacion: 'Asignación a vendedor',
      id_usuario_registra: usuarioAdmin!.id_usuario,
    },
    {
      id_producto: productosInventario[4].id_producto,
      id_tipo_movimiento: tiposMovimiento.find(t => t.nombre_tipo === 'TRANSFERENCIA')!.id_tipo_movimiento,
      cantidad: 8,
      origen: 'BODEGA',
      destino: `VENDEDOR_${vendedoresActivos[0].id_vendedor}`,
      referencia: 'ASIG-002',
      observacion: 'Asignación a vendedor',
      id_usuario_registra: usuarioAdmin!.id_usuario,
    },
  ]

  for (const movimiento of movimientosData) {
    await prisma.movimientos_inventario.create({
      data: {
        ...movimiento,
        fecha_movimiento: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Fecha aleatoria en últimos 30 días
      },
    })
  }
  console.log('✅ Movimientos de inventario creados')

  // ============================================
  // 14. CRÉDITOS
  // ============================================
  const clientes = await prisma.clientes.findMany({ where: { activo: true } })
  const vendedoresList = await prisma.vendedores.findMany({ where: { activo: true } })

  const creditosData = [
    {
      id_cliente: clientes[0].id_cliente,
      id_vendedor: vendedoresList[0].id_vendedor,
      monto_total: 5000.00,
      cuota: 416.67,
      frecuencia_pago: 'MENSUAL',
      numero_cuotas: 12,
      saldo_pendiente: 4166.70,
      estado: 'ACTIVO',
      fecha_inicio: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 días atrás
      fecha_vencimiento: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000), // 300 días adelante
      id_usuario_crea: usuarioAdmin!.id_usuario,
    },
    {
      id_cliente: clientes[1].id_cliente,
      id_vendedor: vendedoresList[1].id_vendedor,
      monto_total: 3500.00,
      cuota: 291.67,
      frecuencia_pago: 'MENSUAL',
      numero_cuotas: 12,
      saldo_pendiente: 2333.36,
      estado: 'ACTIVO',
      fecha_inicio: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 días atrás
      fecha_vencimiento: new Date(Date.now() + 320 * 24 * 60 * 60 * 1000), // 320 días adelante
      id_usuario_crea: usuarioAdmin!.id_usuario,
    },
    {
      id_cliente: clientes[2].id_cliente,
      id_vendedor: vendedoresList[0].id_vendedor,
      monto_total: 2800.00,
      cuota: 233.33,
      frecuencia_pago: 'MENSUAL',
      numero_cuotas: 12,
      saldo_pendiente: 1633.31,
      estado: 'MOROSO',
      fecha_inicio: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 días atrás
      fecha_vencimiento: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás (vencido)
      id_usuario_crea: usuarioAdmin!.id_usuario,
    },
    {
      id_cliente: clientes[3].id_cliente,
      id_vendedor: vendedoresList[2].id_vendedor,
      monto_total: 1200.00,
      cuota: 100.00,
      frecuencia_pago: 'MENSUAL',
      numero_cuotas: 12,
      saldo_pendiente: 0.00,
      estado: 'PAGADO',
      fecha_inicio: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // 400 días atrás
      fecha_vencimiento: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 días atrás
      id_usuario_crea: usuarioAdmin!.id_usuario,
    },
    {
      id_cliente: clientes[4].id_cliente,
      id_vendedor: vendedoresList[1].id_vendedor,
      monto_total: 4500.00,
      cuota: 375.00,
      frecuencia_pago: 'MENSUAL',
      numero_cuotas: 12,
      saldo_pendiente: 3750.00,
      estado: 'ACTIVO',
      fecha_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
      fecha_vencimiento: new Date(Date.now() + 330 * 24 * 60 * 60 * 1000), // 330 días adelante
      id_usuario_crea: usuarioAdmin!.id_usuario,
    },
  ]

  for (const credito of creditosData) {
    await prisma.creditos.create({
      data: credito,
    })
  }
  console.log('✅ Créditos creados')

  // ============================================
  // 15. CRÉDITO DETALLE (productos por crédito)
  // ============================================
  const creditos = await prisma.creditos.findMany()

  for (let i = 0; i < creditos.length; i++) {
    const credito = creditos[i]
    const numProductos = Math.floor(Math.random() * 3) + 1 // 1-3 productos por crédito

    for (let j = 0; j < numProductos; j++) {
      const producto = productosInventario[(i + j) % productosInventario.length]
      const cantidad = Math.floor(Math.random() * 3) + 1 // 1-3 unidades
      const precioUnitario = Number(producto.precio_credito)
      const subtotal = cantidad * precioUnitario

      await prisma.credito_detalle.create({
        data: {
          id_credito: credito.id_credito,
          id_producto: producto.id_producto,
          cantidad,
          precio_unitario: precioUnitario,
          subtotal,
        },
      })
    }
  }
  console.log('✅ Detalles de créditos creados')

  // ============================================
  // 16. PAGOS
  // ============================================
  const creditosActivos = await prisma.creditos.findMany({
    where: { estado: { in: ['ACTIVO', 'MOROSO'] } },
  })

  for (const credito of creditosActivos) {
    // Crear 1-3 pagos por crédito
    const numPagos = Math.floor(Math.random() * 3) + 1

    for (let i = 0; i < numPagos; i++) {
      const montoPagado = Number(credito.cuota) * (Math.random() * 0.5 + 0.5) // 50-100% de la cuota
      const fechaPago = new Date(credito.fecha_inicio)
      fechaPago.setDate(fechaPago.getDate() + 30 * (i + 1)) // Pagos mensuales

      // Solo crear pagos si la fecha es pasada
      if (fechaPago < new Date()) {
        const metodosPago = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA']
        
        await prisma.pagos.create({
          data: {
            id_credito: credito.id_credito,
            monto_pagado: montoPagado,
            fecha_pago: fechaPago,
            metodo_pago: metodosPago[Math.floor(Math.random() * metodosPago.length)],
            registrado_por: usuarioAdmin!.id_usuario,
          },
        })
      }
    }
  }
  console.log('✅ Pagos creados')

  console.log('🎉 Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })