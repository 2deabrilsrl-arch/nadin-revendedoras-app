// Link corto para redes: /manual → PDF con el manual completo de Tu Tienda
import { NextResponse } from 'next/server';

export function GET(req: Request) {
  return NextResponse.redirect(new URL('/manual-tu-tienda.pdf', req.url), 307);
}
