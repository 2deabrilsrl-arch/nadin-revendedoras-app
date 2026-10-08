// Enviar uno o varios pedidos web a Nadin juntos (una sola consolidación)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAndTienda, noAuth, bad } from '@/lib/mi-tienda';
import { enviarVariasANadin } from '@/lib/tienda-checkout';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const b: any = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(b.ids) ? b.ids.map(String) : [];
  // Solo pedidos de su tienda
  const propias = await prisma.ordenTienda.findMany({ where: { id: { in: ids }, tiendaId: ctx.tienda.id }, select: { id: true } });
  if (!propias.length) return bad('Elegí al menos un pedido.');
  try {
    const r = await enviarVariasANadin(propias.map((o) => o.id), ctx.user.id, {
      consolidar: true,
      formaPago: b.formaPago,
      tipoEnvio: b.tipoEnvio,
      transporteNombre: b.transporteNombre,
    });
    return NextResponse.json({ ok: true, ...r });
  } catch (e: any) {
    return bad(e?.message || 'No se pudo enviar a Nadin.');
  }
}
