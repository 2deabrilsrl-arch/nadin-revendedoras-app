// Buscador (no indexable)
import { notFound } from 'next/navigation';
import { getTiendaBySite, getCatalogoTienda, buscar, getLinkPrefix, PAGE_SIZE } from '@/lib/tienda';
import ProductGrid, { Paginacion } from '@/components/tienda/ProductGrid';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Buscar', robots: { index: false, follow: true } };

export default async function BuscarPage({ params, searchParams }: { params: { site: string }; searchParams: { q?: string; page?: string } }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda) notFound();
  const prefix = getLinkPrefix(tienda.slug);
  const q = (searchParams.q || '').slice(0, 80);
  const productos = await getCatalogoTienda(tienda);
  const lista = q ? buscar(productos, q).filter((p) => p.disponible) : [];
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);

  return (
    <>
      <form action={`${prefix}/buscar`} className="mb-6" role="search">
        <label htmlFor="q" className="sr-only">Buscar</label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          autoFocus
          placeholder="¿Qué estás buscando?"
          className="w-full rounded-full border border-gray-300 px-5 py-3 outline-none focus:border-[var(--t-primary)]"
        />
      </form>
      {q && <h1 className="mb-4 text-xl font-semibold">{lista.length} resultados para “{q}”</h1>}
      {q && <ProductGrid productos={lista.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)} prefix={prefix} />}
      {q && <Paginacion page={page} total={lista.length} pageSize={PAGE_SIZE} baseHref={`${prefix}/buscar?q=${encodeURIComponent(q)}`} />}
    </>
  );
}
