// Grilla de productos de la tienda (server component).
import type { ProductoTienda } from '@/lib/tienda';
import { formatPrecio, productPath } from '@/lib/tienda';

/** Pide a la CDN de Tiendanube una versión más liviana de la imagen. */
export function tnImg(src: string, size = 480): string {
  if (!src) return '';
  return src.replace(/-(\d+)-(\d+)\.(jpg|jpeg|png|webp)(\?.*)?$/i, `-${size}-0.$3`);
}

export default function ProductGrid({ productos, prefix }: { productos: ProductoTienda[]; prefix: string }) {
  if (!productos.length) {
    return <p className="py-16 text-center text-gray-500">No encontramos productos acá. Probá con otra categoría o búsqueda.</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {productos.map((p, i) => (
        <li key={p.id}>
          <a href={`${prefix}${productPath(p)}`} className="group block">
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tnImg(p.image)}
                  alt={p.nombre}
                  loading={i < 4 ? 'eager' : 'lazy'}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              )}
              {!p.disponible && (
                <span className="absolute left-2 top-2 rounded-full bg-gray-900/80 px-2 py-1 text-xs font-semibold text-white">Sin stock</span>
              )}
              {p.disponible && p.ultimasUnidades && (
                <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-1 text-xs font-semibold text-white">Últimas unidades</span>
              )}
            </div>
            <h3 className="mt-2 line-clamp-2 text-sm text-gray-800">{p.nombre}</h3>
            <p className="mt-1 font-bold" style={{ color: 'var(--t-secondary)' }}>
              {p.variantes.length > 1 && new Set(p.variantes.map((v) => v.precio)).size > 1 ? 'Desde ' : ''}
              {formatPrecio(p.precioDesde)}
            </p>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Paginacion({ page, total, pageSize, baseHref }: { page: number; total: number; pageSize: number; baseHref: string }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const sep = baseHref.includes('?') ? '&' : '?';
  const href = (n: number) => (n === 1 ? baseHref : `${baseHref}${sep}page=${n}`);
  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Paginación">
      {page > 1 && <a rel="prev" href={href(page - 1)} className="rounded-lg border px-4 py-2">Anterior</a>}
      <span className="px-3 text-sm text-gray-600">Página {page} de {pages}</span>
      {page < pages && <a rel="next" href={href(page + 1)} className="rounded-lg border px-4 py-2">Siguiente</a>}
    </nav>
  );
}
