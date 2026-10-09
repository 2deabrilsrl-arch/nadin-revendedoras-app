// Productos de mi tienda: destacar / ocultar
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAndTienda, noAuth, bad, bool } from '@/lib/mi-tienda';
import { getTiendaBySite, getCatalogoTienda, buscar } from '@/lib/tienda';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const q = (new URL(req.url).searchParams.get('q') || '').slice(0, 80);
  const tienda = await getTiendaBySite(ctx.tienda.slug);
  if (!tienda) return bad('Tienda no encontrada', 404);
  const [catalogo, overrides, extras] = await Promise.all([
    getCatalogoTienda(tienda),
    prisma.tiendaProducto.findMany({ where: { tiendaId: tienda.id } }),
    prisma.tiendaStockExtra.findMany({ where: { tiendaId: tienda.id, stock: { gt: 0 } }, select: { productId: true, stock: true } }),
  ]);
  // Stock propio cargado sobre productos de Nadin
  const miStock = new Map<string, number>();
  for (const e of extras) miStock.set(e.productId, (miStock.get(e.productId) || 0) + e.stock);
  const mios = new URL(req.url).searchParams.get('mios') === '1';
  const ocultos = overrides.filter((o) => o.oculto).map((o) => o.productId);
  // ?ids=a,b,c → esos productos en ese orden (para el selector de "elegidos a mano")
  const ids = (new URL(req.url).searchParams.get('ids') || '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 48);
  const porId = new Map(catalogo.map((p) => [p.id, p]));
  const lista = ids.length
    ? (ids.map((id) => porId.get(id)).filter(Boolean) as typeof catalogo)
    : mios
      ? catalogo.filter((p) => miStock.has(p.id)).slice(0, 200)
      : (q ? buscar(catalogo, q) : catalogo.filter((p) => p.destacado)).slice(0, 40);
  // Venta manual: con talles/colores, precio y stock para elegir
  if (new URL(req.url).searchParams.get('variantes') === '1') {
    return NextResponse.json({
      productos: (q ? buscar(catalogo, q) : catalogo.filter((p) => p.destacado || p.propio)).filter((p) => p.disponible).slice(0, 20).map((p) => ({
        id: p.id, nombre: p.nombre, image: p.image, propio: !!p.propio,
        variantes: p.variantes.filter((v) => v.stock > 0).map((v) => ({ id: v.id, talle: v.talle, color: v.color, precio: v.precio, stock: v.stock, stockPropio: v.stockPropio || 0 })),
      })),
    });
  }
  return NextResponse.json({
    productos: lista.map((p) => ({ id: p.id, nombre: p.nombre, image: p.image, precio: p.precioDesde, destacado: p.destacado, disponible: p.disponible, propio: !!p.propio, miStock: miStock.get(p.id) || 0 })),
    ocultos: ocultos.length,
    conMiStock: miStock.size,
  });
}

export async function PUT(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const b: any = await req.json().catch(() => ({}));
  const productId = String(b.productId || '').slice(0, 40);
  if (!productId) return bad('Falta el producto.');
  // Productos propios: se guardan en su propia tabla
  if (productId.startsWith('pp')) {
    const data: any = {};
    if (typeof b.destacado === 'boolean') data.destacado = b.destacado;
    if (typeof b.oculto === 'boolean') data.activo = !b.oculto;
    const r = await prisma.tiendaProductoPropio.updateMany({ where: { id: productId.slice(2), tiendaId: ctx.tienda.id }, data });
    if (!r.count) return bad('Producto no encontrado.', 404);
    return NextResponse.json({ ok: true });
  }
  const existe = await prisma.catalogoCache.findUnique({ where: { productId }, select: { id: true } });
  if (!existe) return bad('Producto no encontrado.', 404);
  const data: any = { destacado: bool(b.destacado), oculto: bool(b.oculto) };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  const r = await prisma.tiendaProducto.upsert({
    where: { tiendaId_productId: { tiendaId: ctx.tienda.id, productId } },
    create: { tiendaId: ctx.tienda.id, productId, ...data },
    update: data,
  });
  return NextResponse.json({ producto: r });
}
