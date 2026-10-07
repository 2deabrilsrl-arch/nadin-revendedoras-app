// Abre la tienda de la revendedora logueada (link "Ver mi tienda" del menú)
import { NextResponse } from 'next/server';
import { getUserAndTienda } from '@/lib/mi-tienda';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return NextResponse.redirect(new URL('/login', req.url));
  return NextResponse.redirect(new URL(`/t/${ctx.tienda.slug}`, req.url));
}
