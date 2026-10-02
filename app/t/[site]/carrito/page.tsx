import { notFound } from 'next/navigation';
import { getTiendaBySite, getLinkPrefix } from '@/lib/tienda';
import CheckoutClient from '@/components/tienda/CheckoutClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Carrito', robots: { index: false, follow: false } };

export default async function CarritoPage({ params }: { params: { site: string } }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda) notFound();
  const prefix = getLinkPrefix(tienda.slug);
  return (
    <>
      <h1 className="t-title mb-6 text-3xl font-bold">Carrito</h1>
      {!tienda.activa && (
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">La tienda no está publicada: podés probar el carrito, pero no se pueden confirmar compras.</p>
      )}
      <CheckoutClient apiBase={`/api/tienda/${tienda.slug}`} terminosHref={`${prefix}/terminos`} />
    </>
  );
}
