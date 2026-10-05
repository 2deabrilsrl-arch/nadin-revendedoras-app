// Dominio propio de la tienda: ver estado, conectar y desconectar
import { NextResponse } from 'next/server';
import { getUserAndTienda, noAuth, bad } from '@/lib/mi-tienda';
import { conectarDominio, desconectarDominio, revisarDominioTienda, dominioConfigurado } from '@/lib/dominios';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const estado = await revisarDominioTienda(ctx.tienda.id).catch(() => null);
  return NextResponse.json({ habilitado: dominioConfigurado(), estado });
}

export async function POST(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const b: any = await req.json().catch(() => ({}));
  const r = await conectarDominio(ctx.tienda.id, String(b.dominio || ''));
  if (r.error) return bad(r.error);
  return NextResponse.json({ ok: true, estado: r.estado });
}

export async function DELETE() {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  await desconectarDominio(ctx.tienda.id);
  return NextResponse.json({ ok: true });
}
