import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed...')

  // 1. Crear roles
  const roles = await prisma.roles.createMany({
    data: [
      { nombre_rol: 'ADMIN' },
      { nombre_rol: 'VENDEDOR' },
      { nombre_rol: 'SUPERVISOR' },
    ],
    skipDuplicates: true,
  })
  console.log(`✅ Roles creados`)

  // 2. Crear usuario admin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.usuarios.create({
    data: {
      nombre: 'Administrador',
      username: 'admin',
      password: hashedPassword,
      activo: true,
    },
  })

  // 3. Asignar rol ADMIN
  const rolAdmin = await prisma.roles.findFirst({
    where: { nombre_rol: 'ADMIN' },
  })

  if (rolAdmin) {
    await prisma.usuario_roles.create({
      data: {
        id_usuario: admin.id_usuario,
        id_rol: rolAdmin.id_rol,
      },
    })
  }

  console.log(` Usuario admin creado: admin / admin123`)
  console.log(' Seed completado!')
}

main()
  .catch((e) => {
    console.error(' Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })