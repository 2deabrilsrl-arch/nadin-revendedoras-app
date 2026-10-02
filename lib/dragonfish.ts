// lib/dragonfish.ts — cola de remitos para el puente que corre en la Servidora.
// El puente (dragonfish-bridge/bridge.ps1) consulta /api/dragonfish/pendientes,
// genera el remito en la REST API local de Dragonfish y avisa a /api/dragonfish/resultado.

import { NextResponse } from 'next/server';
import crypto from 'crypto';

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
