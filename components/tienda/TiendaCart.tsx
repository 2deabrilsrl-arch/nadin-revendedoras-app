'use client';

// Carrito de la tienda pública (independiente del carrito de la revendedora).
// Solo guarda ids y cantidades: los precios SIEMPRE se recalculan en el servidor.

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

export interface TiendaCartItem {
  productId: string;
  variantId: string;
  nombre: string;
  talle: string;
  color: string;
  imagen: string;
  precio: number; // solo para mostrar
  qty: number;
}

interface Ctx {
  items: TiendaCartItem[];
  count: number;
  subtotal: number;
  add: (item: TiendaCartItem) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  prefix: string;
  tiendaSlug: string;
}

const TiendaCartContext = createContext<Ctx | null>(null);

export function TiendaCartProvider({
  children,
  tiendaId,
  tiendaSlug,
  prefix,
}: {
  children: ReactNode;
  tiendaId: string;
  tiendaSlug: string;
  prefix: string;
}) {
  const key = `tienda_cart_${tiendaId}`;
  const [items, setItems] = useState<TiendaCartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = (globalThis as any).localStorage?.getItem(key);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* sin storage */
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      (globalThis as any).localStorage?.setItem(key, JSON.stringify(items));
    } catch {
      /* sin storage */
    }
  }, [items, loaded, key]);

  const add = useCallback((item: TiendaCartItem) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.variantId === item.variantId);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: Math.min(copy[i].qty + item.qty, 99) };
        return copy;
      }
      return [...prev, item];
    });
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((x) => (x.variantId === variantId ? { ...x, qty: Math.max(0, Math.min(qty, 99)) } : x))
        .filter((x) => x.qty > 0)
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((x) => x.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((a, x) => a + x.qty, 0);
  const subtotal = items.reduce((a, x) => a + x.qty * x.precio, 0);

  return (
    <TiendaCartContext.Provider value={{ items, count, subtotal, add, setQty, remove, clear, prefix, tiendaSlug }}>
      {children}
    </TiendaCartContext.Provider>
  );
}

export function useTiendaCart() {
  const ctx = useContext(TiendaCartContext);
  if (!ctx) throw new Error('useTiendaCart fuera de TiendaCartProvider');
  return ctx;
}

export function formatPrecio(n: number): string {
  return `$${Math.round(n || 0).toLocaleString('es-AR')}`;
}

export function CartBadgeLink() {
  const { count, prefix } = useTiendaCart();
  return (
    <a href={`${prefix}/carrito`} className="relative inline-flex items-center gap-1 rounded-full px-3 py-2 hover:bg-black/5" aria-label={`Carrito, ${count} productos`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 7h12l-1 13H7L6 7Z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 min-w-[20px] rounded-full px-1 text-center text-xs font-bold text-white" style={{ background: 'var(--t-primary)' }}>
          {count}
        </span>
      )}
    </a>
  );
}
