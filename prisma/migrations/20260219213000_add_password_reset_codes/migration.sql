CREATE TABLE "password_reset_codes" (
  "id" SERIAL NOT NULL,
  "id_usuario" INTEGER NOT NULL,
  "code" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "password_reset_codes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "password_reset_codes_id_usuario_code_used_idx"
  ON "password_reset_codes"("id_usuario", "code", "used");

ALTER TABLE "password_reset_codes"
  ADD CONSTRAINT "password_reset_codes_id_usuario_fkey"
  FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario")
  ON DELETE RESTRICT ON UPDATE CASCADE;
