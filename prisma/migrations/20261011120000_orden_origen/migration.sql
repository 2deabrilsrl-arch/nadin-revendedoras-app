-- Ventas cargadas a mano por la revendedora (WhatsApp, en persona)
ALTER TABLE "OrdenTienda" ADD COLUMN IF NOT EXISTS "origen" TEXT NOT NULL DEFAULT 'web';
