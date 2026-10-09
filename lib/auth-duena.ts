// lib/auth-duena.ts
// Controles de "es suyo": una revendedora solo puede ver o tocar sus pedidos,
// consolidaciones y notificaciones. Nadin (vendedora) puede todo.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sesionApi, sinSesion, prohibido } from '@/lib/auth-api';

type Tipo = 'pedido' | 'consolidacion' | 'notificacion';

/** Devuelve una respuesta de error si no corresponde, o null si puede seguir. */
export async function controlDuena(req: Request, tipo: Tipo, id: string): Promise<NextResponse | null> {
  const s = sesionApi(req);
  if (!s) return sinSesion();
  if (s.admin) return null;
  let duena: string | null | undefined;
  if (tipo === 'pedido') duena = (await prisma.pedido.findUnique({ where: { id }, select: { userId: true } }))?.userId;
  else if (tipo === 'consolidacion') duena = (await prisma.consolidacion.findUnique({ where: { id }, select: { userId: true } }))?.userId;
  else duena = (await prisma.notificacion.findUnique({ where: { id }, select: { userId: true } }))?.userId;
  if (duena === undefined) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return duena === s.uid ? null : prohibido();
}
