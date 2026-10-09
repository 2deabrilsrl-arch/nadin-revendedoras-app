// Abre la tienda de la revendedora logueada (link "Ver mi tienda" del menú)
import { NextResponse } from 'next/server';
import { getUserAndTienda } from '@/lib/mi-tienda';
import { getTiendaBaseUrl } from '@/lib/tienda';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return NextResponse.redirect(new URL('/login', req.url));
  // Publicada: su dirección real (sofi.mitiendanadin.com o su dominio). En borrador solo la ve ella, dentro de la app.
  if (ctx.tienda.activa) return NextResponse.redirect(getTiendaBaseUrl(ctx.tienda));
  return NextResponse.redirect(new URL(`/t/${ctx.tienda.slug}`, req.url));
}
