// La visitante deja su email o WhatsApp (pop-up de bienvenida)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTiendaBySite } from '@/lib/tienda';
import { normalizarDiseno } from '@/lib/tienda-diseno';

export const dynamic = 'force-dynamic';
const txt = (v: any, max: number) => String(v ?? '').trim().slice(0, max);

export async function POST(req: Request, { params }: { params: { site: string } }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda || !tienda.activa) return NextResponse.json({ error: 'Tienda no disponible' }, { status: 404 });
  const b: any = await req.json().catch(() => ({}));
  if (b.web) return NextResponse.json({ ok: true }); // campo trampa para robots
  const email = txt(b.email, 120).toLowerCase();
  const telefono = txt(b.telefono, 30).replace(/[^\d+ ]/g, '');
  if (!email && telefono.replace(/\D/g, '').length < 8) return NextResponse.json({ error: 'Dejanos tu email o WhatsApp.' }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'El email no es válido.' }, { status: 400 });
  // Evita repetidos del mismo día
  const hoy = new Date(Date.now() - 24 * 3600 * 1000);
  const ya = await prisma.tiendaContacto.findFirst({ where: { tiendaId: tienda.id, createdAt: { gte: hoy }, OR: [email ? { email } : { id: '-' }, telefono ? { telefono } : { id: '-' }] } });
  if (!ya) await prisma.tiendaContacto.create({ data: { tiendaId: tienda.id, nombre: txt(b.nombre, 80) || null, email: email || null, telefono: telefono || null, origen: 'popup' } });
  const popup = normalizarDiseno(tienda.diseno).popup;
  return NextResponse.json({ ok: true, cupon: popup.cupon || null });
}
