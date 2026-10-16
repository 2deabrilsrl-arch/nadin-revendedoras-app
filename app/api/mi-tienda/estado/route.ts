// Estado de la tienda web para el aviso del inicio de la app.
// A diferencia de GET /api/mi-tienda, NO crea la tienda si no existe.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { noAuth, progresoTienda } from '@/lib/mi-tienda';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return noAuth();
  const tienda = await prisma.tienda.findUnique({ where: { userId: user.id } });
  if (!tienda) return NextResponse.json({ tiene: false });
  return NextResponse.json({ tiene: true, activa: !!tienda.activa, nombre: tienda.nombre, progreso: await progresoTienda(tienda) });
}
