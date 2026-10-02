// Lista plana de categorías de la tienda (para el editor de secciones)
import { NextResponse } from 'next/server';
import { getTiendaBySite, getCatalogoTienda, buildCategorias, type CategoriaNodo } from '@/lib/tienda';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { site: string } }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda) return NextResponse.json({ categorias: [] }, { status: 404 });
  const out: { nombre: string; path: string }[] = [];
  const walk = (n: CategoriaNodo[], prefijo: string) =>
    n.forEach((c) => {
      const nombre = prefijo ? `${prefijo} › ${c.nombre}` : c.nombre;
      out.push({ nombre, path: c.path.join('/') });
      walk(c.hijos, nombre);
    });
  walk(buildCategorias(await getCatalogoTienda(tienda)), '');
  return NextResponse.json({ categorias: out });
}
