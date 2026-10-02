-- Tiendas Nadin v2: diseño de portada y datos para consolidar en un paso (aditiva)
ALTER TABLE "Tienda" ADD COLUMN "nadinFormaPago" TEXT,
ADD COLUMN "nadinTipoEnvio" TEXT,
ADD COLUMN "nadinTransporte" TEXT,
ADD COLUMN "diseno" JSONB;

-- El pie "Productos de Nadin Lencería" pasa a ser opcional (apagado por defecto)
ALTER TABLE "Tienda" ALTER COLUMN "mostrarNadin" SET DEFAULT false;
UPDATE "Tienda" SET "mostrarNadin" = false;
