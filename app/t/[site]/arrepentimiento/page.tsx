import { notFound } from 'next/navigation';
import { getTiendaBySite } from '@/lib/tienda';
import ArrepentimientoForm from '@/components/tienda/ArrepentimientoForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Botón de arrepentimiento', robots: { index: false, follow: true } };

export default async function Page({ params }: { params: { site: string } }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda) notFound();
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="t-title mb-3 text-3xl font-bold">Botón de arrepentimiento</h1>
      <p className="mb-6 text-sm text-gray-600">
        Tenés 10 días corridos desde que recibiste el producto para cancelar tu compra, sin costo ni explicación
        (Ley 24.240 y Resolución 424/2020). Completá el formulario y te contactamos.
      </p>
      <ArrepentimientoForm apiBase={`/api/tienda/${tienda.slug}`} />
    </div>
  );
}
