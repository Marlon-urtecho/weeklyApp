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
  console.log(' Iniciando seed de producción...')

  const adminUser = process.env.SEED_ADMIN_USER || 'admin'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD

  if (!adminPassword || adminPassword.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD debe definirse y tener al menos 8 caracteres')
  }

  // ============================================
  // 1. CREAR ROLES BÁSICOS
  // ============================================
  console.log('📋 Creando roles...')
  const roles = await prisma.roles.createMany({
    data: [
      { nombre_rol: 'ADMIN' },
      { nombre_rol: 'VENDEDOR' },
      { nombre_rol: 'SUPERVISOR' },
    ],
    skipDuplicates: true,
  })
  console.log(` ${roles.count} roles creados/verificados`)

  // ============================================
  // 2. CREAR USUARIO ADMIN
  // ============================================
  console.log('👤 Creando usuario admin...')
  
  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  
  const admin = await prisma.usuarios.upsert({
    where: { username: adminUser },
    update: {
      nombre: 'Administrador',
      password: hashedPassword,
      activo: true,
    },
    create: {
      nombre: 'Administrador',
      username: adminUser,
      password: hashedPassword,
      activo: true,
    },
  })
  console.log(` Usuario admin creado: ${admin.username}`)

  // ============================================
  // 3. ASIGNAR ROL ADMIN AL USUARIO
  // ============================================
  console.log(' Asignando rol ADMIN...')
  
  const rolAdmin = await prisma.roles.findFirst({
    where: { nombre_rol: 'ADMIN' },
  })

  if (rolAdmin) {
    await prisma.usuario_roles.upsert({
      where: {
        id_usuario_id_rol: {
          id_usuario: admin.id_usuario,
          id_rol: rolAdmin.id_rol,
        },
      },
      update: {},
      create: {
        id_usuario: admin.id_usuario,
        id_rol: rolAdmin.id_rol,
      },
    })
    console.log(' Rol ADMIN asignado')
  }

  // ============================================
  // 4. VERIFICACIÓN FINAL
  // ============================================
  const totalUsuarios = await prisma.usuarios.count()
  const totalRoles = await prisma.roles.count()
  
  console.log('\n RESUMEN:')
  console.log(` Usuarios totales: ${totalUsuarios}`)
  console.log(` Roles totales: ${totalRoles}`)
  console.log('\n Credenciales admin:')
  console.log(`   Usuario: ${adminUser}`)
  console.log('   Contraseña: [SEED_ADMIN_PASSWORD]')
  console.log('\n Seed de producción completado exitosamente!')
}

main()
  .catch((e) => {
    console.error(' Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
