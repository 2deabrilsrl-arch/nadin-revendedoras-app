-- Costo de los productos propios (para calcular la ganancia real)
ALTER TABLE "TiendaVariantePropia" ADD COLUMN IF NOT EXISTS "costo" DOUBLE PRECISION;
ALTER TABLE "OrdenTienda" ADD COLUMN IF NOT EXISTS "costoPropio" DOUBLE PRECISION NOT NULL DEFAULT 0;
