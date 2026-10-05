// Carritos abandonados de la tienda (dejaron sus datos y no compraron)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAndTienda, noAuth } from '@/lib/mi-tienda';
import { getTiendaBaseUrl } from '@/lib/tienda';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const hace30 = new Date(Date.now() - 30 * 864e5);
  const hace30min = new Date(Date.now() - 30 * 60 * 1000);
  const carritos = await prisma.tiendaCarrito.findMany({
    where: { tiendaId: ctx.tienda.id, estado: { not: 'recuperado' }, updatedAt: { gte: hace30, lte: hace30min } },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
  const base = getTiendaBaseUrl(ctx.tienda);
  return NextResponse.json({ carritos: carritos.map((c) => ({ ...c, link: `${base}/carrito?recuperar=${c.token}` })) });
}
