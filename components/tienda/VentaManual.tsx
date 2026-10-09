'use client';
// Cargar a mano una venta hecha por WhatsApp, Instagram o en persona.
// Queda como un pedido más: descuenta tu stock, se puede mandar a Nadin y suma en tus números.
import { useEffect, useRef, useState } from 'react';

const fmt = (n: number) => `$${Math.round(n || 0).toLocaleString('es-AR')}`;
const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-500';
const btn = 'rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
const btnSec = 'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50';
const val = (e: any) => (e.target as any).value as string;

const PAGOS = [
  ['efectivo', 'Efectivo'],
  ['transferencia', 'Transferencia'],
  ['mercadopago', 'Mercado Pago'],
  ['tarjeta', 'Tarjeta'],
  ['otro', 'Otro'],
];
const ENTREGAS = [
  ['en_mano', 'Ya se lo entregué / en mano'],
  ['retiro', 'Lo retira'],
  ['envio', 'Se lo envío'],
];

type Linea = { productId: string; variantId: string; nombre: string; detalle: string; image: string; precio: string; qty: number; stock: number; stockPropio: number };

async function api(path: string, method = 'GET', body?: any) {
  const r = await fetch(`/api/mi-tienda${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const data: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Error');
  return data;
}

export default function VentaManual({ onToast, onCerrar }: { onToast: (s: string) => void; onCerrar: (cambio: boolean) => void }) {
  const [cliente, setCliente] = useState({ nombre: '', telefono: '', email: '' });
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState<any[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [pago, setPago] = useState('efectivo');
  const [pagada, setPagada] = useState(true);
  const [entrega, setEntrega] = useState('en_mano');
  const [envioCosto, setEnvioCosto] = useState('');
  const [direccion, setDireccion] = useState('');
  const [descuento, setDescuento] = useState('');
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [err, setErr] = useState('');
  const timer = useRef<any>(null);

  // Búsqueda con una pausa corta mientras escribe
  useEffect(() => {
    clearTimeout(timer.current);
    const texto = q.trim();
    timer.current = setTimeout(() => {
      setBuscando(true);
      api(`/productos?variantes=1${texto ? `&q=${encodeURIComponent(texto)}` : ''}`)
        .then((d) => setResultados(d.productos || []))
        .catch(() => setResultados([]))
        .finally(() => setBuscando(false));
    }, texto ? 350 : 0);
    return () => clearTimeout(timer.current);
  }, [q]);

  const agregar = (p: any, v: any) => {
    setErr('');
    setLineas((prev) => {
      const i = prev.findIndex((l) => l.variantId === v.id);
      if (i >= 0) {
        const copia = [...prev];
        copia[i] = { ...copia[i], qty: Math.min(copia[i].qty + 1, v.stock) };
        return copia;
      }
      return [...prev, {
        productId: p.id, variantId: v.id, nombre: p.nombre, detalle: [v.talle, v.color].filter(Boolean).join(' · '),
        image: p.image, precio: String(v.precio), qty: 1, stock: v.stock, stockPropio: v.stockPropio || 0,
      }];
    });
  };
  const cambiar = (id: string, cambios: Partial<Linea>) => setLineas((prev) => prev.map((l) => (l.variantId === id ? { ...l, ...cambios } : l)));
  const quitar = (id: string) => setLineas((prev) => prev.filter((l) => l.variantId !== id));

  const subtotal = lineas.reduce((a, l) => a + (Number(l.precio) || 0) * l.qty, 0);
  const desc = Math.min(Math.max(0, Number(descuento) || 0), subtotal);
  const envio = entrega === 'envio' ? Math.max(0, Number(envioCosto) || 0) : 0;
  const total = subtotal - desc + envio;
  // ¿Algo de esto lo tiene que armar Nadin? (no es producto suyo ni alcanza su stock)
  const deNadin = lineas.some((l) => !l.productId.startsWith('pp') && !l.variantId.startsWith('px') && l.qty > l.stockPropio);

  const guardar = async () => {
    setErr('');
    if (cliente.nombre.trim().length < 2) { setErr('Poné el nombre de la clienta.'); return; }
    if (!lineas.length) { setErr('Agregá al menos un producto.'); return; }
    if (lineas.some((l) => !(Number(l.precio) > 0))) { setErr('Revisá los precios: tienen que ser mayores a 0.'); return; }
    setGuardando(true);
    try {
      const r = await api('/ordenes', 'POST', {
        cliente,
        items: lineas.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty, precio: Number(l.precio) })),
        pago, pagada, entrega,
        envioCosto: envio, direccion, descuento: desc, nota,
      });
      onToast(`Venta #${r.orden.numero} guardada${deNadin ? (pagada ? '. Ya la podés enviar a Nadin.' : '. Cuando te pague, marcala como pagada.') : '.'}`);
      onCerrar(true);
    } catch (e: any) {
      setErr(e.message);
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Nueva venta manual</h2>
        <button type="button" className={btnSec} onClick={() => onCerrar(false)}>Volver</button>
      </div>
      <p className="text-sm text-gray-600">Para ventas que hiciste por WhatsApp, Instagram o en persona. Quedan con tus pedidos: descuentan tu stock y las podés mandar a Nadin igual que las de la tienda.</p>

      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <p className="font-semibold">1. Clienta</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={input} placeholder="Nombre *" value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: val(e) })} />
          <input className={input} placeholder="WhatsApp (opcional)" inputMode="tel" value={cliente.telefono} onChange={(e) => setCliente({ ...cliente, telefono: val(e) })} />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <p className="font-semibold">2. Productos</p>
        <input className={input} placeholder="Buscar producto (nombre o código)" value={q} onChange={(e) => setQ(val(e))} />
        {buscando && <p className="text-xs text-gray-500">Buscando…</p>}
        {resultados && resultados.length === 0 && !buscando && <p className="text-sm text-gray-500">{q.trim() ? `No encontramos “${q}” con stock.` : 'Escribí para buscar.'}</p>}
        {resultados && resultados.length > 0 && (
          <ul className="max-h-80 divide-y divide-gray-100 overflow-auto rounded-xl ring-1 ring-black/5">
            {resultados.map((p) => (
              <li key={p.id} className="flex gap-3 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.image ? <img src={p.image} alt="" className="h-14 w-11 shrink-0 rounded object-cover" /> : <div className="h-14 w-11 shrink-0 rounded bg-gray-100" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{p.nombre}{p.propio && <span className="ml-1 rounded bg-blue-100 px-1.5 text-[10px] font-semibold text-blue-800">Tuyo</span>}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.variantes.map((v: any) => (
                      <button key={v.id} type="button" className="rounded-full border border-gray-300 px-2 py-0.5 text-xs hover:border-pink-500 hover:bg-pink-50" onClick={() => agregar(p, v)}>
                        {[v.talle, v.color].filter(Boolean).join(' · ') || 'Único'} · {fmt(v.precio)}
                      </button>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {lineas.length > 0 && (
          <ul className="divide-y divide-gray-100 rounded-xl bg-pink-50/40 ring-1 ring-pink-100">
            {lineas.map((l) => (
              <li key={l.variantId} className="flex flex-wrap items-center gap-2 p-3">
                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate text-sm font-medium">{l.nombre}</p>
                  <p className="text-xs text-gray-500">{l.detalle || 'Único'}{l.stockPropio > 0 && ` · ${Math.min(l.qty, l.stockPropio)} de tu stock`}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" className={btnSec} aria-label="Menos" onClick={() => (l.qty > 1 ? cambiar(l.variantId, { qty: l.qty - 1 }) : quitar(l.variantId))}>−</button>
                  <span className="w-6 text-center text-sm">{l.qty}</span>
                  <button type="button" className={btnSec} aria-label="Más" disabled={l.qty >= l.stock} onClick={() => cambiar(l.variantId, { qty: l.qty + 1 })}>+</button>
                </div>
                <label className="flex items-center gap-1 text-xs text-gray-500">$
                  <input className={`${input} w-24`} inputMode="numeric" aria-label="Precio unitario" value={l.precio} onChange={(e) => cambiar(l.variantId, { precio: val(e).replace(/[^\d]/g, '') })} />
                </label>
                <button type="button" className="text-xs text-red-700 underline" onClick={() => quitar(l.variantId)}>Quitar</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <p className="font-semibold">3. Pago y entrega</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm">Cómo pagó
            <select className={input} value={pago} onChange={(e) => setPago(val(e))}>
              {PAGOS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
          </label>
          <label className="text-sm">Entrega
            <select className={input} value={entrega} onChange={(e) => setEntrega(val(e))}>
              {ENTREGAS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
          </label>
        </div>
        {entrega === 'envio' && (
          <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
            <input className={input} inputMode="numeric" placeholder="Costo envío" value={envioCosto} onChange={(e) => setEnvioCosto(val(e).replace(/[^\d]/g, ''))} />
            <input className={input} placeholder="Dirección (opcional)" value={direccion} onChange={(e) => setDireccion(val(e))} />
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
          <input className={input} inputMode="numeric" placeholder="Descuento $" value={descuento} onChange={(e) => setDescuento(val(e).replace(/[^\d]/g, ''))} />
          <input className={input} placeholder="Nota (opcional)" value={nota} onChange={(e) => setNota(val(e))} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-pink-600" checked={pagada} onChange={(e) => setPagada((e.target as any).checked)} />
          Ya me pagó
        </label>
      </section>

      <div className="sticky bottom-3 z-20 space-y-2 rounded-2xl bg-white p-4 shadow-2xl ring-2 ring-pink-400">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-gray-600">{lineas.reduce((a, l) => a + l.qty, 0)} unidades{desc ? ` · −${fmt(desc)}` : ''}{envio ? ` · envío ${fmt(envio)}` : ''}</span>
          <span className="text-lg font-bold">{fmt(total)}</span>
        </div>
        {err && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-800" role="alert">{err}</p>}
        <button type="button" className={`${btn} w-full`} disabled={guardando} onClick={guardar}>{guardando ? 'Guardando…' : 'Guardar venta'}</button>
      </div>
    </div>
  );
}
