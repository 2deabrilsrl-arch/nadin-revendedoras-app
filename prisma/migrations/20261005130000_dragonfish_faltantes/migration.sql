-- Faltantes detectados por el puente al generar el remito en Dragonfish
ALTER TABLE "Consolidacion" ADD COLUMN IF NOT EXISTS "dfFaltantes" JSONB;
