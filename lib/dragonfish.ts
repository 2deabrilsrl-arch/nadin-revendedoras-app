// lib/dragonfish.ts — cola de remitos para el puente que corre en la Servidora.
// El puente (dragonfish-bridge/bridge.ps1) consulta /api/dragonfish/pendientes,
// genera el remito en la REST API local de Dragonfish y avisa a /api/dragonfish/resultado.

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export const MAX_INTENTOS = 5;

/** Valida "Authorization: Bearer <DRAGONFISH_BRIDGE_SECRET>" (comparación en tiempo constante). */
export function bridgeAutorizado(req: Request): boolean {
  const secret = process.env.DRAGONFISH_BRIDGE_SECRET || '';
  if (secret.length < 24) return false;
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function noAutorizado() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}

/** SKU de Tiendanube = "ARTICULO#COLOR#TALLE" (así lo publica Dragonfish). */
export function partirSku(sku: string | null | undefined) {
  const partes = String(sku || '').split('#');
  if (partes.length !== 3 || !partes[0]) return null;
  return { articulo: partes[0].trim(), color: partes[1].trim(), talle: partes[2].trim() };
}

export interface Faltante { sku: string; nombre?: string; pedida: number; enviada: number }

/**
 * Avisa a la revendedora qué no había en stock cuando se generó el remito,
 * repartiendo lo que falta entre sus pedidos (para que sepa a qué clienta devolverle).
 */
export async function notificarFaltantes(consolidacionId: string, faltantes: Faltante[], sinRemito: boolean) {
  const c = await prisma.consolidacion.findUnique({ where: { id: consolidacionId }, select: { userId: true, pedidoIds: true } });
  if (!c || !faltantes.length) return;
  let ids: string[] = [];
  try { ids = JSON.parse(c.pedidoIds); } catch { ids = []; }
  const pedidos = await prisma.pedido.findMany({
    where: { id: { in: ids } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, cliente: true, lineas: { select: { sku: true, name: true, color: true, talle: true, qty: true } } },
  });

  // Por cada SKU faltante, se descuenta de los pedidos en orden (el más viejo primero)
  const porPedido = new Map<string, { cliente: string; items: string[] }>();
  for (const f of faltantes) {
    let resta = Math.max(0, Math.round(f.pedida - f.enviada));
    for (const p of pedidos) {
      if (resta <= 0) break;
      for (const l of p.lineas) {
        if (resta <= 0) break;
        if (l.sku !== f.sku) continue;
        const n = Math.min(resta, l.qty);
        resta -= n;
        const desc = [l.name, l.color, l.talle].filter(Boolean).join(' · ');
        const e = porPedido.get(p.id) || { cliente: p.cliente || 'Sin nombre', items: [] };
        e.items.push(`${n} × ${desc}`);
        porPedido.set(p.id, e);
      }
    }
  }
  if (!porPedido.size) return;

  const detalle = Array.from(porPedido.values()).map((e) => `${e.cliente}: ${e.items.join(', ')}`).join(' | ');
  await prisma.notificacion.create({
    data: {
      userId: c.userId,
      tipo: 'pedido_ajustado',
      titulo: sinRemito ? '⚠️ No hay stock de tu pedido' : '⚠️ Algunos productos no tienen stock',
      mensaje: (sinRemito
        ? 'Ninguno de los productos de tu envío tiene stock en este momento. '
        : 'Tu pedido ya está en preparación, pero faltan estos productos: ') + detalle +
        '. Esos productos no van en tu envío. Avisale a tu clienta y, si ya te pagó, devolvele esa parte.',
      leida: false,
      metadata: JSON.stringify({ consolidacionId, faltantes, porPedido: Object.fromEntries(porPedido) }),
    },
  });
}
