-- CreateTable
CREATE TABLE "pago_detalle_producto" (
    "id_pago_detalle" SERIAL NOT NULL,
    "id_pago" INTEGER NOT NULL,
    "id_credito" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "monto_pagado" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pago_detalle_producto_pkey" PRIMARY KEY ("id_pago_detalle")
);

-- CreateIndex
CREATE INDEX "pago_detalle_producto_id_credito_id_producto_idx" ON "pago_detalle_producto"("id_credito", "id_producto");

-- AddForeignKey
ALTER TABLE "pago_detalle_producto" ADD CONSTRAINT "pago_detalle_producto_id_pago_fkey" FOREIGN KEY ("id_pago") REFERENCES "pagos"("id_pago") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_detalle_producto" ADD CONSTRAINT "pago_detalle_producto_id_credito_fkey" FOREIGN KEY ("id_credito") REFERENCES "creditos"("id_credito") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_detalle_producto" ADD CONSTRAINT "pago_detalle_producto_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;
