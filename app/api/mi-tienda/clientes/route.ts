// Clientas de la tienda: las que compraron (armado con los pedidos) + las que dejaron sus datos
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAndTienda, noAuth } from '@/lib/mi-tienda';

export const dynamic = 'force-dynamic';
const PAGADAS = ['pagada', 'enviada_nadin', 'lista', 'entregada'];

export async function GET() {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const tiendaId = ctx.tienda.id;
  const [ordenes, contactos] = await Promise.all([
    prisma.ordenTienda.findMany({ where: { tiendaId }, orderBy: { createdAt: 'desc' }, select: { clienteNombre: true, clienteEmail: true, clienteTelefono: true, total: true, estado: true, createdAt: true, direccion: true } }),
    prisma.tiendaContacto.findMany({ where: { tiendaId }, orderBy: { createdAt: 'desc' } }),
  ]);
  const norm = (t: string | null) => (t || '').replace(/\D/g, '').slice(-10);
  const mapa = new Map<string, any>();
  for (const o of ordenes) {
    const k = norm(o.clienteTelefono) || (o.clienteEmail || '').toLowerCase();
    if (!k) continue;
    const c = mapa.get(k) || { nombre: o.clienteNombre, email: o.clienteEmail, telefono: o.clienteTelefono, localidad: (o.direccion as any)?.localidad || '', pedidos: 0, comprados: 0, gastado: 0, ultima: o.createdAt, origen: 'compra' };
    c.pedidos++;
    if (PAGADAS.includes(o.estado)) { c.comprados++; c.gastado += o.total; }
    if (!c.email && o.clienteEmail) c.email = o.clienteEmail;
    mapa.set(k, c);
  }
  for (const ct of contactos) {
    const k = norm(ct.telefono) || (ct.email || '').toLowerCase();
    if (!k || mapa.has(k)) continue;
    mapa.set(k, { nombre: ct.nombre || '', email: ct.email, telefono: ct.telefono, localidad: '', pedidos: 0, comprados: 0, gastado: 0, ultima: ct.createdAt, origen: 'suscripta' });
  }
  const clientes = Array.from(mapa.values()).sort((a, b) => +new Date(b.ultima) - +new Date(a.ultima));
  return NextResponse.json({ clientes });
}

// Borra los datos de una clienta que lo pidió: suscripciones del pop-up y carritos abandonados.
// Los pedidos se conservan como respaldo de la venta.
export async function DELETE(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const tiendaId = ctx.tienda.id;
  const b: any = await req.json().catch(() => ({}));
  const tel = String(b.telefono || '').replace(/\D/g, '').slice(-10);
  const email = String(b.email || '').trim().toLowerCase();
  if (!tel && !email) return NextResponse.json({ error: 'Falta teléfono o email' }, { status: 400 });
  const coincide = (t: string | null, e: string | null) =>
    (!!tel && (t || '').replace(/\D/g, '').slice(-10) === tel) || (!!email && (e || '').toLowerCase() === email);

  const [contactos, carritos] = await Promise.all([
    prisma.tiendaContacto.findMany({ where: { tiendaId }, select: { id: true, telefono: true, email: true } }),
    prisma.tiendaCarrito.findMany({ where: { tiendaId }, select: { id: true, telefono: true, email: true } }),
  ]);
  const idsC = contactos.filter((c) => coincide(c.telefono, c.email)).map((c) => c.id);
  const idsK = carritos.filter((c) => coincide(c.telefono, c.email)).map((c) => c.id);
  await prisma.$transaction([
    prisma.tiendaContacto.deleteMany({ where: { id: { in: idsC } } }),
    prisma.tiendaCarrito.deleteMany({ where: { id: { in: idsK } } }),
  ]);
  return NextResponse.json({ ok: true, borrados: idsC.length + idsK.length });
}
