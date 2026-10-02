// Home de la tienda
import { notFound } from 'next/navigation';
import {
  getTiendaBySite, getCatalogoTienda, buildCategorias, getLinkPrefix, getTiendaBaseUrl, getPagosPublicos, PAGE_SIZE,
} from '@/lib/tienda';
import { normalizarDiseno } from '@/lib/tienda-diseno';
import ProductGrid, { Paginacion, TituloSeccion, tnImg } from '@/components/tienda/ProductGrid';
import HeroCarousel from '@/components/tienda/HeroCarousel';
import Icon from '@/components/tienda/Icon';

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
  const diseno = normalizarDiseno(tienda.diseno);
  const [productos, pagos] = await Promise.all([getCatalogoTienda(tienda), getPagosPublicos(tienda.id)]);
  const categorias = buildCategorias(productos);
  const disponibles = productos.filter((p) => p.disponible);
  const destacados = disponibles.filter((p) => p.destacado).slice(0, 8);
  const masVendidos = [...disponibles].sort((a, b) => a.rank - b.rank).slice(0, 8);
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const pagina = disponibles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const base = getTiendaBaseUrl(tienda);
  const enlace = (l?: string) => (l ? (l.startsWith('/') ? `${prefix}${l}` : l) : undefined);

  // Si no cargó slides, usamos la portada simple (imagen de portada o color)
  const slides = diseno.slides.length
    ? diseno.slides.map((s) => ({ ...s, href: enlace(s.link) }))
    : tienda.bannerUrl
      ? [{ imagen: tienda.bannerUrl, titulo: tienda.nombre, texto: tienda.eslogan || undefined, boton: 'Ver productos', href: '#productos' }]
      : [];

  // Categorías con foto: primer producto disponible de cada una
  const catTiles = categorias.slice(0, 8).map((c) => {
    const p = disponibles.find((x) => x.categorySlugs[0] === c.slug && x.image);
    return { nombre: c.nombre, href: `${prefix}/categoria/${c.path.join('/')}`, imagen: p?.image || '' };
  }).filter((c) => c.imagen);

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

      {page === 1 && (slides.length ? (
        <HeroCarousel slides={slides} />
      ) : (
        <section className="t-hero-band px-4 py-16 text-center sm:py-24" style={{ background: 'color-mix(in srgb, var(--t-primary) 10%, #fff)' }}>
          <h1 className="t-title text-4xl sm:text-6xl" style={{ color: 'var(--t-secondary)' }}>{tienda.nombre}</h1>
          {tienda.eslogan && <p className="mx-auto mt-4 max-w-xl text-gray-600">{tienda.eslogan}</p>}
          <a href="#productos" className="t-btn mt-8">Ver productos</a>
        </section>
      ))}

      {page === 1 && slides.length > 0 && <h1 className="sr-only">{tienda.nombre}</h1>}

      {page === 1 && diseno.beneficios.activo && diseno.beneficios.items.length > 0 && (
        <section className="border-b border-black/5 bg-white">
          <ul className={`mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 sm:gap-6 ${diseno.beneficios.items.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} ${diseno.beneficios.items.length === 4 ? 'lg:grid-cols-4' : ''}`}>
            {diseno.beneficios.items.map((b) => (
              <li key={b.titulo} className="flex items-center gap-3 sm:justify-center">
                <span style={{ color: 'var(--t-primary)' }}><Icon name={b.icono} size={28} strokeWidth={1.3} /></span>
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-gray-900">{b.titulo}</span>
                  {b.texto && <span className="block text-xs text-gray-500">{b.texto}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4">
        {page === 1 && diseno.categoriasDestacadas && catTiles.length >= 2 && (
          <section className="pt-14">
            <TituloSeccion>Categorías</TituloSeccion>
            <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
              {catTiles.slice(0, 4).map((c) => (
                <li key={c.href}>
                  <a href={c.href} className="group relative block overflow-hidden rounded-[var(--t-radius)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tnImg(c.imagen, 640)} alt={c.nombre} loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 pt-12 text-center text-sm font-semibold uppercase tracking-[0.14em] text-white">
                      {c.nombre}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {page === 1 && destacados.length > 0 && (
          <section className="pt-16">
            <TituloSeccion>Destacados</TituloSeccion>
            <ProductGrid productos={destacados} prefix={prefix} descTransfer={pagos.descTransfer} />
          </section>
        )}

        {page === 1 && diseno.masVendidos && masVendidos.length >= 4 && (
          <section className="pt-16">
            <TituloSeccion>Los más elegidos</TituloSeccion>
            <ProductGrid productos={masVendidos} prefix={prefix} descTransfer={pagos.descTransfer} />
          </section>
        )}

        <section id="productos" className="scroll-mt-28 pt-16">
          <TituloSeccion>{page === 1 ? 'Todos los productos' : `Productos · página ${page}`}</TituloSeccion>
          <ProductGrid productos={pagina} prefix={prefix} descTransfer={pagos.descTransfer} />
          <Paginacion page={page} total={disponibles.length} pageSize={PAGE_SIZE} baseHref={prefix || '/'} />
        </section>

        {page === 1 && tienda.descripcion && (
          <section className="mx-auto max-w-2xl pt-20 text-center">
            <h2 className="t-h mb-4">Sobre {tienda.nombre}</h2>
            <p className="whitespace-pre-line leading-relaxed text-gray-600">{tienda.descripcion}</p>
          </section>
        )}
      </div>
    </>
  );
}
