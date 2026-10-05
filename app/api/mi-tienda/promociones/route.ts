// Promociones automáticas de la tienda (3x2, 2x1, % off por categoría…)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAndTienda, noAuth, bad } from '@/lib/mi-tienda';

export const dynamic = 'force-dynamic';
const txt = (v: any, max: number) => String(v ?? '').trim().slice(0, max);
const fecha = (v: any) => { const d = v ? new Date(v) : null; return d && !isNaN(+d) ? d : null; };

function limpiar(b: any) {
  const tipo = b.tipo === 'porcentaje' ? 'porcentaje' : 'nxm';
  const lleva = Math.max(2, Math.min(10, Math.round(Number(b.lleva) || 3)));
  const paga = Math.max(1, Math.min(lleva - 1, Math.round(Number(b.paga) || lleva - 1)));
  const porcentaje = Math.max(1, Math.min(90, Math.round(Number(b.porcentaje) || 0)));
  const alcance = ['todo', 'categoria', 'productos'].includes(b.alcance) ? b.alcance : 'todo';
  const categoria = alcance === 'categoria' ? txt(b.categoria, 200).replace(/[^\w\-/]/g, '') : null;
  if (alcance === 'categoria' && !categoria) throw new Error('Elegí la categoría.');
  const productos = alcance === 'productos' ? (Array.isArray(b.productos) ? b.productos : []).map((x: any) => txt(x, 40)).filter(Boolean).slice(0, 100) : [];
  if (alcance === 'productos' && !productos.length) throw new Error('Elegí al menos un producto.');
  if (tipo === 'porcentaje' && !Number(b.porcentaje)) throw new Error('Poné el % de descuento.');
  const nombre = txt(b.nombre, 60) || (tipo === 'nxm' ? `Llevá ${lleva} pagá ${paga}` : `${porcentaje}% OFF`);
  return { nombre, tipo, lleva, paga, porcentaje: tipo === 'porcentaje' ? porcentaje : 0, alcance, categoria, productos, desde: fecha(b.desde), hasta: fecha(b.hasta), activa: b.activa !== false };
}

export async function GET() {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const promociones = await prisma.tiendaPromocion.findMany({ where: { tiendaId: ctx.tienda.id }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ promociones });
}

export async function POST(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  let d;
  try { d = limpiar(await req.json()); } catch (e: any) { return bad(e.message || 'Datos inválidos'); }
  if ((await prisma.tiendaPromocion.count({ where: { tiendaId: ctx.tienda.id } })) >= 20) return bad('Podés tener hasta 20 promociones.');
  const promocion = await prisma.tiendaPromocion.create({ data: { ...d, tiendaId: ctx.tienda.id } as any });
  return NextResponse.json({ promocion });
}

export async function PUT(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const b: any = await req.json().catch(() => ({}));
  const r = await prisma.tiendaPromocion.updateMany({ where: { id: txt(b.id, 40), tiendaId: ctx.tienda.id }, data: { activa: !!b.activa } });
  if (!r.count) return bad('Promoción no encontrada.', 404);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const id = txt(new URL(req.url).searchParams.get('id'), 40);
  await prisma.tiendaPromocion.deleteMany({ where: { id, tiendaId: ctx.tienda.id } });
  return NextResponse.json({ ok: true });
}
