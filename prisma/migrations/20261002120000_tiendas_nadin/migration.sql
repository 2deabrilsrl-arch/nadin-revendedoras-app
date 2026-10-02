-- Tiendas Nadin: migración 100% aditiva (no borra ni modifica datos existentes)

-- AlterTable
ALTER TABLE "CatalogoCache" ADD COLUMN "slug" TEXT,
ADD COLUMN "descripcion" TEXT;

-- CreateTable
CREATE TABLE "Tienda" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "dominioPropio" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT false,
    "nombre" TEXT NOT NULL,
    "eslogan" TEXT,
    "descripcion" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "colorPrimario" TEXT NOT NULL DEFAULT '#e11d74',
    "colorSecundario" TEXT NOT NULL DEFAULT '#111827',
    "fuente" TEXT NOT NULL DEFAULT 'moderna',
    "ciudad" TEXT,
    "provincia" TEXT,
    "whatsapp" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "tiktok" TEXT,
    "email" TEXT,
    "margen" DOUBLE PRECISION,
    "seoTitulo" TEXT,
    "seoDescripcion" TEXT,
    "mostrarNadin" BOOLEAN NOT NULL DEFAULT true,
    "envioAutoNadin" BOOLEAN NOT NULL DEFAULT false,
    "metaPixelId" TEXT,
    "ga4Id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tienda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TiendaMetodoPago" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "descuentoPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "instrucciones" TEXT,
    "config" JSONB,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TiendaMetodoPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TiendaEnvio" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gratisDesde" DOUBLE PRECISION,
    "pideDireccion" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TiendaEnvio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TiendaCupon" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimo" DOUBLE PRECISION,
    "usosMax" INTEGER,
    "usos" INTEGER NOT NULL DEFAULT 0,
    "venceAt" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TiendaCupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TiendaProducto" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "oculto" BOOLEAN NOT NULL DEFAULT false,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "precioPropio" DOUBLE PRECISION,
    "titulo" TEXT,
    "descripcion" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TiendaProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenTienda" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente_pago',
    "metodoPagoTipo" TEXT NOT NULL,
    "metodoPagoNombre" TEXT NOT NULL,
    "envioTipo" TEXT NOT NULL,
    "envioNombre" TEXT NOT NULL,
    "envioCosto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cuponCodigo" TEXT,
    "total" DOUBLE PRECISION NOT NULL,
    "totalMayorista" DOUBLE PRECISION NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "clienteEmail" TEXT,
    "clienteTelefono" TEXT NOT NULL,
    "clienteDni" TEXT,
    "direccion" JSONB,
    "nota" TEXT,
    "mpPreferenceId" TEXT,
    "mpPaymentId" TEXT,
    "pedidoId" TEXT,
    "pagadaAt" TIMESTAMP(3),
    "enviadaNadinAt" TIMESTAMP(3),
    "canceladaAt" TIMESTAMP(3),
    "arrepentimiento" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdenTienda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenTiendaItem" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "sku" TEXT,
    "brand" TEXT,
    "nombre" TEXT NOT NULL,
    "talle" TEXT,
    "color" TEXT,
    "imagen" TEXT,
    "qty" INTEGER NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "mayorista" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrdenTiendaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tienda_userId_key" ON "Tienda"("userId");
CREATE UNIQUE INDEX "Tienda_slug_key" ON "Tienda"("slug");
CREATE UNIQUE INDEX "Tienda_dominioPropio_key" ON "Tienda"("dominioPropio");
CREATE INDEX "TiendaMetodoPago_tiendaId_idx" ON "TiendaMetodoPago"("tiendaId");
CREATE INDEX "TiendaEnvio_tiendaId_idx" ON "TiendaEnvio"("tiendaId");
CREATE UNIQUE INDEX "TiendaCupon_tiendaId_codigo_key" ON "TiendaCupon"("tiendaId", "codigo");
CREATE UNIQUE INDEX "TiendaProducto_tiendaId_productId_key" ON "TiendaProducto"("tiendaId", "productId");
CREATE UNIQUE INDEX "OrdenTienda_token_key" ON "OrdenTienda"("token");
CREATE UNIQUE INDEX "OrdenTienda_pedidoId_key" ON "OrdenTienda"("pedidoId");
CREATE INDEX "OrdenTienda_tiendaId_createdAt_idx" ON "OrdenTienda"("tiendaId", "createdAt");
CREATE INDEX "OrdenTienda_estado_idx" ON "OrdenTienda"("estado");
CREATE INDEX "OrdenTiendaItem_ordenId_idx" ON "OrdenTiendaItem"("ordenId");

-- AddForeignKey
ALTER TABLE "Tienda" ADD CONSTRAINT "Tienda_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TiendaMetodoPago" ADD CONSTRAINT "TiendaMetodoPago_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TiendaEnvio" ADD CONSTRAINT "TiendaEnvio_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TiendaCupon" ADD CONSTRAINT "TiendaCupon_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TiendaProducto" ADD CONSTRAINT "TiendaProducto_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrdenTienda" ADD CONSTRAINT "OrdenTienda_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrdenTiendaItem" ADD CONSTRAINT "OrdenTiendaItem_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenTienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seguridad: bloquear acceso por la API pública de Supabase (anon/authenticated).
-- Prisma se conecta con el rol dueño de la base y no se ve afectado.
ALTER TABLE "Tienda" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TiendaMetodoPago" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TiendaEnvio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TiendaCupon" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TiendaProducto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrdenTienda" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrdenTiendaItem" ENABLE ROW LEVEL SECURITY;
