-- Precio tachado (oferta) en productos propios
ALTER TABLE "TiendaVariantePropia" ADD COLUMN IF NOT EXISTS "precioAntes" DOUBLE PRECISION;
