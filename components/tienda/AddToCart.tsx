'use client';

import { useMemo, useState } from 'react';
import { useTiendaCart, formatPrecio } from './TiendaCart';

interface Variante {
  id: string;
  talle: string;
  color: string;
  stock: number;
  precio: number;
}

export default function AddToCart({
  productId,
  nombre,
  imagen,
  variantes,
}: {
  productId: string;
  nombre: string;
  imagen: string;
  variantes: Variante[];
}) {
  const { add, prefix } = useTiendaCart();
  const colores = useMemo(() => Array.from(new Set(variantes.map((v) => v.color).filter(Boolean))), [variantes]);
  const [color, setColor] = useState<string>(() => colores.find((c) => variantes.some((v) => v.color === c && v.stock > 0)) || colores[0] || '');
  const talles = useMemo(
    () => variantes.filter((v) => !colores.length || v.color === color),
    [variantes, colores.length, color]
  );
  const [variantId, setVariantId] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [agregado, setAgregado] = useState(false);

  const seleccionada = variantes.find((v) => v.id === variantId) || (talles.length === 1 ? talles[0] : undefined);
  const precio = seleccionada?.precio ?? Math.min(...variantes.map((v) => v.precio));
  const sinStock = seleccionada ? seleccionada.stock <= 0 : false;
  const maxQty = seleccionada ? Math.max(1, Math.min(seleccionada.stock, 20)) : 20;

  function agregar() {
    if (!seleccionada || seleccionada.stock <= 0) return;
    add({
      productId,
      variantId: seleccionada.id,
      nombre,
      talle: seleccionada.talle,
      color: seleccionada.color,
      imagen,
      precio: seleccionada.precio,
      qty,
    });
    setAgregado(true);
  }

  return (
    <div className="space-y-5">
      <p className="text-3xl font-bold" style={{ color: 'var(--t-secondary)' }}>
        {formatPrecio(precio)}
      </p>

      {colores.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Color: <span className="font-normal">{color}</span></legend>
          <div className="flex flex-wrap gap-2">
            {colores.map((c) => {
              const hay = variantes.some((v) => v.color === c && v.stock > 0);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setColor(c); setVariantId(''); setAgregado(false); }}
                  className={`rounded-full border px-4 py-2 text-sm ${c === color ? 'border-[var(--t-primary)] font-semibold' : 'border-gray-300'} ${hay ? '' : 'opacity-40 line-through'}`}
                  aria-pressed={c === color}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {talles.some((v) => v.talle) && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Talle</legend>
          <div className="flex flex-wrap gap-2">
            {talles.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={v.stock <= 0}
                onClick={() => { setVariantId(v.id); setQty(1); setAgregado(false); }}
                className={`min-w-[52px] rounded-lg border px-3 py-2 text-sm ${seleccionada?.id === v.id ? 'border-[var(--t-primary)] bg-[var(--t-primary)] text-white' : 'border-gray-300'} disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through`}
                aria-pressed={seleccionada?.id === v.id}
              >
                {v.talle || 'Único'}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {seleccionada && !sinStock && seleccionada.stock <= 3 && (
        <p className="text-sm font-medium text-amber-700">¡Últimas unidades!</p>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-gray-300">
          <button type="button" className="px-3 py-2 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Restar">−</button>
          <span className="w-8 text-center" aria-live="polite">{qty}</span>
          <button type="button" className="px-3 py-2 text-lg" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} aria-label="Sumar">+</button>
        </div>
        <button
          type="button"
          onClick={agregar}
          disabled={!seleccionada || sinStock}
          className="flex-1 rounded-lg px-6 py-3 font-semibold text-white transition disabled:opacity-50"
          style={{ background: 'var(--t-primary)' }}
        >
          {!seleccionada ? 'Elegí un talle' : sinStock ? 'Sin stock' : 'Agregar al carrito'}
        </button>
      </div>

      {agregado && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800" role="status">
          ¡Agregado! <a href={`${prefix}/carrito`} className="font-semibold underline">Ver carrito</a>
        </div>
      )}
    </div>
  );
}
