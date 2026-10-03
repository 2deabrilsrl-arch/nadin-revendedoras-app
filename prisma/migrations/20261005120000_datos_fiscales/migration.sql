-- Datos fiscales de la revendedora (para crear el cliente en Dragonfish)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "situacionFiscal" TEXT NOT NULL DEFAULT 'CF';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cuit" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "razonSocial" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "codigoDragonfish" TEXT;
