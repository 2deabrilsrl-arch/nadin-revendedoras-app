// lib/tienda.ts
// Lógica compartida de Tiendas Nadin: resolver tienda, catálogo con precios
// de la revendedora, categorías y URLs. Solo servidor.

import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { calcularPrecioVenta } from '@/lib/precios';

// ---------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------

export interface VarianteTienda {
  id: string;
  sku: string;
  talle: string;
  color: string;
  stock: number;
  mayorista: number;
  precio: number;
}

export interface ProductoTienda {
  id: string;
  slug: string;
  nombre: string;
  brand: string;
  category: string;
  categorySlugs: string[];
  image: string;
  images: string[];
  precioDesde: number;
  disponible: boolean;
  ultimasUnidades: boolean;
  destacado: boolean;
  rank: number;
  variantes: VarianteTienda[];
}

interface ProductoBase {
  id: string;
  slug: string;
  nombre: string;
  brand: string;
  category: string;
  image: string;
  images: string[];
  rank: number;
  variantes: { id: string; sku: string; talle: string; color: string; stock: number; mayorista: number }[];
}

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------

export function slugify(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function formatPrecio(n: number): string {
  return `$${Math.round(n || 0).toLocaleString('es-AR')}`;
}

export function stripHtml(html: string | null | undefined): string {
  return (html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** HTML de TN reducido a etiquetas seguras (evita scripts / estilos inyectados). */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  let s = html
    .replace(/<(script|style|iframe|object|embed|form|input|button)[\s\S]*?(<\/\1>|\/?>)/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(style|class|id)\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/javascript:/gi, '');
  // solo dejamos etiquetas básicas
  s = s.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (m, tag) => {
    const ok = ['p', 'br', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'h2', 'h3', 'h4', 'span', 'table', 'tr', 'td', 'th', 'tbody', 'thead'];
    if (!ok.includes(String(tag).toLowerCase())) return '';
    return m.startsWith('</') ? `</${tag}>` : `<${tag}>`;
  });
  return s;
}

export function productPath(p: { id: string; slug: string }): string {
  return `/producto/${p.id}-${p.slug || 'producto'}`;
}

export function parseProductParam(param: string): string {
  return (param || '').split('-')[0];
}

const MARGEN_MINIMO = Number(process.env.TIENDA_MARGEN_MINIMO || 0);

export function margenEfectivo(tienda: { margen: number | null }, userMargen: number): number {
  const m = tienda.margen ?? userMargen ?? 60;
  return Math.max(m, MARGEN_MINIMO);
}

// ---------------------------------------------------------------------
// Resolver tienda por "site" (slug o dominio propio)
// ---------------------------------------------------------------------

export async function getTiendaBySite(site: string) {
  const s = decodeURIComponent(site || '').toLowerCase();
  if (!s) return null;
  const isHost = s.includes('.');
  const alt = s.startsWith('www.') ? s.slice(4) : `www.${s}`;
  const tienda = await prisma.tienda.findFirst({
    where: isHost ? { dominioPropio: { in: [s, alt] } } : { slug: s },
    include: {
      user: { select: { id: true, margen: true, name: true, telefono: true } },
    },
  });
  return tienda;
}

export type TiendaConUser = NonNullable<Awaited<ReturnType<typeof getTiendaBySite>>>;

/** Prefijo de links: '' si se entró por subdominio/dominio propio, '/t/{slug}' si por la app. */
export function getLinkPrefix(slug: string): string {
  try {
    return headers().get('x-tienda-rewrite') === '1' ? '' : `/t/${slug}`;
  } catch {
    return `/t/${slug}`;
  }
}

/** URL absoluta canónica de la tienda (para SEO, sitemap, Mercado Pago). */
export function getTiendaBaseUrl(tienda: { slug: string; dominioPropio: string | null }): string {
  if (tienda.dominioPropio) return `https://${tienda.dominioPropio}`;
  const root = process.env.TIENDAS_ROOT_DOMAIN;
  if (root) return `https://${tienda.slug}.${root}`;
  const app = (process.env.NEXT_PUBLIC_APP_URL || 'https://nadin-revendedoras-app.vercel.app').replace(/\/$/, '');
  return `${app}/t/${tienda.slug}`;
}

// ---------------------------------------------------------------------
// Catálogo global (cache en memoria por instancia, 10 min)
// ---------------------------------------------------------------------

let catalogCache: { at: number; items: ProductoBase[] } | null = null;
const CATALOG_TTL_MS = 10 * 60 * 1000;

async function getCatalogoBase(): Promise<ProductoBase[]> {
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS && catalogCache.items.length > 0) {
    return catalogCache.items;
  }
  const rows = await prisma.catalogoCache.findMany({
    select: { productId: true, data: true, slug: true, bestSellerRank: true },
  });
  const items: ProductoBase[] = [];
  for (const row of rows) {
    try {
      const d = JSON.parse(row.data);
      if (d.published === false) continue;
      items.push({
        id: String(d.id ?? row.productId),
        slug: row.slug || slugify(d.name || ''),
        nombre: d.name || 'Producto',
        brand: d.brand || '',
        category: d.category || 'Sin categoría',
        image: d.image || '',
        images: Array.isArray(d.images) && d.images.length ? d.images : d.image ? [d.image] : [],
        rank: row.bestSellerRank ?? 99999,
        variantes: (d.variants || []).map((v: any) => ({
          id: String(v.id),
          sku: v.sku || '',
          talle: v.talle || '',
          color: v.color || '',
          stock: Number(v.stock) || 0,
          mayorista: Number(v.price) || 0,
        })),
      });
    } catch {
      /* fila corrupta: se ignora */
    }
  }
  // Si la sync está en medio (tabla vacía), no pisamos un cache bueno
  if (items.length > 0 || !catalogCache) catalogCache = { at: Date.now(), items };
  return catalogCache.items;
}

/** Catálogo con precios, ocultos y destacados de esta tienda. */
export async function getCatalogoTienda(tienda: TiendaConUser): Promise<ProductoTienda[]> {
  const [base, overrides] = await Promise.all([
    getCatalogoBase(),
    prisma.tiendaProducto.findMany({ where: { tiendaId: tienda.id } }),
  ]);
  const ov = new Map(overrides.map((o) => [o.productId, o]));
  const margen = margenEfectivo(tienda, tienda.user.margen);

  const out: ProductoTienda[] = [];
  for (const p of base) {
    const o = ov.get(p.id);
    if (o?.oculto) continue;
    const variantes: VarianteTienda[] = p.variantes
      .filter((v) => v.mayorista > 0)
      .map((v) => ({
        ...v,
        precio: o?.precioPropio && o.precioPropio > v.mayorista ? o.precioPropio : calcularPrecioVenta(v.mayorista, margen),
      }));
    if (variantes.length === 0) continue;
    const conStock = variantes.filter((v) => v.stock > 0);
    const totalStock = conStock.reduce((a, v) => a + v.stock, 0);
    out.push({
      id: p.id,
      slug: p.slug,
      nombre: o?.titulo || p.nombre,
      brand: p.brand,
      category: p.category,
      categorySlugs: p.category.split('>').map((c) => slugify(c.trim())),
      image: p.image,
      images: p.images,
      precioDesde: Math.min(...(conStock.length ? conStock : variantes).map((v) => v.precio)),
      disponible: conStock.length > 0,
      ultimasUnidades: conStock.length > 0 && totalStock <= 3,
      destacado: !!o?.destacado,
      rank: p.rank,
      variantes,
    });
  }
  // Destacados primero, después más vendidos, sin stock al final
  out.sort((a, b) => {
    if (a.disponible !== b.disponible) return a.disponible ? -1 : 1;
    if (a.destacado !== b.destacado) return a.destacado ? -1 : 1;
    return a.rank - b.rank;
  });
  return out;
}

export async function getProductoTienda(tienda: TiendaConUser, productId: string) {
  const catalogo = await getCatalogoTienda(tienda);
  const p = catalogo.find((x) => x.id === productId);
  if (!p) return null;
  const [row, ov] = await Promise.all([
    prisma.catalogoCache.findUnique({ where: { productId }, select: { descripcion: true } }),
    prisma.tiendaProducto.findUnique({ where: { tiendaId_productId: { tiendaId: tienda.id, productId } } }),
  ]);
  return { ...p, descripcionHtml: sanitizeHtml(ov?.descripcion || row?.descripcion || '') };
}

// ---------------------------------------------------------------------
// Categorías (árbol de hasta 3 niveles)
// ---------------------------------------------------------------------

export interface CategoriaNodo {
  nombre: string;
  slug: string;
  path: string[]; // slugs desde la raíz
  count: number;
  hijos: CategoriaNodo[];
}

export function buildCategorias(productos: ProductoTienda[]): CategoriaNodo[] {
  const root: CategoriaNodo[] = [];
  for (const p of productos) {
    if (!p.disponible) continue;
    const nombres = p.category.split('>').map((c) => c.trim()).filter(Boolean);
    if (!nombres.length || nombres[0] === 'Sin categoría') continue;
    let nivel = root;
    const path: string[] = [];
    for (const nombre of nombres) {
      const slug = slugify(nombre);
      path.push(slug);
      let nodo = nivel.find((n) => n.slug === slug);
      if (!nodo) {
        nodo = { nombre, slug, path: [...path], count: 0, hijos: [] };
        nivel.push(nodo);
      }
      nodo.count++;
      nivel = nodo.hijos;
    }
  }
  const sortRec = (n: CategoriaNodo[]) => {
    n.sort((a, b) => b.count - a.count);
    n.forEach((x) => sortRec(x.hijos));
  };
  sortRec(root);
  return root;
}

export function findCategoria(arbol: CategoriaNodo[], path: string[]): CategoriaNodo | null {
  let nivel = arbol;
  let nodo: CategoriaNodo | null = null;
  for (const slug of path) {
    nodo = nivel.find((n) => n.slug === slug) || null;
    if (!nodo) return null;
    nivel = nodo.hijos;
  }
  return nodo;
}

export function filtrarPorCategoria(productos: ProductoTienda[], path: string[]) {
  return productos.filter((p) => path.every((s, i) => p.categorySlugs[i] === s));
}

export function buscar(productos: ProductoTienda[], q: string) {
  const terms = slugify(q).split('-').filter(Boolean);
  if (!terms.length) return productos;
  return productos.filter((p) => {
    const hay = slugify(`${p.nombre} ${p.brand} ${p.category} ${p.variantes.map((v) => v.sku).join(' ')}`);
    return terms.every((t) => hay.includes(t));
  });
}

export const PAGE_SIZE = 24;

// ---------------------------------------------------------------------
// Medios de pago visibles (para mostrar "precio con transferencia" y el pie)
// ---------------------------------------------------------------------

export async function getPagosPublicos(tiendaId: string) {
  const pagos = await prisma.tiendaMetodoPago.findMany({
    where: { tiendaId, activo: true },
    orderBy: { orden: 'asc' },
    select: { tipo: true, nombre: true, descuentoPct: true, config: true },
  });
  const visibles = pagos.filter((p) => p.tipo !== 'mercadopago' || !!(p.config as any)?.accessToken);
  const transfer = visibles.find((p) => p.tipo === 'transferencia');
  return {
    descTransfer: transfer ? Math.min(Math.max(transfer.descuentoPct, 0), 50) : 0,
    tipos: Array.from(new Set(visibles.map((p) => p.tipo))),
  };
}
