// Página propia de la tienda (Cómo comprar, Cambios, etc.)
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getTiendaBySite, getTiendaBaseUrl, getLinkPrefix } from '@/lib/tienda';
import { parsearContenido } from '@/lib/tienda-paginas';

export const dynamic = 'force-dynamic';
type Props = { params: { site: string; slug: string } };

async function load(params: Props['params']) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda) return null;
  const pagina = await prisma.tiendaPagina.findUnique({ where: { tiendaId_slug: { tiendaId: tienda.id, slug: params.slug } } });
  if (!pagina || !pagina.visible) return null;
  return { tienda, pagina };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: 'Página no encontrada', robots: { index: false } };
  const url = `${getTiendaBaseUrl(data.tienda)}/p/${data.pagina.slug}`;
  return { title: data.pagina.titulo, description: data.pagina.contenido.replace(/[#\-\n]+/g, ' ').trim().slice(0, 155), alternates: { canonical: url } };
}

export default async function PaginaTienda({ params }: Props) {
  const data = await load(params);
  if (!data) notFound();
  const { tienda, pagina } = data;
  const prefix = getLinkPrefix(tienda.slug);
  return (
    <article className="mx-auto max-w-2xl px-4 py-10 text-gray-700">
      <nav aria-label="Ruta" className="mb-6 text-xs uppercase tracking-[0.12em] text-gray-400">
        <a href={prefix || '/'} className="hover:text-gray-700">Inicio</a> <span className="mx-1">/</span> {pagina.titulo}
      </nav>
      <h1 className="t-title mb-6 text-3xl text-gray-900">{pagina.titulo}</h1>
      <div className="space-y-4 leading-relaxed">
        {parsearContenido(pagina.contenido).map((b, k) =>
          b.tipo === 'h2' ? <h2 key={k} className="t-title pt-4 text-xl text-gray-900">{b.texto}</h2>
            : b.tipo === 'ul' ? <ul key={k} className="ml-5 list-disc space-y-1">{b.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
              : <p key={k} className="whitespace-pre-line">{b.texto}</p>
        )}
      </div>
    </article>
  );
}
