// robots.txt de la app y del dominio de las tiendas.
// - www.mitiendanadin.com: se indexa la portada de Tu Tienda (y su sitemap con todas las tiendas publicadas).
// - La app (vercel.app): privada, no se indexa. Cada tienda tiene su propio robots.txt en su subdominio.
import { esHostRaiz, urlPortadaTiendas } from '@/lib/seo-raiz';

export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  const txt = esHostRaiz(req.headers.get('host'))
    ? `User-agent: *\nAllow: /$\nAllow: /tu-tienda\nAllow: /manual-tu-tienda.pdf\nAllow: /_next/\nAllow: /icons/\nAllow: /favicon.ico\nDisallow: /\n\nSitemap: ${urlPortadaTiendas()}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n\n# App privada para revendedoras de Nadin Lencería\n';
  return new Response(txt, { headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=3600' } });
}
