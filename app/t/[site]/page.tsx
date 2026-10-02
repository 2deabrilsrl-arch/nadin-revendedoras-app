// Home de la tienda: se arma con las secciones que eligió la revendedora
import { notFound } from 'next/navigation';
import {
  getTiendaBySite, getCatalogoTienda, buildCategorias, getLinkPrefix, getTiendaBaseUrl, getPagosPublicos,
} from '@/lib/tienda';
import { normalizarDiseno } from '@/lib/tienda-diseno';
import Secciones from '@/components/tienda/Secciones';

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
  const disponibles = productos.filter((p) => p.disponible);
  const categorias = buildCategorias(productos);
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const base = getTiendaBaseUrl(tienda);

  // Siempre tiene que existir una grilla con todos los productos
  const secciones = diseno.secciones.some((s) => s.visible && s.tipo === 'productos' && s.fuente === 'todos')
    ? diseno.secciones
    : [...diseno.secciones, { id: 'todos-auto', tipo: 'productos' as const, visible: true, titulo: 'Todos los productos', fuente: 'todos' as const, categoria: '', formato: 'grilla' as const, cantidad: 24 }];

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
      <Secciones
        secciones={secciones}
        ctx={{ tienda, prefix, productos: disponibles, categorias, descTransfer: pagos.descTransfer, page }}
      />
    </>
  );
}
