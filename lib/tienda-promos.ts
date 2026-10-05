// Promociones automáticas de cada tienda: "lleva N paga M" (3x2, 2x1…) y "% de descuento",
// para toda la tienda, una categoría o productos elegidos. Solo servidor.
import { prisma } from '@/lib/prisma';

export interface PromoActiva {
  id: string;
  nombre: string;
  tipo: 'nxm' | 'porcentaje';
  lleva: number;
  paga: number;
  porcentaje: number;
  alcance: 'todo' | 'categoria' | 'productos';
  categoria: string[]; // slugs
  productos: string[];
}

export async function getPromosActivas(tiendaId: string): Promise<PromoActiva[]> {
  const ahora = new Date();
  const rows = await prisma.tiendaPromocion.findMany({
    where: { tiendaId, activa: true, AND: [{ OR: [{ desde: null }, { desde: { lte: ahora } }] }, { OR: [{ hasta: null }, { hasta: { gte: ahora } }] }] },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    tipo: r.tipo === 'porcentaje' ? 'porcentaje' : 'nxm',
    lleva: Math.max(2, r.lleva),
    paga: Math.max(1, Math.min(r.paga, r.lleva - 1)),
    porcentaje: Math.max(0, Math.min(r.porcentaje, 90)),
    alcance: (['todo', 'categoria', 'productos'].includes(r.alcance) ? r.alcance : 'todo') as PromoActiva['alcance'],
    categoria: String(r.categoria || '').split('/').filter(Boolean),
    productos: Array.isArray(r.productos) ? (r.productos as any[]).map(String) : [],
  }));
}

export function etiquetaPromo(p: PromoActiva): string {
  return p.tipo === 'nxm' ? `${p.lleva}x${p.paga}` : `${p.porcentaje}% OFF`;
}

export function aplica(p: PromoActiva, prod: { id: string; categorySlugs: string[] }): boolean {
  if (p.alcance === 'todo') return true;
  if (p.alcance === 'productos') return p.productos.includes(prod.id);
  return p.categoria.length > 0 && p.categoria.every((s, i) => prod.categorySlugs[i] === s);
}

/** Calcula el descuento de las promos sobre las líneas del carrito. Cada unidad recibe como mucho una promo. */
export function aplicarPromos(
  lineas: { productId: string; precio: number; qty: number }[],
  productos: Map<string, { id: string; categorySlugs: string[] }>,
  promos: PromoActiva[]
): { descuento: number; detalle: string[] } {
  // Unidades individuales (para "lleva 3 paga 2" se regalan las más baratas)
  const unidades: { productId: string; precio: number; usada: boolean }[] = [];
  for (const l of lineas) for (let i = 0; i < l.qty; i++) unidades.push({ productId: l.productId, precio: l.precio, usada: false });
  let descuento = 0;
  const detalle: string[] = [];
  for (const p of promos) {
    const elegibles = unidades.filter((u) => !u.usada && productos.get(u.productId) && aplica(p, productos.get(u.productId)!));
    if (!elegibles.length) continue;
    let d = 0;
    if (p.tipo === 'nxm') {
      const grupos = Math.floor(elegibles.length / p.lleva);
      if (!grupos) continue;
      const orden = [...elegibles].sort((a, b) => b.precio - a.precio);
      const usar = orden.slice(0, grupos * p.lleva);
      const gratis = usar.slice(-grupos * (p.lleva - p.paga)); // las más baratas del grupo
      d = gratis.reduce((a, u) => a + u.precio, 0);
      usar.forEach((u) => (u.usada = true));
    } else {
      d = Math.round(elegibles.reduce((a, u) => a + u.precio, 0) * p.porcentaje / 100);
      elegibles.forEach((u) => (u.usada = true));
    }
    if (d > 0) { descuento += d; detalle.push(`${p.nombre} (${etiquetaPromo(p)})`); }
  }
  return { descuento: Math.round(descuento), detalle };
}
