// Home de la tienda
import { notFound } from 'next/navigation';
import {
  getTiendaBySite, getCatalogoTienda, buildCategorias, getLinkPrefix, getTiendaBaseUrl, PAGE_SIZE,
} from '@/lib/tienda';
import ProductGrid, { Paginacion } from '@/components/tienda/ProductGrid';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params, searchParams }: { params: { site: string }; searchParams: { page?: string } }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda) return {};
  const base = getTiendaBaseUrl(tienda);
  const page = parseInt(searchParams.page || '1', 10) || 1;
  return { alternates: { canonical: page > 1 ? `${base}/?page=${page}` : base } };
}

export default async function TiendaHome({ params, searchParams }: { params: { site: string }; searchParams: { page?: string } }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda) notFound();
  const prefix = getLinkPrefix(tienda.slug);
  const productos = await getCatalogoTienda(tienda);
  const categorias = buildCategorias(productos);
  const disponibles = productos.filter((p) => p.disponible);
  const destacados = disponibles.filter((p) => p.destacado).slice(0, 8);
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const pagina = disponibles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const base = getTiendaBaseUrl(tienda);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: tienda.nombre,
    url: base,
    description: tienda.descripcion || tienda.eslogan || undefined,
    image: tienda.logoUrl || undefined,
    telephone: tienda.whatsapp || undefined,
    address: tienda.ciudad
      ? { '@type': 'PostalAddress', addressLocality: tienda.ciudad, addressRegion: tienda.provincia || undefined, addressCountry: 'AR' }
      : undefined,
    sameAs: [
      tienda.instagram && `https://instagram.com/${tienda.instagram.replace('@', '')}`,
      tienda.facebook && `https://facebook.com/${tienda.facebook}`,
      tienda.tiktok && `https://tiktok.com/@${tienda.tiktok.replace('@', '')}`,
    ].filter(Boolean),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      {page === 1 && (
        <section className="relative mb-8 overflow-hidden rounded-2xl" style={{ background: 'var(--t-primary)' }}>
          {tienda.bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tienda.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
          )}
          <div className="relative bg-gradient-to-r from-black/50 to-transparent px-6 py-14 text-white sm:px-10 sm:py-20">
            <h1 className="t-title max-w-xl text-3xl font-bold sm:text-5xl">{tienda.nombre}</h1>
            {tienda.eslogan && <p className="mt-3 max-w-lg text-lg text-white/90">{tienda.eslogan}</p>}
            <a href="#productos" className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-semibold" style={{ color: 'var(--t-secondary)' }}>
              Ver productos
            </a>
          </div>
        </section>
      )}

      {categorias.length > 0 && (
        <nav aria-label="Categorías" className="-mx-4 mb-8 overflow-x-auto px-4">
          <ul className="flex gap-2 whitespace-nowrap">
            {categorias.map((c) => (
              <li key={c.slug}>
                <a href={`${prefix}/categoria/${c.path.join('/')}`} className="inline-block rounded-full border border-gray-200 px-4 py-2 text-sm hover:border-[var(--t-primary)]">
                  {c.nombre}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {page === 1 && destacados.length > 0 && (
        <section className="mb-12">
          <h2 className="t-title mb-4 text-2xl font-bold">Destacados</h2>
          <ProductGrid productos={destacados} prefix={prefix} />
        </section>
      )}

      <section id="productos">
        <h2 className="t-title mb-4 text-2xl font-bold">{page === 1 ? 'Todos los productos' : `Productos · página ${page}`}</h2>
        <ProductGrid productos={pagina} prefix={prefix} />
        <Paginacion page={page} total={disponibles.length} pageSize={PAGE_SIZE} baseHref={prefix || '/'} />
      </section>

      {page === 1 && tienda.descripcion && (
        <section className="mx-auto mt-16 max-w-3xl text-center">
          <h2 className="t-title mb-3 text-2xl font-bold">Sobre {tienda.nombre}</h2>
          <p className="whitespace-pre-line text-gray-700">{tienda.descripcion}</p>
        </section>
      )}
    </>
  );
}
