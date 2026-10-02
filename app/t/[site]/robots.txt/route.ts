import { getTiendaBySite, getTiendaBaseUrl } from '@/lib/tienda';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { site: string } }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda || !tienda.activa) {
    return new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain' } });
  }
  const base = getTiendaBaseUrl(tienda);
  const body = `User-agent: *\nAllow: /\nDisallow: /carrito\nDisallow: /pedido/\nDisallow: /buscar\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=3600' } });
}
