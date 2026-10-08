// Grilla de productos de la tienda (server component).
import type { ProductoTienda } from '@/lib/tienda';
import { formatPrecio, productPath } from '@/lib/tienda';
import QuickAdd from './QuickAdd';

/** Pide a la CDN de Tiendanube una versión más liviana de la imagen. */
export function tnImg(src: string, size = 480): string {
  if (!src) return '';
  if (size >= 1024) return src; // la original de TN ya es 1024
  return src.replace(/-(\d+)-(\d+)\.(jpg|jpeg|png|webp)(\?.*)?$/i, `-${size}-0.$3`);
}

export function precioTransferencia(precio: number, pct: number) {
  return Math.round(precio * (1 - pct / 100));
}

export default function ProductGrid({
  productos,
  prefix,
  descTransfer = 0,
  columnas = 4,
  formato = 'grilla',
}: {
  productos: ProductoTienda[];
  prefix: string;
  descTransfer?: number;
  columnas?: 3 | 4;
  formato?: 'grilla' | 'slider';
}) {
  if (!productos.length) {
    return <p className="py-16 text-center text-gray-500">No encontramos productos acá. Probá con otra categoría o búsqueda.</p>;
  }
  const ulClass = formato === 'slider'
    ? '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:gap-5 [scrollbar-width:thin] [&>li]:w-[46%] [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-[31%] lg:[&>li]:w-[23%]'
    : `t-grid grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 ${columnas === 4 ? 'md:grid-cols-3 lg:grid-cols-4' : 'md:grid-cols-3'}`;
  return (
    <ul className={ulClass}>
      {productos.map((p, i) => {
        const varios = p.variantes.length > 1 && new Set(p.variantes.map((v) => v.precio)).size > 1;
        const antes = p.variantes.find((v) => v.precio === p.precioDesde && v.precioAntes)?.precioAntes;
        return (
          <li key={p.id} className="relative">
            <a href={`${prefix}${productPath(p)}`} className="t-card group block">
              <div className="t-card-media relative aspect-[3/4] overflow-hidden rounded-[var(--t-radius)] bg-gray-50">
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tnImg(p.image)}
                    alt={p.nombre}
                    loading={i < 4 ? 'eager' : 'lazy'}
                    className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${p.images[1] ? 'group-hover:opacity-0' : 'group-hover:scale-[1.03]'}`}
                  />
                )}
                {p.images[1] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tnImg(p.images[1])} alt="" loading="lazy" className="t-foto2 absolute inset-0 hidden h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100 [@media(hover:hover)]:block" />
                )}
                {!p.disponible && <span className="t-badge absolute left-2 top-2 bg-gray-900/85 text-white">Sin stock</span>}
                {p.disponible && p.ultimasUnidades && !p.enOferta && <span className="t-badge absolute left-2 top-2 bg-white text-gray-900">Últimas unidades</span>}
                {p.disponible && p.promo && <span className="t-badge absolute right-2 top-2 bg-gray-900 text-white">{p.promo}</span>}
                {p.disponible && p.enOferta && !!p.descuentoPct && <span className="t-badge absolute left-2 top-2 text-white" style={{ background: 'var(--t-primary)' }}>{p.descuentoPct}% OFF</span>}
              </div>
              <div className="t-card-body mt-3 space-y-1 px-0.5">
                <h3 className="line-clamp-2 text-[13px] leading-snug text-gray-700 sm:text-sm">{p.nombre}</h3>
                <p className="text-[15px] font-semibold text-gray-900">
                  {varios ? <span className="font-normal text-gray-500">Desde </span> : null}
                  {formatPrecio(p.precioDesde)}
                  {antes ? <span className="ml-2 text-xs font-normal text-gray-400 line-through">{formatPrecio(antes)}</span> : null}
                </p>
                {descTransfer > 0 && (
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold" style={{ color: 'var(--t-primary)' }}>{formatPrecio(precioTransferencia(p.precioDesde, descTransfer))}</span> con transferencia
                  </p>
                )}
              </div>
            </a>
            {p.disponible && (
              <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[3/4] t-quick-wrap">
                <span className="pointer-events-auto">
                  <QuickAdd productId={p.id} nombre={p.nombre} imagen={p.image}
                    variantes={p.variantes.map((v) => ({ id: v.id, talle: v.talle, color: v.color, stock: Math.min(v.stock, 20), precio: v.precio }))} />
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Paginacion({ page, total, pageSize, baseHref }: { page: number; total: number; pageSize: number; baseHref: string }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const sep = baseHref.includes('?') ? '&' : '?';
  const href = (n: number) => (n === 1 ? baseHref : `${baseHref}${sep}page=${n}`);
  return (
    <nav className="mt-12 flex items-center justify-center gap-3 text-sm" aria-label="Paginación">
      {page > 1 && <a rel="prev" href={href(page - 1)} className="t-btn-outline">Anterior</a>}
      <span className="px-3 text-gray-500">Página {page} de {pages}</span>
      {page < pages && <a rel="next" href={href(page + 1)} className="t-btn-outline">Siguiente</a>}
    </nav>
  );
}

export function TituloSeccion({ children, href, verMas = 'Ver todo' }: { children: React.ReactNode; href?: string; verMas?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
      <h2 className="t-h">{children}</h2>
      {href && <a href={href} className="shrink-0 text-xs uppercase tracking-[0.12em] text-gray-500 underline-offset-4 hover:underline">{verMas}</a>}
    </div>
  );
}
