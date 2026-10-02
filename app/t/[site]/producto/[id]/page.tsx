// Ficha de producto: SEO + datos estructurados Product/Offer/Breadcrumb
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getTiendaBySite, getProductoTienda, getLinkPrefix, getTiendaBaseUrl, parseProductParam,
  productPath, stripHtml, formatPrecio, getCatalogoTienda,
} from '@/lib/tienda';
import AddToCart from '@/components/tienda/AddToCart';
import ProductGrid, { tnImg } from '@/components/tienda/ProductGrid';

export const dynamic = 'force-dynamic';

type Props = { params: { site: string; id: string } };

async function load(params: Props['params']) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda) return null;
  const producto = await getProductoTienda(tienda, parseProductParam(params.id));
  if (!producto) return null;
  return { tienda, producto };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: 'Producto no encontrado', robots: { index: false } };
  const { tienda, producto } = data;
  const base = getTiendaBaseUrl(tienda);
  const url = `${base}${productPath(producto)}`;
  const texto = stripHtml(producto.descripcionHtml).slice(0, 150);
  const lugar = tienda.ciudad ? ` en ${tienda.ciudad}` : '';
  const description = `${producto.nombre} a ${formatPrecio(producto.precioDesde)}${lugar}. ${texto || `Comprá online en ${tienda.nombre}.`}`.slice(0, 160);
  return {
    title: producto.nombre,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, title: producto.nombre, description, images: producto.images.slice(0, 4).map((src) => ({ url: src })) },
  };
}

export default async function ProductoPage({ params }: Props) {
  const data = await load(params);
  if (!data) notFound();
  const { tienda, producto } = data;
  const prefix = getLinkPrefix(tienda.slug);

  // URL canónica: si el slug no coincide, redirigimos (evita contenido duplicado)
  const esperado = productPath(producto).replace('/producto/', '');
  if (decodeURIComponent(params.id) !== esperado) redirect(`${prefix}${productPath(producto)}`);

  const base = getTiendaBaseUrl(tienda);
  const url = `${base}${productPath(producto)}`;
  const catNombres = producto.category.split('>').map((c) => c.trim()).filter(Boolean);
  const catHref = `/categoria/${producto.categorySlugs.join('/')}`;

  const relacionados = (await getCatalogoTienda(tienda))
    .filter((p) => p.id !== producto.id && p.disponible && p.category === producto.category)
    .slice(0, 4);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: producto.nombre,
      image: producto.images.slice(0, 6),
      description: stripHtml(producto.descripcionHtml).slice(0, 500) || producto.nombre,
      sku: producto.variantes[0]?.sku || producto.id,
      brand: producto.brand ? { '@type': 'Brand', name: producto.brand } : undefined,
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'ARS',
        lowPrice: Math.min(...producto.variantes.map((v) => v.precio)),
        highPrice: Math.max(...producto.variantes.map((v) => v.precio)),
        offerCount: producto.variantes.length,
        availability: producto.disponible ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url,
        seller: { '@type': 'Organization', name: tienda.nombre },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: tienda.nombre, item: base },
        ...(catNombres[0] && catNombres[0] !== 'Sin categoría'
          ? [{ '@type': 'ListItem', position: 2, name: catNombres[catNombres.length - 1], item: `${base}${catHref}` }]
          : []),
        { '@type': 'ListItem', position: catNombres[0] ? 3 : 2, name: producto.nombre, item: url },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <nav aria-label="Ruta" className="mb-4 text-sm text-gray-500">
        <a href={prefix || '/'}>Inicio</a>
        {catNombres[0] && catNombres[0] !== 'Sin categoría' && (
          <> / <a href={`${prefix}${catHref}`}>{catNombres[catNombres.length - 1]}</a></>
        )}
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          {producto.images.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tnImg(producto.images[0], 1024)} alt={producto.nombre} className="aspect-[3/4] w-full rounded-2xl bg-gray-100 object-cover" />
              {producto.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {producto.images.slice(1, 9).map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={tnImg(src, 480)} alt={`${producto.nombre} - foto ${i + 2}`} loading="lazy" className="aspect-square w-full rounded-lg bg-gray-100 object-cover" />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-[3/4] w-full rounded-2xl bg-gray-100" />
          )}
        </div>

        <div>
          {producto.brand && <p className="text-sm uppercase tracking-wide text-gray-500">{producto.brand}</p>}
          <h1 className="t-title mb-4 text-2xl font-bold sm:text-3xl">{producto.nombre}</h1>
          <AddToCart
            productId={producto.id}
            nombre={producto.nombre}
            imagen={producto.image}
            variantes={producto.variantes.map((v) => ({
              id: v.id,
              talle: v.talle,
              color: v.color,
              stock: Math.min(v.stock, 20), // no exponemos el stock exacto de Nadin
              precio: v.precio,
            }))}
          />
          {producto.descripcionHtml && (
            <section className="prose prose-sm mt-8 max-w-none text-gray-700">
              <h2 className="text-lg font-semibold text-gray-900">Descripción</h2>
              <div dangerouslySetInnerHTML={{ __html: producto.descripcionHtml }} />
            </section>
          )}
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-16">
          <h2 className="t-title mb-4 text-xl font-bold">También te puede gustar</h2>
          <ProductGrid productos={relacionados} prefix={prefix} />
        </section>
      )}
    </>
  );
}
