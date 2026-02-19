-- Permite crear vendedores sin usuario asociado.
ALTER TABLE "vendedores"
ALTER COLUMN "id_usuario" DROP NOT NULL;
