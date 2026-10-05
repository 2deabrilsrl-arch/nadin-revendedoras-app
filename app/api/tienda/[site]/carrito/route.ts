// Guarda el carrito cuando la clienta ya dejó sus datos (para "carritos abandonados")
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTiendaBySite } from '@/lib/tienda';

export const dynamic = 'force-dynamic';
const txt = (v: any, max: number) => String(v ?? '').trim().slice(0, max);
const TOKEN = /^[\w-]{16,60}$/;

export async function POST(req: Request, { params }: { params: { site: string } }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda || !tienda.activa) return NextResponse.json({ ok: true });
  const b: any = await req.json().catch(() => ({}));
  const token = txt(b.token, 60);
  if (!TOKEN.test(token)) return NextResponse.json({ error: 'token' }, { status: 400 });
  const email = txt(b.email, 120).toLowerCase();
  const telefono = txt(b.telefono, 30);
  if (!(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && telefono.replace(/\D/g, '').length < 8) return NextResponse.json({ ok: true });
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 50).map((i: any) => ({
    productId: txt(i.productId, 40), variantId: txt(i.variantId, 40), qty: Math.max(1, Math.min(99, Math.floor(Number(i.qty) || 1))),
    nombre: txt(i.nombre, 120), talle: txt(i.talle, 40), color: txt(i.color, 40), imagen: txt(i.imagen, 500), precio: Number(i.precio) || 0,
  })).filter((i: any) => i.productId && i.variantId);
  if (!items.length) return NextResponse.json({ ok: true });
  const total = items.reduce((a: number, i: any) => a + i.precio * i.qty, 0);
  const existente = await prisma.tiendaCarrito.findUnique({ where: { token } });
  if (existente && existente.tiendaId !== tienda.id) return NextResponse.json({ ok: true });
  if (existente?.estado === 'recuperado') return NextResponse.json({ ok: true });
  const data = { nombre: txt(b.nombre, 100) || null, email: email || null, telefono: telefono || null, items, total };
  if (existente) await prisma.tiendaCarrito.update({ where: { token }, data });
  else await prisma.tiendaCarrito.create({ data: { ...data, token, tiendaId: tienda.id } });
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request, { params }: { params: { site: string } }) {
  const tienda = await getTiendaBySite(params.site);
  const token = txt(new URL(req.url).searchParams.get('token'), 60);
  if (!tienda || !TOKEN.test(token)) return NextResponse.json({ items: [] });
  const c = await prisma.tiendaCarrito.findUnique({ where: { token } });
  if (!c || c.tiendaId !== tienda.id || c.estado === 'recuperado') return NextResponse.json({ items: [] });
  return NextResponse.json({ items: c.items, nombre: c.nombre, email: c.email, telefono: c.telefono });
}
