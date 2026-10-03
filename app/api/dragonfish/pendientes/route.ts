// Cola de consolidaciones que esperan remito en Dragonfish (solo para el puente).
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bridgeAutorizado, noAutorizado, partirSku, MAX_INTENTOS } from '@/lib/dragonfish';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!bridgeAutorizado(req)) return noAutorizado();

  // Las que quedaron "procesando" más de 15 min (el puente se cortó) vuelven a la cola
  await prisma.consolidacion.updateMany({
    where: { dfEstado: 'procesando', dfActualizadoAt: { lt: new Date(Date.now() - 15 * 60 * 1000) } },
    data: { dfEstado: 'pendiente' },
  });

  const candidatas = await prisma.consolidacion.findMany({
    where: { dfEstado: 'pendiente', dfIntentos: { lt: MAX_INTENTOS } },
    orderBy: { enviadoAt: 'asc' },
    take: 10,
    include: { user: { select: { dni: true, name: true, email: true, telefono: true, situacionFiscal: true, cuit: true, razonSocial: true, codigoDragonfish: true } } },
  });

  const out = [];
  for (const c of candidatas) {
    // Reservamos la consolidación para que no la tome otra corrida
    const lock = await prisma.consolidacion.updateMany({
      where: { id: c.id, dfEstado: 'pendiente' },
      data: { dfEstado: 'procesando', dfActualizadoAt: new Date() },
    });
    if (!lock.count) continue;

    let ids: string[] = [];
    try { ids = JSON.parse(c.pedidoIds); } catch { ids = []; }
    const lineas = await prisma.linea.findMany({ where: { pedidoId: { in: ids } } });

    // Agrupamos por SKU (la misma prenda en varios pedidos = una sola línea)
    const porSku = new Map<string, { sku: string; articulo: string; color: string; talle: string; nombre: string; cantidad: number; precio: number }>();
    const sinCodigo: string[] = [];
    for (const l of lineas) {
      const p = partirSku(l.sku);
      if (!p) { sinCodigo.push(`${l.name} (${l.sku || 'sin SKU'})`); continue; }
      const prev = porSku.get(l.sku!);
      if (prev) prev.cantidad += l.qty;
      else porSku.set(l.sku!, { sku: l.sku!, ...p, nombre: l.name, cantidad: l.qty, precio: l.mayorista });
    }

    out.push({
      id: c.id,
      referencia: `APP-${c.id.slice(-8).toUpperCase()}`,
      fecha: c.enviadoAt,
      revendedora: c.user,
      formaPago: c.formaPago,
      tipoEnvio: c.tipoEnvio,
      transporte: c.transporteNombre,
      total: c.totalMayorista,
      cantidadPedidos: ids.length,
      lineas: Array.from(porSku.values()),
      sinCodigo,
    });
  }

  return NextResponse.json({ consolidaciones: out });
}
