// Cron cada 2 minutos: trae de Tiendanube solo los productos que cambiaron (stock, precio, publicado).
import { NextResponse } from 'next/server';
import { syncCatalogIncremental } from '@/lib/catalog-sync';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  // Vercel manda "Authorization: Bearer <CRON_SECRET>" si la variable existe
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const r = await syncCatalogIncremental(10);
    return NextResponse.json(r, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('sync-catalog-rapido:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Error' }, { status: 500 });
  }
}
