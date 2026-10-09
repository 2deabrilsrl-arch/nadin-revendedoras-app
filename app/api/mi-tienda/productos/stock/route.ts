// Mi stock en productos de Nadin: la revendedora suma su stock a un talle/color
// de Nadin o agrega talles/colores nuevos. Al vender se usa primero este stock.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAndTienda, noAuth, bad } from '@/lib/mi-tienda';
import { claveVariante } from '@/lib/tienda';

export const dynamic = 'force-dynamic';

const MAX_FILAS = 60;

async function productoNadin(productId: string) {
  const row = await prisma.catalogoCache.findUnique({ where: { productId }, select: { data: true } });
  if (!row) return null;
  try {
    const d = JSON.parse(row.data);
    return {
      id: productId,
      nombre: String(d.name || 'Producto'),
      image: String(d.image || ''),
      variantes: (d.variants || [])
        .filter((v: any) => Number(v.price) > 0)
        .map((v: any) => ({ talle: String(v.talle || ''), color: String(v.color || ''), stockNadin: Math.max(0, Number(v.stock) || 0) })),
    };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const productId = (new URL(req.url).searchParams.get('productId') || '').slice(0, 40);
  if (!productId) return bad('Falta el producto.');
  const p = await productoNadin(productId);
  if (!p) return bad('Producto no encontrado.', 404);
  const extras = await prisma.tiendaStockExtra.findMany({ where: { tiendaId: ctx.tienda.id, productId } });
  const porClave = new Map(extras.map((e) => [e.clave, e]));
  const claves = new Set(p.variantes.map((v: any) => claveVariante(v.talle, v.color)));
  return NextResponse.json({
    producto: { id: p.id, nombre: p.nombre, image: p.image },
    // Talles/colores de Nadin con el stock propio que tenga cargado
    variantes: p.variantes.map((v: any) => ({ ...v, miStock: Math.max(0, porClave.get(claveVariante(v.talle, v.color))?.stock || 0) })),
    // Talles/colores que agregó ella (no existen en Nadin)
    nuevas: extras.filter((e) => !claves.has(e.clave)).map((e) => ({ talle: e.talle, color: e.color, stock: Math.max(0, e.stock), precio: e.precio })),
  });
}

export async function PUT(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const b: any = await req.json().catch(() => ({}));
  const productId = String(b.productId || '').slice(0, 40);
  if (!productId || productId.startsWith('pp')) return bad('Producto no válido.');
  const p = await productoNadin(productId);
  if (!p) return bad('Producto no encontrado.', 404);

  const filas = (Array.isArray(b.filas) ? b.filas : []).slice(0, MAX_FILAS);
  const deseadas = new Map<string, { talle: string; color: string; stock: number; precio: number | null }>();
  for (const f of filas) {
    const talle = String(f?.talle || '').trim().slice(0, 40);
    const color = String(f?.color || '').trim().slice(0, 40);
    const stock = Math.min(9999, Math.max(0, Math.floor(Number(f?.stock) || 0)));
    const precio = Number(f?.precio) > 0 ? Math.min(Math.round(Number(f.precio)), 99999999) : null;
    if (stock <= 0) continue;
    const clave = claveVariante(talle, color);
    const previa = deseadas.get(clave);
    deseadas.set(clave, { talle, color, stock: stock + (previa?.stock || 0), precio: precio ?? previa?.precio ?? null });
  }
  // Los talles/colores nuevos necesitan al menos talle o color (si no, se confunden con el producto)
  const claves = new Set(p.variantes.map((v: any) => claveVariante(v.talle, v.color)));
  for (const [clave, d] of Array.from(deseadas)) {
    if (!claves.has(clave) && clave === '|') return bad('Para agregar un talle o color nuevo completá el talle o el color.');
    if (claves.has(clave)) d.precio = null; // los de Nadin usan el precio de la tienda
  }

  await prisma.$transaction(async (tx) => {
    await tx.tiendaStockExtra.deleteMany({ where: { tiendaId: ctx.tienda.id, productId, clave: { notIn: Array.from(deseadas.keys()) } } });
    for (const [clave, d] of Array.from(deseadas)) {
      await tx.tiendaStockExtra.upsert({
        where: { tiendaId_productId_clave: { tiendaId: ctx.tienda.id, productId, clave } },
        create: { tiendaId: ctx.tienda.id, productId, clave, ...d },
        update: d,
      });
    }
  });
  const total = Array.from(deseadas.values()).reduce((a, d) => a + d.stock, 0);
  return NextResponse.json({ ok: true, total });
}
