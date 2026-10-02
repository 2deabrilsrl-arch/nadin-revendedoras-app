// Cupones de descuento de mi tienda
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAndTienda, noAuth, bad, s, num, bool } from '@/lib/mi-tienda';

export const dynamic = 'force-dynamic';
const TIPOS = ['porcentaje', 'monto', 'envio_gratis'];

export async function GET() {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const cupones = await prisma.tiendaCupon.findMany({ where: { tiendaId: ctx.tienda.id }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ cupones });
}

export async function POST(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const b: any = await req.json().catch(() => ({}));
  const codigo = (s(b.codigo, 20) || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (codigo.length < 3) return bad('El código tiene que tener al menos 3 letras o números.');
  if (!TIPOS.includes(b.tipo)) return bad('Tipo de cupón inválido.');
  const valor = b.tipo === 'envio_gratis' ? 0 : num(b.valor, 0, b.tipo === 'porcentaje' ? 90 : 1e8);
  if (b.tipo !== 'envio_gratis' && !valor) return bad('Indicá el valor del descuento.');
  const venceAt = b.venceAt ? new Date(b.venceAt) : null;
  if (venceAt && isNaN(venceAt.getTime())) return bad('Fecha de vencimiento inválida.');
  try {
    const c = await prisma.tiendaCupon.create({
      data: {
        tiendaId: ctx.tienda.id, codigo, tipo: b.tipo, valor: valor || 0,
        minimo: num(b.minimo, 0, 1e8) ?? null,
        usosMax: b.usosMax ? Math.floor(Number(num(b.usosMax, 1, 1e6))) : null,
        venceAt,
      },
    });
    return NextResponse.json({ cupon: c });
  } catch {
    return bad('Ya tenés un cupón con ese código.');
  }
}

export async function PUT(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const b: any = await req.json().catch(() => ({}));
  const activo = bool(b.activo);
  if (activo === undefined) return bad('Nada para actualizar.');
  const r = await prisma.tiendaCupon.updateMany({ where: { id: String(b.id || ''), tiendaId: ctx.tienda.id }, data: { activo } });
  if (!r.count) return bad('Cupón no encontrado.', 404);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const id = new URL(req.url).searchParams.get('id') || '';
  await prisma.tiendaCupon.deleteMany({ where: { id, tiendaId: ctx.tienda.id } });
  return NextResponse.json({ ok: true });
}
