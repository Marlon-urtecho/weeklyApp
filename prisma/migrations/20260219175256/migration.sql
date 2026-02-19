-- DropForeignKey
ALTER TABLE "vendedores" DROP CONSTRAINT "vendedores_id_usuario_fkey";

-- AddForeignKey
ALTER TABLE "vendedores" ADD CONSTRAINT "vendedores_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;
