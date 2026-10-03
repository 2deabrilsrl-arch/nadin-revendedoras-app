-- Productos propios de la revendedora (no son de Nadin)
CREATE TABLE IF NOT EXISTS "TiendaProductoPropio" (
  "id" TEXT NOT NULL,
  "tiendaId" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "descripcion" TEXT,
  "categoria" TEXT NOT NULL DEFAULT 'Otros',
  "imagenes" JSONB NOT NULL DEFAULT '[]',
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "destacado" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TiendaProductoPropio_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TiendaProductoPropio_tiendaId_idx" ON "TiendaProductoPropio"("tiendaId");
ALTER TABLE "TiendaProductoPropio" DROP CONSTRAINT IF EXISTS "TiendaProductoPropio_tiendaId_fkey";
ALTER TABLE "TiendaProductoPropio" ADD CONSTRAINT "TiendaProductoPropio_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "TiendaVariantePropia" (
  "id" TEXT NOT NULL,
  "productoId" TEXT NOT NULL,
  "talle" TEXT NOT NULL DEFAULT '',
  "color" TEXT NOT NULL DEFAULT '',
  "precio" DOUBLE PRECISION NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "sku" TEXT,
  CONSTRAINT "TiendaVariantePropia_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TiendaVariantePropia_productoId_idx" ON "TiendaVariantePropia"("productoId");
ALTER TABLE "TiendaVariantePropia" DROP CONSTRAINT IF EXISTS "TiendaVariantePropia_productoId_fkey";
ALTER TABLE "TiendaVariantePropia" ADD CONSTRAINT "TiendaVariantePropia_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "TiendaProductoPropio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrdenTiendaItem" ADD COLUMN IF NOT EXISTS "propio" BOOLEAN NOT NULL DEFAULT false;

-- Igual que el resto de las tablas de tiendas: solo acceso desde el servidor
ALTER TABLE "TiendaProductoPropio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TiendaVariantePropia" ENABLE ROW LEVEL SECURITY;
