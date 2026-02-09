import { PrismaClient } from "@prisma/client/extension";    

//evita multiples instancias de prisma en produccion 
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =  globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production"){ globalForPrisma.prisma = prisma;
 globalForPrisma.prisma = prisma;

}

export default prisma;