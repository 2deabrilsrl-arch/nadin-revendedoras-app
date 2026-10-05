'use client';

import { useMemo, useState } from 'react';
import { useTiendaCart, formatPrecio } from './TiendaCart';

interface Variante {
  id: string;
  talle: string;
  color: string;
  stock: number;
  precio: number;
  precioAntes?: number | null;
}

export default function AddToCart({
  productId,
  nombre,
  imagen,
  variantes,
  descTransfer = 0,
  cuotas = null,
}: {
  productId: string;
  nombre: string;
  imagen: string;
  variantes: Variante[];
  descTransfer?: number;
  cuotas?: { cantidad: number; sinInteres: boolean } | null;
}) {
  const { add, prefix } = useTiendaCart();
  const colores = useMemo(() => Array.from(new Set(variantes.map((v) => v.color).filter(Boolean))), [variantes]);
  const [color, setColor] = useState<string>(() => colores.find((c) => variantes.some((v) => v.color === c && v.stock > 0)) || colores[0] || '');
  const talles = useMemo(() => variantes.filter((v) => !colores.length || v.color === color), [variantes, colores.length, color]);
  const [variantId, setVariantId] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [agregado, setAgregado] = useState(false);

  const seleccionada = variantes.find((v) => v.id === variantId) || (talles.length === 1 ? talles[0] : undefined);
  const precio = seleccionada?.precio ?? Math.min(...variantes.map((v) => v.precio));
  const antes = (seleccionada ?? variantes.find((v) => v.precio === precio))?.precioAntes || null;
  const sinStock = seleccionada ? seleccionada.stock <= 0 : false;
  const maxQty = seleccionada ? Math.max(1, Math.min(seleccionada.stock, 20)) : 20;

  function agregar() {
    if (!seleccionada || seleccionada.stock <= 0) return;
    add({ productId, variantId: seleccionada.id, nombre, talle: seleccionada.talle, color: seleccionada.color, imagen, precio: seleccionada.precio, qty });
    setAgregado(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-2xl font-semibold text-gray-900">
          {formatPrecio(precio)}
          {antes && antes > precio ? (
            <>
              <span className="ml-3 text-base font-normal text-gray-400 line-through">{formatPrecio(antes)}</span>
              <span className="t-badge ml-2 align-middle text-white" style={{ background: 'var(--t-primary)' }}>{Math.round((1 - precio / antes) * 100)}% OFF</span>
            </>
          ) : null}
        </p>
        {cuotas && cuotas.cantidad > 1 && (
          <p className="mt-1 text-sm text-gray-600">
            <strong>{cuotas.cantidad} cuotas{cuotas.sinInteres ? ' sin interés' : ''}</strong> de {formatPrecio(Math.ceil(precio / cuotas.cantidad))}
          </p>
        )}
        {descTransfer > 0 && (
          <p className="mt-1 text-sm text-gray-500">
            <span className="font-semibold" style={{ color: 'var(--t-primary)' }}>{formatPrecio(Math.round(precio * (1 - descTransfer / 100)))}</span> pagando con transferencia
          </p>
        )}
      </div>

      {colores.length > 1 && (
        <fieldset>
          <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-900">Color: <span className="font-normal normal-case tracking-normal text-gray-600">{color}</span></legend>
          <div className="flex flex-wrap gap-2">
            {colores.map((c) => {
              const hay = variantes.some((v) => v.color === c && v.stock > 0);
              return (
                <button key={c} type="button" onClick={() => { setColor(c); setVariantId(''); setAgregado(false); }} aria-pressed={c === color}
                  className={`rounded-[var(--t-btn-radius)] border px-4 py-2 text-sm transition ${c === color ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'} ${hay ? '' : 'opacity-40 line-through'}`}>
                  {c}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {talles.some((v) => v.talle) && (
        <fieldset>
          <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-900">Talle</legend>
          <div className="flex flex-wrap gap-2">
            {talles.map((v) => (
              <button key={v.id} type="button" disabled={v.stock <= 0} onClick={() => { setVariantId(v.id); setQty(1); setAgregado(false); }} aria-pressed={seleccionada?.id === v.id}
                className={`min-w-[52px] rounded-[var(--t-btn-radius)] border px-3 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-35 disabled:line-through ${seleccionada?.id === v.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 hover:border-gray-400'}`}>
                {v.talle || 'Único'}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {seleccionada && !sinStock && seleccionada.stock <= 3 && <p className="text-sm text-amber-700">¡Últimas unidades!</p>}

      <div className="flex items-stretch gap-3">
        <div className="flex items-center rounded-[var(--t-btn-radius)] border border-gray-200">
          <button type="button" className="px-3 py-2 text-lg text-gray-600" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Restar">−</button>
          <span className="w-8 text-center text-sm" aria-live="polite">{qty}</span>
          <button type="button" className="px-3 py-2 text-lg text-gray-600" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} aria-label="Sumar">+</button>
        </div>
        <button type="button" onClick={agregar} disabled={!seleccionada || sinStock} className="t-btn flex-1">
          {!seleccionada ? 'Elegí un talle' : sinStock ? 'Sin stock' : 'Agregar al carrito'}
        </button>
      </div>

      {agregado && (
        <div className="flex items-center justify-between gap-3 rounded-[var(--t-radius)] bg-gray-50 p-3 text-sm" role="status">
          <span>Lo agregaste al carrito.</span>
          <a href={`${prefix}/carrito`} className="font-semibold underline underline-offset-4">Ir a comprar</a>
        </div>
      )}
    </div>
  );
}
