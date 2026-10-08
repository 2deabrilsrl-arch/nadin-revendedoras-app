// Buscador (no indexable)
import { notFound } from 'next/navigation';
import { getTiendaBySite, getCatalogoTienda, buscar, getLinkPrefix, PAGE_SIZE } from '@/lib/tienda';
import ProductGrid, { Paginacion } from '@/components/tienda/ProductGrid';
import FiltrosTienda from '@/components/tienda/FiltrosTienda';
import { aplicarFiltros, qsFiltros } from '@/lib/tienda-filtros';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Buscar', robots: { index: false, follow: true } };

export default async function BuscarPage({ params, searchParams }: { params: { site: string }; searchParams: { q?: string; page?: string; talle?: string; color?: string; max?: string; orden?: string } }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda) notFound();
  const prefix = getLinkPrefix(tienda.slug);
  const q = (searchParams.q || '').slice(0, 80);
  const productos = await getCatalogoTienda(tienda);
  const encontrados = q ? buscar(productos, q).filter((p) => p.disponible) : [];
  const { lista, activos, opciones } = aplicarFiltros(encontrados, searchParams);
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <form action={`${prefix}/buscar`} className="mb-6" role="search">
        <label htmlFor="q" className="sr-only">Buscar</label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          autoFocus
          placeholder="¿Qué estás buscando?"
          className="w-full rounded-[var(--t-btn-radius)] border border-gray-300 px-5 py-3 outline-none focus:border-gray-900"
        />
      </form>
      {q && <h1 className="t-h mb-8">{lista.length} resultados para “{q}”</h1>}
      {q && encontrados.length > 0 && <FiltrosTienda action={`${prefix}/buscar`} ocultos={{ q }} opciones={opciones} activos={activos} total={lista.length} />}
      {q && <ProductGrid productos={lista.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)} prefix={prefix} />}
      {q && <Paginacion page={page} total={lista.length} pageSize={PAGE_SIZE} baseHref={`${prefix}/buscar${qsFiltros(activos, { q })}`} />}
    </div>
  );
}
