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
    "profilePhoto" TEXT,
    "bio" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "tiktok" TEXT,
    "whatsappBusiness" TEXT,
    "linkedin" TEXT,
    "twitter" TEXT,
    "youtube" TEXT,
    "website" TEXT,
    "rol" TEXT NOT NULL DEFAULT 'revendedora',

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
    "consolidacionId" TEXT,
    "orderStatus" TEXT NOT NULL DEFAULT 'pending',
    "paidToNadin" BOOLEAN NOT NULL DEFAULT false,
    "paidByClient" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "receivedNadinAt" TIMESTAMP(3),
    "sentToClientAt" TIMESTAMP(3),
    "sentToNadinAt" TIMESTAMP(3),
    "armadoIniciadoAt" TIMESTAMP(3),
    "armadoCompletoAt" TIMESTAMP(3),
    "pagadoAt" TIMESTAMP(3),
    "enviadoAt" TIMESTAMP(3),
    "entregadoAt" TIMESTAMP(3),
    "paidToNadinAt" TIMESTAMP(3),
    "paidByClientAt" TIMESTAMP(3),
    "armadoEn" TIMESTAMP(3),
    "armadoPor" TEXT,
    "productosArmados" INTEGER,
    "productosFaltantes" INTEGER,
    "productosOriginales" INTEGER,

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
    "cantidadOriginal" INTEGER,
    "cliente" TEXT,
    "nota" TEXT,
    "telefono" TEXT,

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
    "armadoIniciadoAt" TIMESTAMP(3),
    "armadoEn" TIMESTAMP(3),
    "completadoEn" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'enviado',
    "pagadoEn" TIMESTAMP(3),
    "cerrado" BOOLEAN NOT NULL DEFAULT false,

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
    "bestSellerRank" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogoCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLevel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentLevel" TEXT NOT NULL DEFAULT 'bronce',
    "currentXP" INTEGER NOT NULL DEFAULT 0,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Point" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Point_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ranking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ranking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandAmbassador" (
    "id" TEXT NOT NULL,
    "brandSlug" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "logoEmoji" TEXT NOT NULL DEFAULT '👑',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandAmbassador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBrandSales" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandSlug" TEXT NOT NULL,
    "salesCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBrandSales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsolidacionAccessToken" (
    "id" TEXT NOT NULL,
    "consolidacionId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsolidacionAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsolidacionMensaje" (
    "id" TEXT NOT NULL,
    "consolidacionId" TEXT NOT NULL,
    "autorId" TEXT,
    "autorNombre" TEXT NOT NULL,
    "autorTipo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsolidacionMensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoAccessToken" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedidoAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoMensaje" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "autorNombre" TEXT NOT NULL,
    "autorTipo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedidoMensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsolidacionDocumento" (
    "id" TEXT NOT NULL,
    "consolidacionId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsolidacionDocumento_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "Pedido_orderStatus_idx" ON "Pedido"("orderStatus");

-- CreateIndex
CREATE INDEX "Pedido_createdAt_idx" ON "Pedido"("createdAt");

-- CreateIndex
CREATE INDEX "Pedido_consolidacionId_idx" ON "Pedido"("consolidacionId");

-- CreateIndex
CREATE INDEX "Linea_pedidoId_idx" ON "Linea"("pedidoId");

-- CreateIndex
CREATE INDEX "Linea_productId_idx" ON "Linea"("productId");

-- CreateIndex
CREATE INDEX "Consolidacion_userId_idx" ON "Consolidacion"("userId");

-- CreateIndex
CREATE INDEX "Consolidacion_enviadoAt_idx" ON "Consolidacion"("enviadoAt");

-- CreateIndex
CREATE INDEX "Consolidacion_estado_idx" ON "Consolidacion"("estado");

-- CreateIndex
CREATE INDEX "Consolidacion_cerrado_idx" ON "Consolidacion"("cerrado");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogoCache_productId_key" ON "CatalogoCache"("productId");

-- CreateIndex
CREATE INDEX "CatalogoCache_brand_idx" ON "CatalogoCache"("brand");

-- CreateIndex
CREATE INDEX "CatalogoCache_sex_idx" ON "CatalogoCache"("sex");

-- CreateIndex
CREATE INDEX "CatalogoCache_salesCount_idx" ON "CatalogoCache"("salesCount");

-- CreateIndex
CREATE INDEX "CatalogoCache_bestSellerRank_idx" ON "CatalogoCache"("bestSellerRank");

-- CreateIndex
CREATE INDEX "CatalogoCache_updatedAt_idx" ON "CatalogoCache"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_slug_key" ON "Badge"("slug");

-- CreateIndex
CREATE INDEX "Badge_category_idx" ON "Badge"("category");

-- CreateIndex
CREATE INDEX "Badge_rarity_idx" ON "Badge"("rarity");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- CreateIndex
CREATE INDEX "UserBadge_unlockedAt_idx" ON "UserBadge"("unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLevel_userId_key" ON "UserLevel"("userId");

-- CreateIndex
CREATE INDEX "UserLevel_currentLevel_idx" ON "UserLevel"("currentLevel");

-- CreateIndex
CREATE INDEX "UserLevel_totalSales_idx" ON "UserLevel"("totalSales");

-- CreateIndex
CREATE INDEX "Point_userId_idx" ON "Point"("userId");

-- CreateIndex
CREATE INDEX "Point_createdAt_idx" ON "Point"("createdAt");

-- CreateIndex
CREATE INDEX "Point_reason_idx" ON "Point"("reason");

-- CreateIndex
CREATE INDEX "Ranking_period_idx" ON "Ranking"("period");

-- CreateIndex
CREATE INDEX "Ranking_category_idx" ON "Ranking"("category");

-- CreateIndex
CREATE INDEX "Ranking_position_idx" ON "Ranking"("position");

-- CreateIndex
CREATE UNIQUE INDEX "Ranking_userId_period_category_key" ON "Ranking"("userId", "period", "category");

-- CreateIndex
CREATE UNIQUE INDEX "BrandAmbassador_brandSlug_key" ON "BrandAmbassador"("brandSlug");

-- CreateIndex
CREATE INDEX "BrandAmbassador_isActive_idx" ON "BrandAmbassador"("isActive");

-- CreateIndex
CREATE INDEX "BrandAmbassador_brandSlug_idx" ON "BrandAmbassador"("brandSlug");

-- CreateIndex
CREATE INDEX "UserBrandSales_userId_idx" ON "UserBrandSales"("userId");

-- CreateIndex
CREATE INDEX "UserBrandSales_brandSlug_idx" ON "UserBrandSales"("brandSlug");

-- CreateIndex
CREATE INDEX "UserBrandSales_salesCount_idx" ON "UserBrandSales"("salesCount");

-- CreateIndex
CREATE UNIQUE INDEX "UserBrandSales_userId_brandSlug_key" ON "UserBrandSales"("userId", "brandSlug");

-- CreateIndex
CREATE INDEX "Notificacion_userId_leida_idx" ON "Notificacion"("userId", "leida");

-- CreateIndex
CREATE INDEX "Notificacion_createdAt_idx" ON "Notificacion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConsolidacionAccessToken_consolidacionId_key" ON "ConsolidacionAccessToken"("consolidacionId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsolidacionAccessToken_token_key" ON "ConsolidacionAccessToken"("token");

-- CreateIndex
CREATE INDEX "ConsolidacionAccessToken_token_idx" ON "ConsolidacionAccessToken"("token");

-- CreateIndex
CREATE INDEX "ConsolidacionAccessToken_expiresAt_idx" ON "ConsolidacionAccessToken"("expiresAt");

-- CreateIndex
CREATE INDEX "ConsolidacionMensaje_consolidacionId_idx" ON "ConsolidacionMensaje"("consolidacionId");

-- CreateIndex
CREATE INDEX "ConsolidacionMensaje_createdAt_idx" ON "ConsolidacionMensaje"("createdAt");

-- CreateIndex
CREATE INDEX "ConsolidacionMensaje_leido_idx" ON "ConsolidacionMensaje"("leido");

-- CreateIndex
CREATE UNIQUE INDEX "PedidoAccessToken_pedidoId_key" ON "PedidoAccessToken"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "PedidoAccessToken_token_key" ON "PedidoAccessToken"("token");

-- CreateIndex
CREATE INDEX "PedidoAccessToken_expiresAt_idx" ON "PedidoAccessToken"("expiresAt");

-- CreateIndex
CREATE INDEX "PedidoAccessToken_token_idx" ON "PedidoAccessToken"("token");

-- CreateIndex
CREATE INDEX "PedidoMensaje_createdAt_idx" ON "PedidoMensaje"("createdAt");

-- CreateIndex
CREATE INDEX "PedidoMensaje_leido_idx" ON "PedidoMensaje"("leido");

-- CreateIndex
CREATE INDEX "PedidoMensaje_pedidoId_idx" ON "PedidoMensaje"("pedidoId");

-- CreateIndex
CREATE INDEX "ConsolidacionDocumento_consolidacionId_idx" ON "ConsolidacionDocumento"("consolidacionId");

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_consolidacionId_fkey" FOREIGN KEY ("consolidacionId") REFERENCES "Consolidacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Linea" ADD CONSTRAINT "Linea_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consolidacion" ADD CONSTRAINT "Consolidacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLevel" ADD CONSTRAINT "UserLevel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Point" ADD CONSTRAINT "Point_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBrandSales" ADD CONSTRAINT "UserBrandSales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsolidacionAccessToken" ADD CONSTRAINT "ConsolidacionAccessToken_consolidacionId_fkey" FOREIGN KEY ("consolidacionId") REFERENCES "Consolidacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsolidacionMensaje" ADD CONSTRAINT "ConsolidacionMensaje_consolidacionId_fkey" FOREIGN KEY ("consolidacionId") REFERENCES "Consolidacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoAccessToken" ADD CONSTRAINT "PedidoAccessToken_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoMensaje" ADD CONSTRAINT "PedidoMensaje_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsolidacionDocumento" ADD CONSTRAINT "ConsolidacionDocumento_consolidacionId_fkey" FOREIGN KEY ("consolidacionId") REFERENCES "Consolidacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
