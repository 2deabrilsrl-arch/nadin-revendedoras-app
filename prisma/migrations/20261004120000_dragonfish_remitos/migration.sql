-- Dragonfish: seguimiento del remito de cada consolidación (aditiva)
ALTER TABLE "Consolidacion" ADD COLUMN "dfEstado" TEXT,
ADD COLUMN "dfComprobante" TEXT,
ADD COLUMN "dfError" TEXT,
ADD COLUMN "dfIntentos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "dfActualizadoAt" TIMESTAMP(3);

CREATE INDEX "Consolidacion_dfEstado_idx" ON "Consolidacion"("dfEstado");
