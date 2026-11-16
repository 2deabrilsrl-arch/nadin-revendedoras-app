-- Usuarias bloqueadas: no pueden entrar a la app ni usar su tienda (los datos se conservan)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bloqueado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bloqueadoMotivo" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bloqueadoAt" TIMESTAMP(3);
