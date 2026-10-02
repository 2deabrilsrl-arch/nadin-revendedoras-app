// Vuelta de Mercado Pago con el "code": lo canjeamos por el token de la revendedora.
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://nadin-revendedoras-app.vercel.app').replace(/\/$/, '');
}

export async function GET(req: Request) {
  const back = (r: string) => NextResponse.redirect(`${appUrl()}/dashboard/mi-tienda?tab=pagos&mp=${r}`);
  const u = new URL(req.url);
  const code = u.searchParams.get('code');
  const state = u.searchParams.get('state');
  if (!code || !state) return back('cancelado');

  let uid: string;
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || '');
    const { payload } = await jwtVerify(state, secret, { algorithms: ['HS256'] });
    if (payload.k !== 'mp' || !payload.sub) return back('error');
    uid = payload.sub;
  } catch {
    return back('vencido');
  }

  const r = await fetch('https://api.mercadopago.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.MP_CLIENT_ID,
      client_secret: process.env.MP_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${appUrl()}/api/mi-tienda/mercadopago/callback`,
    }),
  });
  if (!r.ok) {
    console.error('MP oauth', r.status, await r.text().catch(() => ''));
    return back('error');
  }
  const t: any = await r.json();
  const tienda = await prisma.tienda.findUnique({ where: { userId: uid } });
  if (!tienda) return back('error');

  const config = {
    accessToken: t.access_token,
    publicKey: t.public_key,
    refreshToken: t.refresh_token,
    userId: t.user_id,
    expiresAt: new Date(Date.now() + (Number(t.expires_in) || 0) * 1000).toISOString(),
  };
  const existing = await prisma.tiendaMetodoPago.findFirst({ where: { tiendaId: tienda.id, tipo: 'mercadopago' } });
  if (existing) {
    await prisma.tiendaMetodoPago.update({ where: { id: existing.id }, data: { config, activo: true } });
  } else {
    await prisma.tiendaMetodoPago.create({
      data: { tiendaId: tienda.id, tipo: 'mercadopago', nombre: 'Mercado Pago (tarjetas, débito y dinero en cuenta)', config, activo: true, orden: 0 },
    });
  }
  return back('ok');
}
