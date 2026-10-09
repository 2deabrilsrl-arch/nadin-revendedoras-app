// Sitemap de www.mitiendanadin.com: la portada de Tu Tienda + la portada de cada tienda publicada.
// (Cada tienda tiene además su propio sitemap con productos y categorías en su subdominio.)
import { prisma } from '@/lib/prisma';
import { getTiendaBaseUrl } from '@/lib/tienda';
import { esHostRaiz, urlPortadaTiendas } from '@/lib/seo-raiz';

export const dynamic = 'force-dynamic';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function GET(req: Request) {
  if (!esHostRaiz(req.headers.get('host'))) return new Response('Not found', { status: 404 });
  const tiendas = await prisma.tienda.findMany({ where: { activa: true }, select: { slug: true, dominioPropio: true, updatedAt: true } });
  const urls = [
    `<url><loc>${esc(urlPortadaTiendas() + '/')}</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
    ...tiendas.map((t) => `<url><loc>${esc(getTiendaBaseUrl(t) + '/')}</loc><lastmod>${t.updatedAt.toISOString().slice(0, 10)}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
