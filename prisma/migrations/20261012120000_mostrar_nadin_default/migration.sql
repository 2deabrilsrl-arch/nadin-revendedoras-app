-- Las tiendas nuevas muestran "Productos de Nadin Lencería" al pie (las existentes no cambian)
ALTER TABLE "Tienda" ALTER COLUMN "mostrarNadin" SET DEFAULT true;
