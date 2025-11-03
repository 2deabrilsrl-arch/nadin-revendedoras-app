@echo off
chcp 65001 >nul
echo ============================================
echo   CREANDO ARCHIVOS DE BASE DE DATOS
echo ============================================
echo.

REM prisma/schema.prisma
(
echo generator client {
echo   provider = "prisma-client-js"
echo }
echo.
echo datasource db {
echo   provider = "postgresql"
echo   url      = env^("DATABASE_URL"^)
echo }
echo.
echo model User {
echo   id             String          @id @default^(cuid^(^)^)
echo   email          String          @unique
echo   password       String
echo   name           String
echo   dni            String          @unique
echo   telefono       String
echo   handle         String          @unique
echo   margen         Float           @default^(60^)
echo   cbu            String?
echo   alias          String?
echo   cvu            String?
echo   createdAt      DateTime        @default^(now^(^)^)
echo   updatedAt      DateTime        @updatedAt
echo   pedidos        Pedido[]
echo   consolidaciones Consolidacion[]
echo }
echo.
echo model Pedido {
echo   id        String   @id @default^(cuid^(^)^)
echo   userId    String
echo   cliente   String
echo   telefono  String?
echo   nota      String?
echo   estado    String   @default^("pendiente"^)
echo   createdAt DateTime @default^(now^(^)^)
echo   updatedAt DateTime @updatedAt
echo   user      User     @relation^(fields: [userId], references: [id]^)
echo   lineas    Linea[]
echo   @@index^([userId]^)
echo   @@index^([estado]^)
echo }
echo.
echo model Linea {
echo   id         String  @id @default^(cuid^(^)^)
echo   pedidoId   String
echo   productId  String
echo   variantId  String
echo   sku        String?
echo   brand      String?
echo   name       String
echo   talle      String?
echo   color      String?
echo   qty        Int
echo   mayorista  Float
echo   venta      Float
echo   pedido     Pedido  @relation^(fields: [pedidoId], references: [id], onDelete: Cascade^)
echo   @@index^([pedidoId]^)
echo }
echo.
echo model Consolidacion {
echo   id              String   @id @default^(cuid^(^)^)
echo   userId          String
echo   pedidoIds       String
echo   formaPago       String
echo   tipoEnvio       String
echo   transporteNombre String?
echo   totalMayorista  Float
echo   totalVenta      Float
echo   ganancia        Float
echo   csvPath         String?
echo   enviadoAt       DateTime @default^(now^(^)^)
echo   user            User     @relation^(fields: [userId], references: [id]^)
echo   @@index^([userId]^)
echo   @@index^([enviadoAt]^)
echo }
) > prisma\schema.prisma

echo.
echo ✅ Archivo prisma/schema.prisma creado!
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul