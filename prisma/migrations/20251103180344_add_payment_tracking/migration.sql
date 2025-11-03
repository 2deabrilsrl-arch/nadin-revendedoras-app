-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Consolidacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pedidoIds" TEXT NOT NULL,
    "formaPago" TEXT NOT NULL,
    "tipoEnvio" TEXT NOT NULL,
    "transporteNombre" TEXT,
    "totalMayorista" REAL NOT NULL,
    "totalVenta" REAL NOT NULL,
    "ganancia" REAL NOT NULL,
    "descuentoTotal" REAL NOT NULL DEFAULT 0,
    "costoReal" REAL,
    "gananciaNeta" REAL,
    "csvPath" TEXT,
    "enviadoAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Consolidacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Consolidacion" ("csvPath", "enviadoAt", "formaPago", "ganancia", "id", "pedidoIds", "tipoEnvio", "totalMayorista", "totalVenta", "transporteNombre", "userId") SELECT "csvPath", "enviadoAt", "formaPago", "ganancia", "id", "pedidoIds", "tipoEnvio", "totalMayorista", "totalVenta", "transporteNombre", "userId" FROM "Consolidacion";
DROP TABLE "Consolidacion";
ALTER TABLE "new_Consolidacion" RENAME TO "Consolidacion";
CREATE INDEX "Consolidacion_userId_idx" ON "Consolidacion"("userId");
CREATE INDEX "Consolidacion_enviadoAt_idx" ON "Consolidacion"("enviadoAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
