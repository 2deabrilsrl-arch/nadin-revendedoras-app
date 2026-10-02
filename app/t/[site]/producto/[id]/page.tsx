// Ficha de producto: SEO + datos estructurados Product/Offer/Breadcrumb
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getTiendaBySite, getProductoTienda, getLinkPrefix, getTiendaBaseUrl, parseProductParam,
  productPath, stripHtml, formatPrecio, getCatalogoTienda, getPagosPublicos,
} from '@/lib/tienda';
import AddToCart from '@/components/tienda/AddToCart';
import Gallery from '@/components/tienda/Gallery';
import ProductGrid, { TituloSeccion, precioTransferencia } from '@/components/tienda/ProductGrid';

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
  const tieneCat = catNombres[0] && catNombres[0] !== 'Sin categoría';
  const catHref = `/categoria/${producto.categorySlugs.join('/')}`;
  const pagos = await getPagosPublicos(tienda.id);

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
        ...(tieneCat ? [{ '@type': 'ListItem', position: 2, name: catNombres[catNombres.length - 1], item: `${base}${catHref}` }] : []),
        { '@type': 'ListItem', position: tieneCat ? 3 : 2, name: producto.nombre, item: url },
      ],
    },
  ];

  const nombresPago: Record<string, string> = { transferencia: 'Transferencia bancaria', mercadopago: 'Mercado Pago: tarjetas, débito y dinero en cuenta', link: 'Link de pago con tarjeta', efectivo: 'Efectivo' };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <nav aria-label="Ruta" className="mb-6 text-xs uppercase tracking-[0.12em] text-gray-400">
        <a href={prefix || '/'} className="hover:text-gray-700">Inicio</a>
        {tieneCat && <> <span className="mx-1">/</span> <a href={`${prefix}${catHref}`} className="hover:text-gray-700">{catNombres[catNombres.length - 1]}</a></>}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <Gallery images={producto.images} alt={producto.nombre} />

        <div className="lg:pt-2">
          {producto.brand && <p className="mb-2 text-xs uppercase tracking-[0.16em] text-gray-400">{producto.brand}</p>}
          <h1 className="t-title mb-5 text-2xl leading-snug text-gray-900 sm:text-3xl">{producto.nombre}</h1>
          <AddToCart
            productId={producto.id}
            nombre={producto.nombre}
            imagen={producto.image}
            descTransfer={pagos.descTransfer}
            variantes={producto.variantes.map((v) => ({
              id: v.id,
              talle: v.talle,
              color: v.color,
              stock: Math.min(v.stock, 20), // no exponemos el stock exacto de Nadin
              precio: v.precio,
            }))}
          />

          <div className="mt-8 divide-y divide-gray-100 border-y border-gray-100 text-sm">
            {producto.descripcionHtml && (
              <details className="group py-4" open>
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-[0.14em]">Descripción<span className="transition group-open:rotate-45">+</span></summary>
                <div className="mt-3 space-y-2 leading-relaxed text-gray-600 [&_li]:ml-4 [&_li]:list-disc" dangerouslySetInnerHTML={{ __html: producto.descripcionHtml }} />
              </details>
            )}
            {pagos.tipos.length > 0 && (
              <details className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-[0.14em]">Medios de pago<span className="transition group-open:rotate-45">+</span></summary>
                <ul className="mt-3 space-y-1 text-gray-600">
                  {pagos.tipos.map((t) => <li key={t}>{nombresPago[t] || t}{t === 'transferencia' && pagos.descTransfer > 0 ? ` (${pagos.descTransfer}% OFF: ${formatPrecio(precioTransferencia(producto.precioDesde, pagos.descTransfer))})` : ''}</li>)}
                </ul>
              </details>
            )}
            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-[0.14em]">Cambios y devoluciones<span className="transition group-open:rotate-45">+</span></summary>
              <p className="mt-3 text-gray-600">Por higiene, la ropa interior se cambia sin uso, con etiquetas y en su empaque. Tenés 10 días para arrepentirte de tu compra. <a href={`${prefix}/terminos`} className="underline">Ver más</a></p>
            </details>
          </div>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="pt-20">
          <TituloSeccion>También te puede gustar</TituloSeccion>
          <ProductGrid productos={relacionados} prefix={prefix} descTransfer={pagos.descTransfer} />
        </section>
      )}
    </div>
  );
}
