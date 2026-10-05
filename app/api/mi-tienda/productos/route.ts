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
  const [catalogo, overrides] = await Promise.all([
    getCatalogoTienda(tienda),
    prisma.tiendaProducto.findMany({ where: { tiendaId: tienda.id } }),
  ]);
  const ocultos = overrides.filter((o) => o.oculto).map((o) => o.productId);
  // ?ids=a,b,c → esos productos en ese orden (para el selector de "elegidos a mano")
  const ids = (new URL(req.url).searchParams.get('ids') || '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 48);
  const porId = new Map(catalogo.map((p) => [p.id, p]));
  const lista = ids.length
    ? (ids.map((id) => porId.get(id)).filter(Boolean) as typeof catalogo)
    : (q ? buscar(catalogo, q) : catalogo.filter((p) => p.destacado)).slice(0, 40);
  return NextResponse.json({
    productos: lista.map((p) => ({ id: p.id, nombre: p.nombre, image: p.image, precio: p.precioDesde, destacado: p.destacado, disponible: p.disponible })),
    ocultos: ocultos.length,
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
