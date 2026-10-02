import { getTiendaBySite, getCatalogoTienda, buildCategorias, getTiendaBaseUrl, productPath, type CategoriaNodo } from '@/lib/tienda';

export const dynamic = 'force-dynamic';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function GET(_req: Request, { params }: { params: { site: string } }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda || !tienda.activa) return new Response('Not found', { status: 404 });
  const base = getTiendaBaseUrl(tienda);
  const productos = (await getCatalogoTienda(tienda)).filter((p) => p.disponible);
  const cats: string[] = [];
  const walk = (n: CategoriaNodo[]) => n.forEach((c) => { cats.push(`${base}/categoria/${c.path.join('/')}`); walk(c.hijos); });
  walk(buildCategorias(productos));
  const hoy = new Date().toISOString().slice(0, 10);
  const urls = [
    `<url><loc>${esc(base)}</loc><lastmod>${hoy}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ...cats.map((u) => `<url><loc>${esc(u)}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`),
    ...productos.map((p) => {
      const img = p.image ? `<image:image><image:loc>${esc(p.image)}</image:loc></image:image>` : '';
      return `<url><loc>${esc(base + productPath(p))}</loc><changefreq>weekly</changefreq><priority>0.6</priority>${img}</url>`;
    }),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urls.join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
