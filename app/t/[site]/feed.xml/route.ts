// Catálogo de la tienda para Google (Merchant Center / Google Shopping) y Meta (Instagram y Facebook Shops).
// Formato RSS 2.0 con el espacio "g:" de Google; Meta acepta el mismo archivo.
// Un ítem por talle/color, agrupados por producto (item_group_id).
import { prisma } from '@/lib/prisma';
import { getTiendaBySite, getCatalogoTienda, getTiendaBaseUrl, productPath, stripHtml, esIdPropio, PREFIJO_PROPIO } from '@/lib/tienda';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Texto limpio para XML: decodifica entidades HTML (&mdash;, &#128203;…) y quita caracteres
// de control, que hacen inválido todo el archivo y Google/Meta lo rechazan.
const ENTIDADES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', laquo: '«', raquo: '»', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', bull: '•', deg: '°', ordm: 'º', ordf: 'ª', iexcl: '¡', iquest: '¿', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', ntilde: 'ñ', Ntilde: 'Ñ', uuml: 'ü', Uuml: 'Ü' };
function limpio(s: string | null | undefined): string {
  return String(s || '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === '#') {
        const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        try { return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : ' '; } catch { return ' '; }
      }
      return ENTIDADES[e] ?? m;
    })
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFE\uFFFF]/g, ' ')
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
// Ropa de chicos: Google pide age_group "kids" (si no, rechaza o muestra mal el producto).
const RE_CHICOS = /(?<!\p{L})(niñ[oa]s?|nen[ae]s?|infantil(es)?|beb[eé]s?|kids?|teens?|juvenil(es)?)(?!\p{L})/iu;

const esc = (s: string) => limpio(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cdata = (s: string) => `<![CDATA[${limpio(s).replace(/]]>/g, ']]')}]]>`;
const precio = (n: number) => `${Math.round(n)}.00 ARS`;

export async function GET(_req: Request, { params }: { params: { site: string } }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda || !tienda.activa) return new Response('Not found', { status: 404 });
  const base = getTiendaBaseUrl(tienda);
  const productos = (await getCatalogoTienda(tienda)).filter((p) => p.disponible && p.image);

  // Descripciones (las de Nadin vienen del catálogo; las propias, de su tabla)
  const idsNadin = productos.filter((p) => !p.propio).map((p) => p.id);
  const idsPropios = productos.filter((p) => p.propio).map((p) => p.id.slice(PREFIJO_PROPIO.length));
  const [descNadin, descPropios, overrides] = await Promise.all([
    prisma.catalogoCache.findMany({ where: { productId: { in: idsNadin } }, select: { productId: true, descripcion: true } }),
    prisma.tiendaProductoPropio.findMany({ where: { id: { in: idsPropios } }, select: { id: true, descripcion: true } }),
    prisma.tiendaProducto.findMany({ where: { tiendaId: tienda.id, descripcion: { not: null } }, select: { productId: true, descripcion: true } }),
  ]);
  const desc = new Map<string, string>();
  for (const d of descNadin) desc.set(d.productId, stripHtml(d.descripcion));
  for (const d of descPropios) desc.set(`${PREFIJO_PROPIO}${d.id}`, d.descripcion || '');
  for (const o of overrides) desc.set(o.productId, stripHtml(o.descripcion));

  const items: string[] = [];
  for (const p of productos) {
    const link = `${base}${productPath(p)}`;
    const texto = limpio(desc.get(p.id) || `${p.nombre}. Comprá online en ${tienda.nombre}.`).slice(0, 4900);
    const categoria = p.category.split('>').map((c) => c.trim()).filter(Boolean).join(' > ');
    const extra = p.images.slice(1, 10).map((u) => `<g:additional_image_link>${esc(u)}</g:additional_image_link>`).join('');
    const marca = p.brand || tienda.nombre;
    for (const v of p.variantes) {
      const conOferta = !!(v.precioAntes && v.precioAntes > v.precio);
      const titulo = limpio([p.nombre, v.color, v.talle && `Talle ${v.talle}`].filter(Boolean).join(' - ')).slice(0, 150);
      items.push(`<item>
<g:id>${esc(`${tienda.slug}-${v.id}`)}</g:id>
<g:item_group_id>${esc(`${tienda.slug}-${p.id}`)}</g:item_group_id>
<g:title>${cdata(titulo)}</g:title>
<g:description>${cdata(texto)}</g:description>
<g:link>${esc(link)}</g:link>
<g:image_link>${esc(p.image)}</g:image_link>${extra}
<g:availability>${v.stock > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
<g:price>${precio(conOferta ? v.precioAntes! : v.precio)}</g:price>${conOferta ? `\n<g:sale_price>${precio(v.precio)}</g:sale_price>` : ''}
<g:condition>new</g:condition>
<g:brand>${cdata(marca)}</g:brand>
<g:identifier_exists>no</g:identifier_exists>${v.sku ? `\n<g:mpn>${esc(v.sku)}</g:mpn>` : ''}
${esIdPropio(p.id) ? '' : '<g:google_product_category>213</g:google_product_category>\n'}<g:product_type>${cdata(categoria)}</g:product_type>${v.talle ? `\n<g:size>${esc(v.talle)}</g:size>` : ''}${v.color ? `\n<g:color>${esc(v.color)}</g:color>` : ''}
<g:age_group>${RE_CHICOS.test(`${p.nombre} ${p.category}`) ? 'kids' : 'adult'}</g:age_group>
</item>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${cdata(tienda.nombre)}</title>
<link>${esc(base)}</link>
<description>${cdata(tienda.descripcion || tienda.eslogan || `Tienda online de ${tienda.nombre}`)}</description>
${items.join('\n')}
</channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } });
}
