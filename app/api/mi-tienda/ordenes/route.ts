// Pedidos web de mi tienda
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAndTienda, noAuth } from '@/lib/mi-tienda';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const estado = new URL(req.url).searchParams.get('estado');
  const ordenes = await prisma.ordenTienda.findMany({
    where: { tiendaId: ctx.tienda.id, ...(estado ? { estado } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { items: true },
  });
  // Pedidos que se mandaron a Nadin "sin consolidar": todavía se pueden juntar y enviar
  const pedidoIds = ordenes.map((o) => o.pedidoId).filter(Boolean) as string[];
  const pedidos = pedidoIds.length ? await prisma.pedido.findMany({ where: { id: { in: pedidoIds } }, select: { id: true, estado: true } }) : [];
  const estadoPedido = new Map(pedidos.map((p) => [p.id, p.estado]));
  const conEstado = ordenes.map((o) => ({
    ...o,
    paraEnviar:
      (o.estado === 'pagada' && !o.pedidoId && o.items.some((i) => !i.propio)) ||
      (o.estado === 'enviada_nadin' && !!o.pedidoId && estadoPedido.get(o.pedidoId) === 'pendiente'),
  }));
  const pendientesEnvio = conEstado.filter((o) => o.paraEnviar).length;
  return NextResponse.json({ ordenes: conEstado, pendientesEnvio });
}
