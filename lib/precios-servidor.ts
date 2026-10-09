// lib/precios-servidor.ts
// El costo Nadin (mayorista) de cada línea se toma SIEMPRE del catálogo, nunca del navegador.
import { prisma } from '@/lib/prisma';

/** Corrige el `mayorista` de cada ítem con el precio del catálogo. Devuelve un error si alguno ya no existe. */
export async function fijarMayoristaDelCatalogo<T extends { productId: any; variantId: any; mayorista: number; qty: number; name?: string }>(items: T[]): Promise<string | null> {
  const ids = Array.from(new Set(items.map((i) => String(i.productId))));
  const filas = await prisma.catalogoCache.findMany({ where: { productId: { in: ids } }, select: { productId: true, data: true } });
  const precio = new Map<string, number>();
  for (const f of filas) {
    try { for (const v of JSON.parse(f.data).variants || []) precio.set(`${f.productId}:${v.id}`, Number(v.price) || 0); } catch { /* fila corrupta */ }
  }
  for (const item of items) {
    const p = precio.get(`${item.productId}:${item.variantId}`);
    if (!p) return `${item.name || 'Un producto'} ya no está disponible. Sacalo del pedido y volvé a intentar.`;
    item.mayorista = p;
    item.qty = Math.max(1, Math.min(999, Math.floor(Number(item.qty) || 1)));
  }
  return null;
}
