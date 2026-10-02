// Webhook de Mercado Pago para pagos de las Tiendas Nadin.
// No confiamos en el contenido: consultamos el pago a MP con el token de la revendedora.
import { NextResponse } from 'next/server';
import { verificarPagoMP } from '@/lib/tienda-checkout';

export const dynamic = 'force-dynamic';

async function handle(req: Request) {
  const url = new URL(req.url);
  const ordenId = url.searchParams.get('orden');
  let body: any = {};
  try { body = await req.json(); } catch { /* MP a veces manda solo query */ }
  const tipo = body?.type || body?.topic || url.searchParams.get('type') || url.searchParams.get('topic');
  const paymentId = body?.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id');

  if (ordenId && paymentId && (tipo === 'payment' || !tipo)) {
    try {
      await verificarPagoMP(ordenId, String(paymentId));
    } catch (e) {
      console.error('webhook MP', e);
      return NextResponse.json({ ok: false }, { status: 500 }); // MP reintenta
    }
  }
  return NextResponse.json({ ok: true });
}

export const POST = handle;
export const GET = handle;
