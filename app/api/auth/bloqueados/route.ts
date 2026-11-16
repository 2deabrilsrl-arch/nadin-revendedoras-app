// Lista de usuarias bloqueadas, para que el middleware corte las sesiones abiertas (cache de 1 minuto allá).
// Solo responde si viene la clave interna (la misma SESSION_SECRET que conoce el middleware).
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const clave = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || '';
  if (!clave || req.headers.get('x-clave-interna') !== clave) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const users = await prisma.user.findMany({ where: { bloqueado: true }, select: { id: true } });
  return NextResponse.json({ ids: users.map((u) => u.id) });
}
