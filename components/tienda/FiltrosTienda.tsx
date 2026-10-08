'use client';
// Barra de filtros y orden: se aplica sola al cambiar cualquier opción
import { useRef } from 'react';
import { ORDENES } from '@/lib/tienda-filtros';
import { formatPrecio } from './TiendaCart';

export default function FiltrosTienda({ action, opciones, activos, ocultos = {}, total }: {
  action: string;
  opciones: { talles: string[]; colores: string[]; precios: number[] };
  activos: { talle: string; color: string; max: number; orden: string };
  ocultos?: Record<string, string>;
  total: number;
}) {
  const form = useRef<any>(null);
  const enviar = () => form.current?.requestSubmit?.() ?? form.current?.submit();
  const sel = 'rounded-[var(--t-btn-radius)] border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900';
  const hayFiltros = !!(activos.talle || activos.color || activos.max);
  const limpiar = action + (ocultos.q ? `?q=${encodeURIComponent(ocultos.q)}` : '');

  return (
    <form ref={form} action={action} method="get" className="mb-8 flex flex-wrap items-center gap-2 border-y border-black/5 py-3">
      {Object.entries(ocultos).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <span className="mr-1 text-xs uppercase tracking-[0.12em] text-gray-500">Filtrar</span>
      {opciones.talles.length > 1 && (
        <select name="talle" defaultValue={activos.talle} onChange={enviar} className={sel} aria-label="Talle">
          <option value="">Talle</option>
          {opciones.talles.map((t) => <option key={t} value={t}>Talle {t}</option>)}
        </select>
      )}
      {opciones.colores.length > 1 && (
        <select name="color" defaultValue={activos.color} onChange={enviar} className={sel} aria-label="Color">
          <option value="">Color</option>
          {opciones.colores.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
      {opciones.precios.length > 0 && (
        <select name="max" defaultValue={activos.max ? String(activos.max) : ''} onChange={enviar} className={sel} aria-label="Precio">
          <option value="">Precio</option>
          {opciones.precios.map((p) => <option key={p} value={p}>Hasta {formatPrecio(p)}</option>)}
        </select>
      )}
      {hayFiltros && <a href={limpiar} className="px-2 text-xs text-gray-500 underline">Limpiar</a>}
      <span className="ml-auto flex items-center gap-2">
        <span className="hidden text-xs text-gray-500 sm:inline">{total} productos ·</span>
        <select name="orden" defaultValue={activos.orden} onChange={enviar} className={sel} aria-label="Ordenar">
          {ORDENES.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
        </select>
      </span>
      <noscript><button className="t-btn-outline">Aplicar</button></noscript>
    </form>
  );
}
