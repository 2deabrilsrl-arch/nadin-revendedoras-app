// Botón "Conectar Mercado Pago": manda a la revendedora a autorizar la app de Nadin en MP.
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://nadin-revendedoras-app.vercel.app').replace(/\/$/, '');
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.redirect(`${appUrl()}/login`);
  const clientId = process.env.MP_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(`${appUrl()}/dashboard/mi-tienda?tab=pagos&mp=sin_config`);

  const secret = new TextEncoder().encode(process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || '');
  const state = await new SignJWT({ k: 'mp' }).setProtectedHeader({ alg: 'HS256' }).setSubject(session.uid).setExpirationTime('15m').sign(secret);
  const url = new URL('https://auth.mercadopago.com.ar/authorization');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('platform_id', 'mp');
  url.searchParams.set('state', state);
  url.searchParams.set('redirect_uri', `${appUrl()}/api/mi-tienda/mercadopago/callback`);
  return NextResponse.redirect(url.toString());
}
