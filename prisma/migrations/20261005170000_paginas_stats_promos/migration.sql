-- Páginas, contactos, estadísticas, promociones y carritos abandonados
ALTER TABLE "OrdenTienda" ADD COLUMN IF NOT EXISTS "descuentoPromo" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "OrdenTienda" ADD COLUMN IF NOT EXISTS "promosTexto" TEXT;

CREATE TABLE IF NOT EXISTS "TiendaPagina" (
  "id" TEXT NOT NULL, "tiendaId" TEXT NOT NULL, "slug" TEXT NOT NULL, "titulo" TEXT NOT NULL,
  "contenido" TEXT NOT NULL DEFAULT '', "visible" BOOLEAN NOT NULL DEFAULT true, "enPie" BOOLEAN NOT NULL DEFAULT true,
  "orden" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TiendaPagina_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TiendaPagina_tiendaId_slug_key" ON "TiendaPagina"("tiendaId", "slug");

CREATE TABLE IF NOT EXISTS "TiendaContacto" (
  "id" TEXT NOT NULL, "tiendaId" TEXT NOT NULL, "nombre" TEXT, "email" TEXT, "telefono" TEXT,
  "origen" TEXT NOT NULL DEFAULT 'popup', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TiendaContacto_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TiendaContacto_tiendaId_createdAt_idx" ON "TiendaContacto"("tiendaId", "createdAt");

CREATE TABLE IF NOT EXISTS "TiendaStatDia" (
  "id" TEXT NOT NULL, "tiendaId" TEXT NOT NULL, "fecha" DATE NOT NULL,
  "visitas" INTEGER NOT NULL DEFAULT 0, "vistasProducto" INTEGER NOT NULL DEFAULT 0, "carritos" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "TiendaStatDia_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TiendaStatDia_tiendaId_fecha_key" ON "TiendaStatDia"("tiendaId", "fecha");

CREATE TABLE IF NOT EXISTS "TiendaStatProducto" (
  "id" TEXT NOT NULL, "tiendaId" TEXT NOT NULL, "productId" TEXT NOT NULL, "fecha" DATE NOT NULL, "vistas" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "TiendaStatProducto_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TiendaStatProducto_tiendaId_productId_fecha_key" ON "TiendaStatProducto"("tiendaId", "productId", "fecha");
CREATE INDEX IF NOT EXISTS "TiendaStatProducto_tiendaId_fecha_idx" ON "TiendaStatProducto"("tiendaId", "fecha");

CREATE TABLE IF NOT EXISTS "TiendaPromocion" (
  "id" TEXT NOT NULL, "tiendaId" TEXT NOT NULL, "nombre" TEXT NOT NULL, "tipo" TEXT NOT NULL,
  "lleva" INTEGER NOT NULL DEFAULT 3, "paga" INTEGER NOT NULL DEFAULT 2, "porcentaje" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "alcance" TEXT NOT NULL DEFAULT 'todo', "categoria" TEXT, "productos" JSONB NOT NULL DEFAULT '[]',
  "activa" BOOLEAN NOT NULL DEFAULT true, "desde" TIMESTAMP(3), "hasta" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TiendaPromocion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TiendaPromocion_tiendaId_idx" ON "TiendaPromocion"("tiendaId");

CREATE TABLE IF NOT EXISTS "TiendaCarrito" (
  "id" TEXT NOT NULL, "tiendaId" TEXT NOT NULL, "token" TEXT NOT NULL, "nombre" TEXT, "email" TEXT, "telefono" TEXT,
  "items" JSONB NOT NULL DEFAULT '[]', "total" DOUBLE PRECISION NOT NULL DEFAULT 0, "estado" TEXT NOT NULL DEFAULT 'abierto',
  "avisadoAt" TIMESTAMP(3), "ordenId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TiendaCarrito_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TiendaCarrito_token_key" ON "TiendaCarrito"("token");
CREATE INDEX IF NOT EXISTS "TiendaCarrito_tiendaId_updatedAt_idx" ON "TiendaCarrito"("tiendaId", "updatedAt");
ALTER TABLE "TiendaPagina" DROP CONSTRAINT IF EXISTS "TiendaPagina_tiendaId_fkey";
ALTER TABLE "TiendaPagina" ADD CONSTRAINT "TiendaPagina_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TiendaContacto" DROP CONSTRAINT IF EXISTS "TiendaContacto_tiendaId_fkey";
ALTER TABLE "TiendaContacto" ADD CONSTRAINT "TiendaContacto_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TiendaPromocion" DROP CONSTRAINT IF EXISTS "TiendaPromocion_tiendaId_fkey";
ALTER TABLE "TiendaPromocion" ADD CONSTRAINT "TiendaPromocion_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TiendaCarrito" DROP CONSTRAINT IF EXISTS "TiendaCarrito_tiendaId_fkey";
ALTER TABLE "TiendaCarrito" ADD CONSTRAINT "TiendaCarrito_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TiendaPagina" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TiendaContacto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TiendaStatDia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TiendaStatProducto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TiendaPromocion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TiendaCarrito" ENABLE ROW LEVEL SECURITY;
