-- CreateTable
CREATE TABLE "CatalogoCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT,
    "sex" TEXT,
    "salesCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
