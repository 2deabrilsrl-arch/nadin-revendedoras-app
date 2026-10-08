'use client';
// Compra rápida desde el listado: elegís talle (y color) sin entrar al producto
import { useMemo, useState } from 'react';
import { useTiendaCart, formatPrecio } from './TiendaCart';

interface V { id: string; talle: string; color: string; stock: number; precio: number }

export default function QuickAdd({ productId, nombre, imagen, variantes }: { productId: string; nombre: string; imagen: string; variantes: V[] }) {
  const { add, prefix } = useTiendaCart();
  const [abierto, setAbierto] = useState(false);
  const [listo, setListo] = useState('');
  const conStock = variantes.filter((v) => v.stock > 0);
  const colores = useMemo(() => Array.from(new Set(variantes.map((v) => v.color).filter(Boolean))), [variantes]);
  const [color, setColor] = useState(() => colores.find((c) => conStock.some((v) => v.color === c)) || colores[0] || '');
  if (!conStock.length) return null;

  function agregar(v: V) {
    add({ productId, variantId: v.id, nombre, talle: v.talle, color: v.color, imagen, precio: v.precio, qty: 1 });
    setListo([v.talle, v.color].filter(Boolean).join(' · ') || 'Agregado');
    setAbierto(false);
    setTimeout(() => setListo(''), 3500);
  }

  function tocar(e: any) {
    e.preventDefault();
    e.stopPropagation();
    if (variantes.length === 1) return agregar(variantes[0]);
    setAbierto(true);
  }

  const talles = variantes.filter((v) => !colores.length || v.color === color);

  return (
    <>
      <button type="button" onClick={tocar} aria-label={`Agregar ${nombre} al carrito`}
        className="t-quick absolute bottom-2 right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-md ring-1 ring-black/5 transition hover:scale-105">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      </button>

      {listo && (
        <div className="fixed inset-x-3 bottom-4 z-[60] mx-auto flex max-w-md items-center justify-between gap-3 rounded-[var(--t-radius)] bg-gray-900 px-4 py-3 text-sm text-white shadow-xl sm:inset-x-auto sm:right-6" role="status">
          <span>Agregado al carrito{listo !== 'Agregado' ? ` (${listo})` : ''}</span>
          <a href={`${prefix}/carrito`} className="font-semibold underline underline-offset-4">Ver carrito</a>
        </div>
      )}

      {abierto && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={`Elegí talle de ${nombre}`}>
          <button className="absolute inset-0 bg-black/40" aria-label="Cerrar" onClick={() => setAbierto(false)} />
          <div className="relative w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <div className="mb-4 flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {imagen && <img src={imagen} alt="" className="h-16 w-12 rounded object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-gray-900">{nombre}</p>
                <p className="text-sm text-gray-600">{formatPrecio(Math.min(...talles.map((v) => v.precio)))}</p>
              </div>
              <button type="button" onClick={() => setAbierto(false)} className="text-2xl leading-none text-gray-400" aria-label="Cerrar">×</button>
            </div>
            {colores.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-900">Color</p>
                <div className="flex flex-wrap gap-2">
                  {colores.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)} aria-pressed={c === color}
                      className={`rounded-[var(--t-btn-radius)] border px-3 py-2 text-sm ${c === color ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-600'}`}>{c}</button>
                  ))}
                </div>
              </div>
            )}
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-900">Talle · tocá para agregar</p>
            <div className="flex flex-wrap gap-2">
              {talles.map((v) => (
                <button key={v.id} type="button" disabled={v.stock <= 0} onClick={() => agregar(v)}
                  className="min-w-[52px] rounded-[var(--t-btn-radius)] border border-gray-200 px-3 py-2.5 text-sm hover:border-gray-900 disabled:cursor-not-allowed disabled:opacity-35 disabled:line-through">
                  {v.talle || 'Único'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
