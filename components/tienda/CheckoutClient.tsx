'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTiendaCart, formatPrecio } from './TiendaCart';
import { tnImgClient } from './img';

interface Pago { id: string; tipo: string; nombre: string; descuentoPct: number }
interface Envio { id: string; tipo: string; nombre: string; descripcion: string | null; precio: number; gratisDesde: number | null; pideDireccion: boolean }
interface Config { pagos: Pago[]; envios: Envio[]; hayCupones: boolean }
interface Cot {
  errores: string[]; subtotal: number; descuentoCupon: number; descuentoPago: number; envioCosto: number; total: number;
  cupon: { codigo: string } | null; cuponError: string | null;
}

export default function CheckoutClient({ apiBase, terminosHref }: { apiBase: string; terminosHref: string }) {
  const { items, setQty, remove, clear, prefix } = useTiendaCart();
  const [config, setConfig] = useState<Config | null>(null);
  const [envioId, setEnvioId] = useState('');
  const [pagoId, setPagoId] = useState('');
  const [cuponInput, setCuponInput] = useState('');
  const [cupon, setCupon] = useState('');
  const [cot, setCot] = useState<Cot | null>(null);
  const [cliente, setCliente] = useState({ nombre: '', telefono: '', email: '', dni: '' });
  const [dir, setDir] = useState({ calle: '', numero: '', piso: '', localidad: '', provincia: '', cp: '' });
  const [nota, setNota] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${apiBase}/config`).then((r) => r.json()).then((c: Config) => {
      setConfig(c);
      if (c.envios?.length === 1) setEnvioId(c.envios[0].id);
      if (c.pagos?.length === 1) setPagoId(c.pagos[0].id);
    }).catch(() => setError('No pudimos cargar las opciones de pago y envío.'));
  }, [apiBase]);

  const payloadItems = useMemo(() => items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })), [items]);

  useEffect(() => {
    if (!items.length) { setCot(null); return; }
    const t = setTimeout(() => {
      fetch(`${apiBase}/cotizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payloadItems, envioId, pagoId, cupon }),
      }).then((r) => r.json()).then(setCot).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [apiBase, payloadItems, envioId, pagoId, cupon, items.length]);

  const envioSel = config?.envios.find((e) => e.id === envioId);
  const pagoSel = config?.pagos.find((p) => p.id === pagoId);

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const r = await fetch(`${apiBase}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payloadItems, envioId, pagoId, cupon, cliente, direccion: envioSel?.pideDireccion ? dir : null, nota, aceptaTerminos: acepta }),
      });
      const data: any = await r.json();
      if (!r.ok) { setError(data.error || 'No pudimos crear el pedido.'); setEnviando(false); return; }
      clear();
      (globalThis as any).location.href = data.redirectUrl || `${prefix}/pedido/${data.token}`;
    } catch {
      setError('Hubo un problema de conexión. Probá de nuevo.');
      setEnviando(false);
    }
  }

  if (!items.length) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-lg">Tu carrito está vacío.</p>
        <a href={prefix || '/'} className="t-btn">Ver productos</a>
      </div>
    );
  }

  const input = 'w-full rounded-[var(--t-btn-radius)] border border-gray-300 px-3 py-2.5 outline-none focus:border-[var(--t-primary)]';

  return (
    <form onSubmit={confirmar} className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-8">
        {/* Productos */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-gray-900">Tu pedido</h2>
          <ul className="divide-y rounded-[var(--t-radius)] border">
            {items.map((i) => (
              <li key={i.variantId} className="flex gap-3 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {i.imagen ? <img src={tnImgClient(i.imagen)} alt="" className="h-20 w-16 rounded-lg object-cover" /> : <div className="h-20 w-16 rounded-lg bg-gray-100" />}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium">{i.nombre}</p>
                  <p className="text-xs text-gray-500">{[i.talle && `Talle ${i.talle}`, i.color].filter(Boolean).join(' · ')}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded-lg border">
                      <button type="button" className="px-2.5 py-1" onClick={() => setQty(i.variantId, i.qty - 1)} aria-label="Restar">−</button>
                      <span className="w-6 text-center text-sm">{i.qty}</span>
                      <button type="button" className="px-2.5 py-1" onClick={() => setQty(i.variantId, i.qty + 1)} aria-label="Sumar">+</button>
                    </div>
                    <button type="button" onClick={() => remove(i.variantId)} className="text-xs text-gray-500 underline">Quitar</button>
                  </div>
                </div>
                <p className="text-sm font-semibold">{formatPrecio(i.precio * i.qty)}</p>
              </li>
            ))}
          </ul>
          {cot?.errores?.length ? (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{cot.errores.map((e) => <p key={e}>{e}</p>)}</div>
          ) : null}
        </section>

        {/* Datos */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-gray-900">Tus datos</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Nombre y apellido *<input required className={input} value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: (e.target as any).value })} autoComplete="name" /></label>
            <label className="text-sm">WhatsApp / teléfono *<input required type="tel" className={input} value={cliente.telefono} onChange={(e) => setCliente({ ...cliente, telefono: (e.target as any).value })} autoComplete="tel" /></label>
            <label className="text-sm">Email<input type="email" className={input} value={cliente.email} onChange={(e) => setCliente({ ...cliente, email: (e.target as any).value })} autoComplete="email" /></label>
            <label className="text-sm">DNI<input inputMode="numeric" className={input} value={cliente.dni} onChange={(e) => setCliente({ ...cliente, dni: (e.target as any).value })} /></label>
          </div>
        </section>

        {/* Entrega */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-gray-900">Entrega</h2>
          {!config ? <p className="text-sm text-gray-500">Cargando…</p> : config.envios.length === 0 ? (
            <p className="text-sm text-gray-600">Coordinamos la entrega por WhatsApp.</p>
          ) : (
            <div className="space-y-2">
              {config.envios.map((e) => (
                <label key={e.id} className={`flex cursor-pointer items-start gap-3 rounded-[var(--t-radius)] border p-3 ${envioId === e.id ? 'border-[var(--t-primary)]' : ''}`}>
                  <input type="radio" name="envio" className="mt-1" checked={envioId === e.id} onChange={() => setEnvioId(e.id)} />
                  <span className="flex-1">
                    <span className="font-medium">{e.nombre}</span>
                    {e.descripcion && <span className="block text-xs text-gray-500">{e.descripcion}</span>}
                    {e.gratisDesde != null && <span className="block text-xs text-green-700">Gratis desde {formatPrecio(e.gratisDesde)}</span>}
                  </span>
                  <span className="text-sm font-semibold">{e.precio > 0 ? formatPrecio(e.precio) : 'Gratis'}</span>
                </label>
              ))}
            </div>
          )}
          {envioSel?.pideDireccion && (
            <div className="mt-4 grid gap-3 sm:grid-cols-6">
              <label className="text-sm sm:col-span-4">Calle *<input required className={input} value={dir.calle} onChange={(e) => setDir({ ...dir, calle: (e.target as any).value })} autoComplete="address-line1" /></label>
              <label className="text-sm sm:col-span-2">Número *<input required className={input} value={dir.numero} onChange={(e) => setDir({ ...dir, numero: (e.target as any).value })} /></label>
              <label className="text-sm sm:col-span-2">Piso / depto<input className={input} value={dir.piso} onChange={(e) => setDir({ ...dir, piso: (e.target as any).value })} /></label>
              <label className="text-sm sm:col-span-2">Localidad *<input required className={input} value={dir.localidad} onChange={(e) => setDir({ ...dir, localidad: (e.target as any).value })} autoComplete="address-level2" /></label>
              <label className="text-sm sm:col-span-2">Código postal<input className={input} value={dir.cp} onChange={(e) => setDir({ ...dir, cp: (e.target as any).value })} autoComplete="postal-code" /></label>
              <label className="text-sm sm:col-span-6">Provincia<input className={input} value={dir.provincia} onChange={(e) => setDir({ ...dir, provincia: (e.target as any).value })} autoComplete="address-level1" /></label>
            </div>
          )}
        </section>

        {/* Pago */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-gray-900">Pago</h2>
          {!config ? <p className="text-sm text-gray-500">Cargando…</p> : config.pagos.length === 0 ? (
            <p className="text-sm text-red-700">Esta tienda todavía no configuró medios de pago.</p>
          ) : (
            <div className="space-y-2">
              {config.pagos.map((p) => (
                <label key={p.id} className={`flex cursor-pointer items-center gap-3 rounded-[var(--t-radius)] border p-3 ${pagoId === p.id ? 'border-[var(--t-primary)]' : ''}`}>
                  <input type="radio" name="pago" checked={pagoId === p.id} onChange={() => setPagoId(p.id)} />
                  <span className="flex-1 font-medium">{p.nombre}</span>
                  {p.descuentoPct > 0 && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">{p.descuentoPct}% OFF</span>}
                </label>
              ))}
            </div>
          )}
        </section>

        <label className="block text-sm">Nota para la tienda (opcional)
          <textarea className={input} rows={2} value={nota} onChange={(e) => setNota((e.target as any).value)} maxLength={500} />
        </label>
      </div>

      {/* Resumen */}
      <aside className="h-fit space-y-4 rounded-[var(--t-radius)] border p-5 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Resumen</h2>
        {config?.hayCupones && (
          <div>
            <div className="flex gap-2">
              <input className={input} placeholder="Cupón de descuento" value={cuponInput} onChange={(e) => setCuponInput((e.target as any).value.toUpperCase())} aria-label="Cupón de descuento" />
              <button type="button" onClick={() => setCupon(cuponInput.trim())} className="rounded-lg border px-4 text-sm font-semibold">Aplicar</button>
            </div>
            {cupon && cot?.cuponError && <p className="mt-1 text-xs text-red-700">{cot.cuponError}</p>}
            {cupon && cot?.cupon && <p className="mt-1 text-xs text-green-700">Cupón {cot.cupon.codigo} aplicado</p>}
          </div>
        )}
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrecio(cot?.subtotal ?? 0)}</dd></div>
          {!!cot?.descuentoCupon && <div className="flex justify-between text-green-700"><dt>Cupón</dt><dd>−{formatPrecio(cot.descuentoCupon)}</dd></div>}
          {!!cot?.descuentoPago && <div className="flex justify-between text-green-700"><dt>Descuento {pagoSel?.nombre}</dt><dd>−{formatPrecio(cot.descuentoPago)}</dd></div>}
          {envioSel && <div className="flex justify-between"><dt>Envío</dt><dd>{cot?.envioCosto ? formatPrecio(cot.envioCosto) : 'Gratis'}</dd></div>}
          <div className="flex justify-between border-t pt-2 text-lg font-bold"><dt>Total</dt><dd>{formatPrecio(cot?.total ?? 0)}</dd></div>
        </dl>
        <label className="flex items-start gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={acepta} onChange={(e) => setAcepta((e.target as any).checked)} className="mt-0.5" required />
          <span>Acepto los <a href={terminosHref} target="_blank" className="underline">términos y condiciones</a>.</span>
        </label>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={enviando || !pagoId || (!!config?.envios.length && !envioId) || !!cot?.errores?.length}
          className="t-btn w-full"
        >
          {enviando ? 'Procesando…' : pagoSel?.tipo === 'mercadopago' ? 'Pagar con Mercado Pago' : 'Confirmar pedido'}
        </button>
      </aside>
    </form>
  );
}
