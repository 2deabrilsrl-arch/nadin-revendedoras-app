// Formas de entrega de mi tienda
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAndTienda, noAuth, bad, s, sOrNull, num, bool } from '@/lib/mi-tienda';

export const dynamic = 'force-dynamic';
const TIPOS = ['retiro', 'domicilio', 'correo'];

function campos(b: any) {
  return {
    nombre: s(b.nombre, 80),
    descripcion: sOrNull(b.descripcion, 200),
    precio: num(b.precio, 0, 1e7) ?? undefined,
    gratisDesde: num(b.gratisDesde, 0, 1e8),
    pideDireccion: bool(b.pideDireccion),
    activo: bool(b.activo),
  };
}

export async function GET() {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const envios = await prisma.tiendaEnvio.findMany({ where: { tiendaId: ctx.tienda.id }, orderBy: { orden: 'asc' } });
  return NextResponse.json({ envios });
}

export async function POST(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const b: any = await req.json().catch(() => ({}));
  if (!TIPOS.includes(b.tipo)) return bad('Tipo de envío inválido.');
  const c = campos(b);
  if (!c.nombre) return bad('Poné un nombre (ej. "Envío en moto Rosario").');
  const count = await prisma.tiendaEnvio.count({ where: { tiendaId: ctx.tienda.id } });
  const e = await prisma.tiendaEnvio.create({
    data: {
      tiendaId: ctx.tienda.id,
      tipo: b.tipo,
      nombre: c.nombre,
      descripcion: c.descripcion ?? null,
      precio: c.precio ?? 0,
      gratisDesde: c.gratisDesde ?? null,
      pideDireccion: c.pideDireccion ?? b.tipo !== 'retiro',
      activo: true,
      orden: count + 1,
    },
  });
  return NextResponse.json({ envio: e });
}

export async function PUT(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const b: any = await req.json().catch(() => ({}));
  const e = await prisma.tiendaEnvio.findFirst({ where: { id: String(b.id || ''), tiendaId: ctx.tienda.id } });
  if (!e) return bad('Envío no encontrado.', 404);
  const data: any = campos(b);
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  const upd = await prisma.tiendaEnvio.update({ where: { id: e.id }, data });
  return NextResponse.json({ envio: upd });
}

export async function DELETE(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const id = new URL(req.url).searchParams.get('id') || '';
  await prisma.tiendaEnvio.deleteMany({ where: { id, tiendaId: ctx.tienda.id } });
  return NextResponse.json({ ok: true });
}
