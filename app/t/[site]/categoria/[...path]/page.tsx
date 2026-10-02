// Página de categoría (indexable, con breadcrumb)
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getTiendaBySite, getCatalogoTienda, buildCategorias, findCategoria, filtrarPorCategoria,
  getLinkPrefix, getTiendaBaseUrl, PAGE_SIZE,
} from '@/lib/tienda';
import ProductGrid, { Paginacion } from '@/components/tienda/ProductGrid';

export const dynamic = 'force-dynamic';

type Props = { params: { site: string; path: string[] }; searchParams: { page?: string } };

async function load(params: Props['params']) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda) return null;
  const productos = await getCatalogoTienda(tienda);
  const arbol = buildCategorias(productos);
  const cat = findCategoria(arbol, params.path);
  if (!cat) return null;
  return { tienda, productos, arbol, cat };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: 'Categoría no encontrada' };
  const { tienda, cat } = data;
  const lugar = tienda.ciudad ? ` en ${tienda.ciudad}` : '';
  const base = getTiendaBaseUrl(tienda);
  const page = parseInt(searchParams.page || '1', 10) || 1;
  const url = `${base}/categoria/${cat.path.join('/')}${page > 1 ? `?page=${page}` : ''}`;
  return {
    title: `${cat.nombre}${lugar}`,
    description: `Comprá ${cat.nombre.toLowerCase()} online${lugar} en ${tienda.nombre}. ${cat.count} modelos disponibles con envío y atención por WhatsApp.`,
    alternates: { canonical: url },
    openGraph: { url },
  };
}

export default async function CategoriaPage({ params, searchParams }: Props) {
  const data = await load(params);
  if (!data) notFound();
  const { tienda, productos, cat } = data;
  const prefix = getLinkPrefix(tienda.slug);
  const base = getTiendaBaseUrl(tienda);
  const lista = filtrarPorCategoria(productos, cat.path).filter((p) => p.disponible);
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const pagina = lista.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Breadcrumb
  const migas: { nombre: string; href: string }[] = [];
  let nivel = data.arbol;
  for (let i = 0; i < cat.path.length; i++) {
    const n = nivel.find((x) => x.slug === cat.path[i]);
    if (!n) break;
    migas.push({ nombre: n.nombre, href: `/categoria/${n.path.join('/')}` });
    nivel = n.hijos;
  }
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: tienda.nombre, item: base },
      ...migas.map((m, i) => ({ '@type': 'ListItem', position: i + 2, name: m.nombre, item: `${base}${m.href}` })),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <nav aria-label="Ruta" className="mb-4 text-sm text-gray-500">
        <a href={prefix || '/'}>Inicio</a>
        {migas.map((m) => (
          <span key={m.href}> / <a href={`${prefix}${m.href}`}>{m.nombre}</a></span>
        ))}
      </nav>
      <h1 className="t-title mb-2 text-3xl font-bold">{cat.nombre}</h1>
      <p className="mb-6 text-gray-600">{lista.length} productos</p>

      {cat.hijos.length > 0 && (
        <ul className="-mx-4 mb-8 flex gap-2 overflow-x-auto whitespace-nowrap px-4">
          {cat.hijos.map((h) => (
            <li key={h.slug}>
              <a href={`${prefix}/categoria/${h.path.join('/')}`} className="inline-block rounded-full border border-gray-200 px-4 py-2 text-sm hover:border-[var(--t-primary)]">
                {h.nombre}
              </a>
            </li>
          ))}
        </ul>
      )}

      <ProductGrid productos={pagina} prefix={prefix} />
      <Paginacion page={page} total={lista.length} pageSize={PAGE_SIZE} baseHref={`${prefix}/categoria/${cat.path.join('/')}`} />
    </>
  );
}
