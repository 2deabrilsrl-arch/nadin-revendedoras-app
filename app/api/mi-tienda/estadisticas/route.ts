// Estadísticas simples de la tienda: visitas, pedidos, ventas y productos más vistos / vendidos
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAndTienda, noAuth } from '@/lib/mi-tienda';

export const dynamic = 'force-dynamic';
const PAGADAS = ['pagada', 'enviada_nadin', 'lista', 'entregada'];

export async function GET(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const dias = Math.min(90, Math.max(1, Number(new URL(req.url).searchParams.get('dias')) || 30));
  const tiendaId = ctx.tienda.id;
  // Días en hora de Argentina
  const hoyAr = new Date(Date.now() - 3 * 3600 * 1000);
  const desde = new Date(Date.UTC(hoyAr.getUTCFullYear(), hoyAr.getUTCMonth(), hoyAr.getUTCDate() - (dias - 1)));
  const desdeOrdenes = new Date(desde.getTime() + 3 * 3600 * 1000);

  const [stats, ordenes, vistos] = await Promise.all([
    prisma.tiendaStatDia.findMany({ where: { tiendaId, fecha: { gte: desde } } }),
    prisma.ordenTienda.findMany({
      where: { tiendaId, createdAt: { gte: desdeOrdenes } },
      select: { createdAt: true, estado: true, total: true, envioCosto: true, totalMayorista: true, items: { select: { productId: true, nombre: true, qty: true, precio: true, imagen: true } } },
    }),
    prisma.tiendaStatProducto.groupBy({ by: ['productId'], where: { tiendaId, fecha: { gte: desde } }, _sum: { vistas: true }, orderBy: { _sum: { vistas: 'desc' } }, take: 5 }),
  ]);

  const clave = (d: Date) => new Date(d.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);
  const porDia: Record<string, { fecha: string; visitas: number; pedidos: number; ventas: number }> = {};
  for (let i = 0; i < dias; i++) {
    const f = new Date(desde.getTime() + i * 864e5).toISOString().slice(0, 10);
    porDia[f] = { fecha: f, visitas: 0, pedidos: 0, ventas: 0 };
  }
  for (const s of stats) { const f = s.fecha.toISOString().slice(0, 10); if (porDia[f]) porDia[f].visitas += s.visitas; }
  let pedidos = 0, pagados = 0, ventas = 0, ganancia = 0;
  const vendidos = new Map<string, { productId: string; nombre: string; imagen: string | null; unidades: number; total: number }>();
  for (const o of ordenes) {
    pedidos++;
    const f = clave(o.createdAt);
    if (porDia[f]) porDia[f].pedidos++;
    if (!PAGADAS.includes(o.estado)) continue;
    pagados++;
    ventas += o.total;
    ganancia += o.total - o.envioCosto - o.totalMayorista;
    if (porDia[f]) porDia[f].ventas += o.total;
    for (const it of o.items) {
      const v = vendidos.get(it.productId) || { productId: it.productId, nombre: it.nombre, imagen: it.imagen, unidades: 0, total: 0 };
      v.unidades += it.qty; v.total += it.qty * it.precio;
      vendidos.set(it.productId, v);
    }
  }
  const visitas = stats.reduce((a, s) => a + s.visitas, 0);
  const vistasProducto = stats.reduce((a, s) => a + s.vistasProducto, 0);

  // Nombres de los más vistos
  const ids = vistos.map((v) => v.productId);
  const nombres = new Map<string, { nombre: string; imagen: string }>();
  const filas = await prisma.catalogoCache.findMany({ where: { productId: { in: ids.filter((i) => !i.startsWith('pp')) } }, select: { productId: true, data: true } });
  for (const f of filas) { try { const d = JSON.parse(f.data); nombres.set(f.productId, { nombre: d.name, imagen: d.image }); } catch { /* nada */ } }
  const propios = await prisma.tiendaProductoPropio.findMany({ where: { tiendaId, id: { in: ids.filter((i) => i.startsWith('pp')).map((i) => i.slice(2)) } }, select: { id: true, nombre: true, imagenes: true } });
  for (const p of propios) nombres.set(`pp${p.id}`, { nombre: p.nombre, imagen: ((p.imagenes as any[]) || [])[0] || '' });

  return NextResponse.json({
    dias,
    totales: { visitas, vistasProducto, pedidos, pagados, ventas, ganancia, conversion: visitas ? Math.round((pagados / visitas) * 1000) / 10 : 0 },
    porDia: Object.values(porDia),
    masVistos: vistos.map((v) => ({ productId: v.productId, vistas: v._sum.vistas || 0, ...(nombres.get(v.productId) || { nombre: 'Producto', imagen: '' }) })),
    masVendidos: Array.from(vendidos.values()).sort((a, b) => b.unidades - a.unidades).slice(0, 5),
  });
}
