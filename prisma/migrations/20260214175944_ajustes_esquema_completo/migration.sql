/*
  Warnings:

  - You are about to drop the column `cantidad` on the `creditos` table. All the data in the column will be lost.
  - You are about to drop the column `id_producto` on the `creditos` table. All the data in the column will be lost.
  - You are about to drop the column `fecha` on the `movimientos_inventario` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `movimientos_inventario` table. All the data in the column will be lost.
  - You are about to drop the column `categoria` on the `productos` table. All the data in the column will be lost.
  - You are about to drop the column `id_vendedor` on the `rutas` table. All the data in the column will be lost.
  - You are about to drop the column `sitio` on the `rutas` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[codigo_ruta]` on the table `rutas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fecha_vencimiento` to the `creditos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_usuario_crea` to the `creditos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_vendedor` to the `creditos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numero_cuotas` to the `creditos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `inventario_bodega` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `inventario_vendedor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_tipo_movimiento` to the `movimientos_inventario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_usuario_registra` to the `movimientos_inventario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_categoria` to the `productos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codigo_ruta` to the `rutas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "creditos" DROP CONSTRAINT "creditos_id_producto_fkey";

-- DropForeignKey
ALTER TABLE "rutas" DROP CONSTRAINT "rutas_id_vendedor_fkey";

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "email" TEXT,
ALTER COLUMN "direccion" DROP NOT NULL,
ALTER COLUMN "telefono" DROP NOT NULL;

-- AlterTable
ALTER TABLE "creditos" DROP COLUMN "cantidad",
DROP COLUMN "id_producto",
ADD COLUMN     "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "id_usuario_crea" INTEGER NOT NULL,
ADD COLUMN     "id_vendedor" INTEGER NOT NULL,
ADD COLUMN     "numero_cuotas" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "inventario_bodega" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "stock_total" SET DEFAULT 0,
ALTER COLUMN "stock_disponible" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "inventario_vendedor" ADD COLUMN     "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "cantidad" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "movimientos_inventario" DROP COLUMN "fecha",
DROP COLUMN "tipo",
ADD COLUMN     "fecha_movimiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id_tipo_movimiento" INTEGER NOT NULL,
ADD COLUMN     "id_usuario_registra" INTEGER NOT NULL,
ADD COLUMN     "observacion" TEXT;

-- AlterTable
ALTER TABLE "pagos" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "metodo_pago" TEXT;

-- AlterTable
ALTER TABLE "productos" DROP COLUMN "categoria",
ADD COLUMN     "id_categoria" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "rutas" DROP COLUMN "id_vendedor",
DROP COLUMN "sitio",
ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "codigo_ruta" TEXT NOT NULL,
ADD COLUMN     "zona" TEXT;

-- CreateTable
CREATE TABLE "categorias" (
    "id_categoria" SERIAL NOT NULL,
    "nombre_categoria" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "ruta_vendedor" (
    "id_ruta_vendedor" SERIAL NOT NULL,
    "id_ruta" INTEGER NOT NULL,
    "id_vendedor" INTEGER NOT NULL,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ruta_vendedor_pkey" PRIMARY KEY ("id_ruta_vendedor")
);

-- CreateTable
CREATE TABLE "tipo_movimiento" (
    "id_tipo_movimiento" SERIAL NOT NULL,
    "nombre_tipo" TEXT NOT NULL,
    "factor" INTEGER NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "tipo_movimiento_pkey" PRIMARY KEY ("id_tipo_movimiento")
);

-- CreateTable
CREATE TABLE "credito_detalle" (
    "id_detalle" SERIAL NOT NULL,
    "id_credito" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "credito_detalle_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_categoria_key" ON "categorias"("nombre_categoria");

-- CreateIndex
CREATE UNIQUE INDEX "ruta_vendedor_id_ruta_id_vendedor_key" ON "ruta_vendedor"("id_ruta", "id_vendedor");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_movimiento_nombre_tipo_key" ON "tipo_movimiento"("nombre_tipo");

-- CreateIndex
CREATE UNIQUE INDEX "credito_detalle_id_credito_id_producto_key" ON "credito_detalle"("id_credito", "id_producto");

-- CreateIndex
CREATE UNIQUE INDEX "rutas_codigo_ruta_key" ON "rutas"("codigo_ruta");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ruta_vendedor" ADD CONSTRAINT "ruta_vendedor_id_ruta_fkey" FOREIGN KEY ("id_ruta") REFERENCES "rutas"("id_ruta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ruta_vendedor" ADD CONSTRAINT "ruta_vendedor_id_vendedor_fkey" FOREIGN KEY ("id_vendedor") REFERENCES "vendedores"("id_vendedor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_tipo_movimiento_fkey" FOREIGN KEY ("id_tipo_movimiento") REFERENCES "tipo_movimiento"("id_tipo_movimiento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_usuario_registra_fkey" FOREIGN KEY ("id_usuario_registra") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditos" ADD CONSTRAINT "creditos_id_vendedor_fkey" FOREIGN KEY ("id_vendedor") REFERENCES "vendedores"("id_vendedor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditos" ADD CONSTRAINT "creditos_id_usuario_crea_fkey" FOREIGN KEY ("id_usuario_crea") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credito_detalle" ADD CONSTRAINT "credito_detalle_id_credito_fkey" FOREIGN KEY ("id_credito") REFERENCES "creditos"("id_credito") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credito_detalle" ADD CONSTRAINT "credito_detalle_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;
