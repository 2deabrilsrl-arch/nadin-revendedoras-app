-- Stock propio de la revendedora sobre productos de Nadin
CREATE TABLE "TiendaStockExtra" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "talle" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "precio" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TiendaStockExtra_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TiendaStockExtra_tiendaId_productId_clave_key" ON "TiendaStockExtra"("tiendaId", "productId", "clave");
CREATE INDEX "TiendaStockExtra_tiendaId_idx" ON "TiendaStockExtra"("tiendaId");
ALTER TABLE "TiendaStockExtra" ADD CONSTRAINT "TiendaStockExtra_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrdenTiendaItem" ADD COLUMN "qtyPropio" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OrdenTiendaItem" ADD COLUMN "stockExtraId" TEXT;
