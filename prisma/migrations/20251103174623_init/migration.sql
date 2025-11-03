-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "margen" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "cbu" TEXT,
    "alias" TEXT,
    "cvu" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "telefono" TEXT,
    "nota" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Linea" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "sku" TEXT,
    "brand" TEXT,
    "name" TEXT NOT NULL,
    "talle" TEXT,
    "color" TEXT,
    "qty" INTEGER NOT NULL,
    "mayorista" DOUBLE PRECISION NOT NULL,
    "venta" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Linea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consolidacion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pedidoIds" TEXT NOT NULL,
    "formaPago" TEXT NOT NULL,
    "tipoEnvio" TEXT NOT NULL,
    "transporteNombre" TEXT,
    "totalMayorista" DOUBLE PRECISION NOT NULL,
    "totalVenta" DOUBLE PRECISION NOT NULL,
    "ganancia" DOUBLE PRECISION NOT NULL,
    "descuentoTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoReal" DOUBLE PRECISION,
    "gananciaNeta" DOUBLE PRECISION,
    "csvPath" TEXT,
    "enviadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consolidacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogoCache" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT,
    "sex" TEXT,
    "salesCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogoCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_dni_key" ON "User"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");

-- CreateIndex
CREATE INDEX "Pedido_userId_idx" ON "Pedido"("userId");

-- CreateIndex
CREATE INDEX "Pedido_estado_idx" ON "Pedido"("estado");

-- CreateIndex
CREATE INDEX "Linea_pedidoId_idx" ON "Linea"("pedidoId");

-- CreateIndex
CREATE INDEX "Consolidacion_userId_idx" ON "Consolidacion"("userId");

-- CreateIndex
CREATE INDEX "Consolidacion_enviadoAt_idx" ON "Consolidacion"("enviadoAt");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogoCache_productId_key" ON "CatalogoCache"("productId");

-- CreateIndex
CREATE INDEX "CatalogoCache_brand_idx" ON "CatalogoCache"("brand");

-- CreateIndex
CREATE INDEX "CatalogoCache_sex_idx" ON "CatalogoCache"("sex");

-- CreateIndex
CREATE INDEX "CatalogoCache_salesCount_idx" ON "CatalogoCache"("salesCount");

-- CreateIndex
CREATE INDEX "CatalogoCache_updatedAt_idx" ON "CatalogoCache"("updatedAt");

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Linea" ADD CONSTRAINT "Linea_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consolidacion" ADD CONSTRAINT "Consolidacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;Consolidacion"("enviadoAt");
