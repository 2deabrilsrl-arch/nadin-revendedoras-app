-- Tienda armada de entrada, recordatorio de publicar y pregunta del envío automático a Nadin
ALTER TABLE "Tienda" ADD COLUMN IF NOT EXISTS "armadaInicialAt" TIMESTAMP(3);
ALTER TABLE "Tienda" ADD COLUMN IF NOT EXISTS "recordatorioPublicarAt" TIMESTAMP(3);
ALTER TABLE "Tienda" ADD COLUMN IF NOT EXISTS "recordatoriosPublicar" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Tienda" ADD COLUMN IF NOT EXISTS "envioAutoPreguntadoAt" TIMESTAMP(3);
-- Pedidos web: recordatorio de enviar a Nadin y cancelación automática por falta de pago
ALTER TABLE "OrdenTienda" ADD COLUMN IF NOT EXISTS "recordatorioNadinAt" TIMESTAMP(3);
ALTER TABLE "OrdenTienda" ADD COLUMN IF NOT EXISTS "recordatoriosNadin" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OrdenTienda" ADD COLUMN IF NOT EXISTS "canceladaAuto" BOOLEAN NOT NULL DEFAULT false;
