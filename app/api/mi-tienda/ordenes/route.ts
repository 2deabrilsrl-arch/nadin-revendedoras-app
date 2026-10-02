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
  const pendientesEnvio = ordenes.filter((o) => o.estado === 'pagada').length;
  return NextResponse.json({ ordenes, pendientesEnvio });
}
