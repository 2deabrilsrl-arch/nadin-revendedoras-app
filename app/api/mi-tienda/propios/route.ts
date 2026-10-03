// Productos propios de la revendedora (los que vende por su cuenta, no son de Nadin)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAndTienda, noAuth, bad } from '@/lib/mi-tienda';

export const dynamic = 'force-dynamic';
const MAX_PRODUCTOS = 300;

const txt = (v: any, max: number) => String(v ?? '').trim().slice(0, max);
const httpsUrl = (v: any) => {
  const s = String(v || '').trim();
  return /^https:\/\/[^\s"'<>]+$/i.test(s) ? s.slice(0, 500) : '';
};

function limpiar(b: any) {
  const nombre = txt(b.nombre, 120);
  if (!nombre) throw new Error('Poné un nombre al producto.');
  const variantes = (Array.isArray(b.variantes) ? b.variantes : [])
    .slice(0, 60)
    .map((v: any) => ({
      id: v.id ? txt(v.id, 40) : undefined,
      talle: txt(v.talle, 40),
      color: txt(v.color, 40),
      precio: Math.round(Number(v.precio) || 0),
      stock: Math.max(0, Math.min(99999, Math.floor(Number(v.stock) || 0))),
      sku: txt(v.sku, 60) || null,
    }))
    .filter((v: any) => v.precio > 0);
  if (!variantes.length) throw new Error('Cargá al menos un precio.');
  return {
    nombre,
    descripcion: txt(b.descripcion, 4000) || null,
    categoria: txt(b.categoria, 120).replace(/\s*>\s*/g, ' > ') || 'Otros',
    imagenes: (Array.isArray(b.imagenes) ? b.imagenes : []).map(httpsUrl).filter(Boolean).slice(0, 8),
    activo: b.activo !== false,
    destacado: !!b.destacado,
    variantes,
  };
}

export async function GET() {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const productos = await prisma.tiendaProductoPropio.findMany({
    where: { tiendaId: ctx.tienda.id },
    include: { variantes: { orderBy: { id: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ productos });
}

export async function POST(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const b: any = await req.json().catch(() => ({}));
  let d;
  try { d = limpiar(b); } catch (e: any) { return bad(e.message); }
  const total = await prisma.tiendaProductoPropio.count({ where: { tiendaId: ctx.tienda.id } });
  if (total >= MAX_PRODUCTOS) return bad(`Podés cargar hasta ${MAX_PRODUCTOS} productos propios.`);
  const { variantes, ...prod } = d;
  const p = await prisma.tiendaProductoPropio.create({
    data: { ...prod, tiendaId: ctx.tienda.id, variantes: { create: variantes.map(({ id, ...v }: any) => v) } },
    include: { variantes: true },
  });
  return NextResponse.json({ producto: p });
}

export async function PUT(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const b: any = await req.json().catch(() => ({}));
  const id = txt(b.id, 40);
  const actual = await prisma.tiendaProductoPropio.findFirst({ where: { id, tiendaId: ctx.tienda.id }, include: { variantes: true } });
  if (!actual) return bad('Producto no encontrado.', 404);
  let d;
  try { d = limpiar(b); } catch (e: any) { return bad(e.message); }
  const { variantes, ...prod } = d;
  const existentes = new Set(actual.variantes.map((v) => v.id));
  const quedan = variantes.filter((v: any) => v.id && existentes.has(v.id));
  const nuevas = variantes.filter((v: any) => !v.id || !existentes.has(v.id));
  const p = await prisma.$transaction(async (tx) => {
    await tx.tiendaVariantePropia.deleteMany({ where: { productoId: id, id: { notIn: quedan.map((v: any) => v.id) } } });
    for (const { id: vid, ...v } of quedan) await tx.tiendaVariantePropia.update({ where: { id: vid }, data: v });
    if (nuevas.length) await tx.tiendaVariantePropia.createMany({ data: nuevas.map(({ id: _x, ...v }: any) => ({ ...v, productoId: id })) });
    return tx.tiendaProductoPropio.update({ where: { id }, data: prod, include: { variantes: true } });
  });
  return NextResponse.json({ producto: p });
}

export async function DELETE(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const id = txt(new URL(req.url).searchParams.get('id'), 40);
  const r = await prisma.tiendaProductoPropio.deleteMany({ where: { id, tiendaId: ctx.tienda.id } });
  if (!r.count) return bad('Producto no encontrado.', 404);
  return NextResponse.json({ ok: true });
}
