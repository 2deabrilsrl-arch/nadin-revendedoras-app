'use client';
// Cuenta una visita por sesión y cada vista de producto (sin cookies ni datos personales)
import { useEffect } from 'react';

export default function Tracker({ apiBase, tipo = 'visita', productId }: { apiBase: string; tipo?: 'visita' | 'producto'; productId?: string }) {
  useEffect(() => {
    const w: any = globalThis as any;
    if (w.parent && w.parent !== w) return; // dentro del editor no cuenta
    try {
      if (tipo === 'visita') {
        if (w.sessionStorage?.getItem('tn_visita')) return;
        w.sessionStorage?.setItem('tn_visita', '1');
      }
    } catch { /* sin storage */ }
    const body = JSON.stringify({ tipo, productId });
    const url = `${apiBase}/evento`;
    if (w.navigator?.sendBeacon) w.navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    else fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  }, [apiBase, tipo, productId]);
  return null;
}
