// Filtros y orden del listado de la tienda (categorías y búsqueda), del lado del servidor.
import type { ProductoTienda } from '@/lib/tienda';

export type Orden = 'relevancia' | 'precio_asc' | 'precio_desc' | 'nuevos' | 'vendidos';
export const ORDENES: { id: Orden; nombre: string }[] = [
  { id: 'relevancia', nombre: 'Destacados' },
  { id: 'vendidos', nombre: 'Más vendidos' },
  { id: 'nuevos', nombre: 'Más nuevos' },
  { id: 'precio_asc', nombre: 'Menor precio' },
  { id: 'precio_desc', nombre: 'Mayor precio' },
];

export interface ParamsFiltro { talle?: string; color?: string; max?: string; orden?: string }

const ORDEN_TALLES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', '4XL', '5XL'];
function compararTalle(a: string, b: string) {
  const ia = ORDEN_TALLES.indexOf(a.toUpperCase());
  const ib = ORDEN_TALLES.indexOf(b.toUpperCase());
  if (ia >= 0 && ib >= 0) return ia - ib;
  const na = parseFloat(a);
  const nb = parseFloat(b);
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  if (ia >= 0) return -1;
  if (ib >= 0) return 1;
  return a.localeCompare(b, 'es');
}

export function aplicarFiltros(productos: ProductoTienda[], p: ParamsFiltro) {
  const talle = String(p.talle || '').slice(0, 30);
  const color = String(p.color || '').slice(0, 40);
  const max = Math.max(0, parseInt(String(p.max || ''), 10) || 0);
  const orden = (ORDENES.find((o) => o.id === p.orden)?.id || 'relevancia') as Orden;

  // Opciones disponibles (de los productos de esta categoría/búsqueda, con stock)
  const talles = new Set<string>();
  const colores = new Set<string>();
  let precioMax = 0;
  for (const prod of productos) {
    for (const v of prod.variantes) {
      if (v.stock <= 0) continue;
      if (v.talle) talles.add(v.talle);
      if (v.color) colores.add(v.color);
    }
    precioMax = Math.max(precioMax, prod.precioDesde);
  }

  let lista = productos.filter((prod) => {
    if (max && prod.precioDesde > max) return false;
    if (!talle && !color) return true;
    return prod.variantes.some((v) => v.stock > 0 && (!talle || v.talle === talle) && (!color || v.color === color));
  });

  if (orden === 'precio_asc') lista = [...lista].sort((a, b) => a.precioDesde - b.precioDesde);
  else if (orden === 'precio_desc') lista = [...lista].sort((a, b) => b.precioDesde - a.precioDesde);
  else if (orden === 'vendidos') lista = [...lista].sort((a, b) => a.rank - b.rank);
  else if (orden === 'nuevos') lista = [...lista].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

  // Topes de precio redondeados para elegir rápido
  const pasos = [10000, 20000, 30000, 50000, 80000, 120000].filter((x) => x < precioMax);

  return {
    lista,
    activos: { talle, color, max, orden },
    opciones: {
      talles: Array.from(talles).sort(compararTalle).slice(0, 30),
      colores: Array.from(colores).sort((a, b) => a.localeCompare(b, 'es')).slice(0, 30),
      precios: pasos,
    },
  };
}

/** Query string con los filtros activos (para paginar sin perderlos). */
export function qsFiltros(a: { talle: string; color: string; max: number; orden: string }, extra: Record<string, string> = {}) {
  const q = new URLSearchParams(extra);
  if (a.talle) q.set('talle', a.talle);
  if (a.color) q.set('color', a.color);
  if (a.max) q.set('max', String(a.max));
  if (a.orden && a.orden !== 'relevancia') q.set('orden', a.orden);
  const s = q.toString();
  return s ? `?${s}` : '';
}
