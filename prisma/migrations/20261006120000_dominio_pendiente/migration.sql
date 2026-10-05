-- Dominio propio cargado por la revendedora que todavía no está apuntando bien
ALTER TABLE "Tienda" ADD COLUMN IF NOT EXISTS "dominioPendiente" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Tienda_dominioPendiente_key" ON "Tienda"("dominioPendiente");
