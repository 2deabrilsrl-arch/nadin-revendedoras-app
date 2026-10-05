// Salir de la vista previa del borrador (borra la cookie y vuelve a la tienda)
import { NextResponse } from 'next/server';
import { PREVIEW_COOKIE } from '@/lib/tienda';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const volver = url.searchParams.get('volver') || '/';
  const destino = volver.startsWith('/') && !volver.startsWith('//') ? volver : '/';
  const res = NextResponse.redirect(new URL(destino, url.origin));
  res.cookies.set(PREVIEW_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
