'use client';

// Panel "Mi Tienda Web" de la revendedora
import { useCallback, useEffect, useState } from 'react';

type Tab = 'pedidos' | 'diseno' | 'pagos' | 'envios' | 'cupones';

const fmt = (n: number) => `$${Math.round(n || 0).toLocaleString('es-AR')}`;
const val = (e: any) => (e.target as any).value;
const chk = (e: any) => !!(e.target as any).checked;

async function api(path: string, method = 'GET', body?: any) {
  const r = await fetch(`/api/mi-tienda${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const data: any = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || 'Error'), { code: data.code });
  return data;
}

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-500';
const btn = 'rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
const btnSec = 'rounded-lg border border-gray-300 px-3 py-1.5 text-sm';

export default function MiTiendaPage() {
  const [tab, setTab] = useState<Tab>('pedidos');
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [sinSesion, setSinSesion] = useState(false);
  const [toast, setToast] = useState('');

  const cargar = useCallback(async () => {
    try {
      setInfo(await api(''));
    } catch (e: any) {
      if (e.code === 'NO_SESSION') setSinSesion(true);
      else setError(e.message);
    }
  }, []);

  useEffect(() => {
    const q = new URLSearchParams((globalThis as any).location?.search || '');
    const t = q.get('tab') as Tab | null;
    if (t) setTab(t);
    const mp = q.get('mp');
    if (mp === 'ok') setToast('¡Mercado Pago conectado!');
    else if (mp) setToast('No se pudo conectar Mercado Pago. Probá de nuevo.');
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  if (sinSesion) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="mb-4">Para usar tu tienda web tenés que volver a iniciar sesión (actualizamos la seguridad).</p>
        <button
          className={btn}
          onClick={() => {
            (globalThis as any).localStorage?.removeItem('user');
            (globalThis as any).location.href = '/login';
          }}
        >
          Iniciar sesión
        </button>
      </div>
    );
  }
  if (error) return <p className="p-6 text-red-700">{error}</p>;
  if (!info) return <p className="p-6 text-gray-500">Cargando tu tienda…</p>;

  const t = info.tienda;
  const tabs: { id: Tab; label: string }[] = [
    { id: 'pedidos', label: 'Pedidos web' },
    { id: 'diseno', label: 'Diseño y datos' },
    { id: 'pagos', label: 'Cobros' },
    { id: 'envios', label: 'Entregas' },
    { id: 'cupones', label: 'Cupones' },
  ];

  return (
    <div className="mx-auto max-w-4xl p-4 pb-24">
      <div className="mb-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 p-5 text-white">
        <p className="text-sm opacity-90">Mi tienda web</p>
        <h1 className="text-2xl font-bold">{t.nombre}</h1>
        <p className="mt-1 break-all text-sm opacity-90">{info.url}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${t.activa ? 'bg-green-500' : 'bg-white/25'}`}>
            {t.activa ? 'Publicada' : 'Borrador (solo vos la ves)'}
          </span>
          <a href={info.urlApp} target="_blank" className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-pink-700">Ver mi tienda</a>
          <button
            className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold"
            onClick={() => {
              (globalThis as any).navigator?.clipboard?.writeText(info.url);
              setToast('Link copiado');
            }}
          >
            Copiar link
          </button>
          <a
            className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold"
            target="_blank"
            href={`https://wa.me/?text=${encodeURIComponent(`¡Mirá mi tienda online! ${info.url}`)}`}
          >
            Compartir por WhatsApp
          </a>
        </div>
      </div>

      <nav className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4" role="tablist">
        {tabs.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={tab === x.id}
            onClick={() => setTab(x.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${tab === x.id ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {x.label}
          </button>
        ))}
      </nav>

      {tab === 'pedidos' && <Pedidos onToast={setToast} />}
      {tab === 'diseno' && <Diseno info={info} onSaved={(d: any) => { setInfo({ ...info, ...d }); setToast('Guardado'); }} />}
      {tab === 'pagos' && <Pagos onToast={setToast} />}
      {tab === 'envios' && <Envios onToast={setToast} />}
      {tab === 'cupones' && <Cupones onToast={setToast} />}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-lg" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Pedidos web
// ---------------------------------------------------------------------

const ESTADOS: Record<string, { label: string; color: string }> = {
  pendiente_pago: { label: 'Esperando pago', color: 'bg-amber-100 text-amber-800' },
  pagada: { label: 'Pagado · falta enviar a Nadin', color: 'bg-green-100 text-green-800' },
  enviada_nadin: { label: 'En Nadin', color: 'bg-blue-100 text-blue-800' },
  lista: { label: 'Listo para entregar', color: 'bg-purple-100 text-purple-800' },
  entregada: { label: 'Entregado', color: 'bg-gray-100 text-gray-700' },
  cancelada: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

function Pedidos({ onToast }: { onToast: (s: string) => void }) {
  const [ordenes, setOrdenes] = useState<any[] | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [busy, setBusy] = useState('');

  const cargar = useCallback(() => api('/ordenes').then((d) => setOrdenes(d.ordenes)).catch(() => setOrdenes([])), []);
  useEffect(() => { cargar(); }, [cargar]);

  async function accion(id: string, a: string, confirmar?: string) {
    if (confirmar && !(globalThis as any).confirm(confirmar)) return;
    setBusy(id + a);
    try {
      const d = await api(`/ordenes/${id}`, 'PATCH', { accion: a });
      setOrdenes((prev) => (prev || []).map((o) => (o.id === id ? d.orden : o)));
      onToast(a === 'enviar_nadin' ? 'Enviado a Nadin. Lo vas a ver en Mis Pedidos para consolidar.' : 'Actualizado');
    } catch (e: any) {
      onToast(e.message);
    }
    setBusy('');
  }

  if (!ordenes) return <p className="text-gray-500">Cargando…</p>;
  if (!ordenes.length) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-gray-600">
        <p className="font-medium">Todavía no tenés pedidos web.</p>
        <p className="mt-1 text-sm">Completá “Diseño y datos” y “Cobros”, publicá la tienda y compartí tu link.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {ordenes.map((o) => {
        const est = ESTADOS[o.estado] || { label: o.estado, color: 'bg-gray-100' };
        const ganancia = o.total - o.envioCosto - o.totalMayorista;
        return (
          <li key={o.id} className="rounded-xl border bg-white p-4">
            <button className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setAbierta(abierta === o.id ? null : o.id)}>
              <div>
                <p className="font-semibold">#{o.numero} · {o.clienteNombre}</p>
                <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString('es-AR')} · {o.metodoPagoNombre}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${est.color}`}>{est.label}</span>
                {o.arrepentimiento && <span className="ml-1 inline-block rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">Pidió arrepentimiento</span>}
              </div>
              <div className="text-right">
                <p className="font-bold">{fmt(o.total)}</p>
                <p className="text-xs text-green-700">Ganás {fmt(ganancia)}</p>
              </div>
            </button>

            {o.estado === 'pagada' && (
              <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm">
                <p className="mb-2 font-medium text-green-900">Este pedido ya está pago. ¿Lo enviamos a Nadin para asegurar el stock?</p>
                <button className={btn} disabled={!!busy} onClick={() => accion(o.id, 'enviar_nadin')}>Sí, enviar a Nadin</button>
              </div>
            )}

            {abierta === o.id && (
              <div className="mt-3 space-y-3 border-t pt-3 text-sm">
                <ul className="space-y-1">
                  {o.items.map((i: any) => (
                    <li key={i.id} className="flex justify-between gap-2">
                      <span>{i.qty} × {i.nombre} {i.talle && `· ${i.talle}`} {i.color && `· ${i.color}`}</span>
                      <span>{fmt(i.precio * i.qty)}</span>
                    </li>
                  ))}
                </ul>
                <div className="grid gap-1 text-gray-700">
                  <p>Tel: <a className="text-pink-700 underline" href={`https://wa.me/${String(o.clienteTelefono).replace(/\D/g, '')}`} target="_blank">{o.clienteTelefono}</a>{o.clienteEmail && ` · ${o.clienteEmail}`}</p>
                  <p>Entrega: {o.envioNombre}{o.envioCosto ? ` (${fmt(o.envioCosto)})` : ''}</p>
                  {o.direccion?.calle && <p>Dirección: {o.direccion.calle} {o.direccion.numero} {o.direccion.piso}, {o.direccion.localidad} {o.direccion.cp} {o.direccion.provincia}</p>}
                  {o.cuponCodigo && <p>Cupón: {o.cuponCodigo}</p>}
                  {o.descuento > 0 && <p>Descuentos: −{fmt(o.descuento)}</p>}
                  {o.nota && <p>Nota: {o.nota}</p>}
                  <p>Costo Nadin: {fmt(o.totalMayorista)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {o.estado === 'pendiente_pago' && (
                    <button className={btnSec} disabled={!!busy} onClick={() => accion(o.id, 'marcar_pagada', '¿Confirmás que ya recibiste el pago?')}>Ya me pagó</button>
                  )}
                  {['pagada', 'enviada_nadin'].includes(o.estado) && (
                    <button className={btnSec} disabled={!!busy} onClick={() => accion(o.id, 'marcar_lista')}>Listo para entregar</button>
                  )}
                  {['pagada', 'enviada_nadin', 'lista'].includes(o.estado) && (
                    <button className={btnSec} disabled={!!busy} onClick={() => accion(o.id, 'marcar_entregada')}>Entregado</button>
                  )}
                  {!o.pedidoId && !['cancelada', 'entregada'].includes(o.estado) && (
                    <button className={`${btnSec} text-red-700`} disabled={!!busy} onClick={() => accion(o.id, 'cancelar', '¿Cancelar este pedido? Si ya te pagó, tenés que devolverle la plata.')}>Cancelar</button>
                  )}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------
// Diseño y datos
// ---------------------------------------------------------------------

function Diseno({ info, onSaved }: { info: any; onSaved: (d: any) => void }) {
  const [f, setF] = useState<any>({ ...info.tienda, margen: info.tienda.margen ?? '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string) => (e: any) => setF({ ...f, [k]: val(e) });

  async function subir(kind: 'logo' | 'banner', file: any) {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('kind', kind);
    const r = await fetch('/api/mi-tienda/upload', { method: 'POST', body: fd, credentials: 'include' });
    const d: any = await r.json().catch(() => ({}));
    if (!r.ok) return setErr(d.error || 'No se pudo subir');
    setF((prev: any) => ({ ...prev, [kind === 'logo' ? 'logoUrl' : 'bannerUrl']: d.url }));
  }

  async function guardar(extra: any = {}) {
    setSaving(true);
    setErr('');
    try {
      const body = { ...f, ...extra, margen: f.margen === '' ? null : Number(f.margen) };
      delete body.id; delete body.userId; delete body.dominioPropio; delete body.createdAt; delete body.updatedAt;
      const d = await api('', 'PUT', body);
      setF({ ...d.tienda, margen: d.tienda.margen ?? '' });
      onSaved({ tienda: d.tienda, url: d.url, urlApp: `/t/${d.tienda.slug}` });
    } catch (e: any) {
      setErr(e.message);
    }
    setSaving(false);
  }

  const field = ({ label, k, hint, ...rest }: any) => (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      <input className={`${input} mt-1`} value={f[k] ?? ''} onChange={set(k)} {...rest} />
    </label>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">{f.activa ? 'Tu tienda está publicada' : 'Tu tienda está en borrador'}</p>
            <p className="text-xs text-gray-500">Para publicar necesitás al menos un medio de cobro activo.</p>
          </div>
          <button className={f.activa ? btnSec : btn} disabled={saving} onClick={() => guardar({ activa: !f.activa })}>
            {f.activa ? 'Pasar a borrador' : 'Publicar tienda'}
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="font-semibold">Marca</h2>
        {field({ label: "Nombre de tu tienda", k: "nombre", maxLength: 40 })}
        {field({ label: "Frase corta", k: "eslogan", hint: "Ej: Lencería linda para todos los días", maxLength: 120 })}
        <label className="block text-sm">
          <span className="font-medium">Dirección de tu tienda</span>
          <span className="block text-xs text-gray-500">Solo letras, números y guiones.</span>
          <input className={`${input} mt-1`} value={f.slug} onChange={set('slug')} maxLength={30} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="text-sm">
            <p className="font-medium">Logo</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {f.logoUrl && <img src={f.logoUrl} alt="Logo" className="my-2 h-16 w-16 rounded-full object-cover" />}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => subir('logo', (e.target as any).files?.[0])} />
          </div>
          <div className="text-sm">
            <p className="font-medium">Imagen de portada</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {f.bannerUrl && <img src={f.bannerUrl} alt="Portada" className="my-2 h-16 w-full rounded-lg object-cover" />}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => subir('banner', (e.target as any).files?.[0])} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <label className="text-sm"><span className="font-medium">Color principal</span>
            <input type="color" className="mt-1 h-10 w-full rounded" value={f.colorPrimario} onChange={set('colorPrimario')} /></label>
          <label className="text-sm"><span className="font-medium">Color de textos</span>
            <input type="color" className="mt-1 h-10 w-full rounded" value={f.colorSecundario} onChange={set('colorSecundario')} /></label>
          <label className="text-sm"><span className="font-medium">Estilo de letra</span>
            <select className={`${input} mt-1`} value={f.fuente} onChange={set('fuente')}>
              <option value="moderna">Moderna</option>
              <option value="elegante">Elegante</option>
              <option value="clasica">Clásica</option>
            </select></label>
        </div>
        <label className="block text-sm"><span className="font-medium">Sobre tu tienda</span>
          <span className="block text-xs text-gray-500">Contá quién sos y dónde vendés. Ayuda a aparecer en Google.</span>
          <textarea className={`${input} mt-1`} rows={4} value={f.descripcion ?? ''} onChange={set('descripcion')} maxLength={2000} /></label>
      </section>

      <section className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="font-semibold">Precios</h2>
        {field({ label: "Tu % de ganancia", k: "margen", type: "number", min: info.margenMinimo, max: 500, hint: `Si lo dejás vacío usa el de tu perfil (${info.margenUsuaria}%). Ej: 60% = vendés a 1,6 veces el costo.` })}
      </section>

      <section className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="font-semibold">Contacto y ubicación</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {field({ label: "WhatsApp", k: "whatsapp", hint: "Con código de área, ej: 5493415551234", inputMode: "tel" })}
          {field({ label: "Email", k: "email", type: "email" })}
          {field({ label: "Ciudad", k: "ciudad", hint: "Para aparecer en búsquedas locales" })}
          {field({ label: "Provincia", k: "provincia" })}
          {field({ label: "Instagram", k: "instagram", hint: "Solo el usuario" })}
          {field({ label: "Facebook", k: "facebook", hint: "Solo el usuario" })}
          {field({ label: "TikTok", k: "tiktok", hint: "Solo el usuario" })}
        </div>
      </section>

      <details className="rounded-xl border bg-white p-4">
        <summary className="cursor-pointer font-semibold">Avanzado: Google, Meta y Nadin</summary>
        <div className="mt-3 space-y-3">
          {field({ label: "Título para Google", k: "seoTitulo", maxLength: 70, hint: "Hasta 70 caracteres. Vacío = automático." })}
          {field({ label: "Descripción para Google", k: "seoDescripcion", maxLength: 160, hint: "Hasta 160 caracteres." })}
          {field({ label: "Pixel de Meta (ID)", k: "metaPixelId", inputMode: "numeric" })}
          {field({ label: "Google Analytics 4 (G-XXXX)", k: "ga4Id" })}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.mostrarNadin} onChange={(e) => setF({ ...f, mostrarNadin: chk(e) })} /> Mostrar “Productos de Nadin Lencería” al pie</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.envioAutoNadin} onChange={(e) => setF({ ...f, envioAutoNadin: chk(e) })} /> Enviar a Nadin automáticamente cuando un pedido queda pago</label>
        </div>
      </details>

      {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{err}</p>}
      <div className="sticky bottom-20 flex justify-end">
        <button className={`${btn} shadow-lg`} disabled={saving} onClick={() => guardar()}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Cobros
// ---------------------------------------------------------------------

function Pagos({ onToast }: { onToast: (s: string) => void }) {
  const [pagos, setPagos] = useState<any[] | null>(null);
  const [mpOAuth, setMpOAuth] = useState(false);
  const [mpToken, setMpToken] = useState('');
  const cargar = useCallback(() => api('/pagos').then((d) => { setPagos(d.pagos); setMpOAuth(d.mpOAuth); }), []);
  useEffect(() => { cargar().catch(() => setPagos([])); }, [cargar]);

  async function guardar(p: any, cambios: any) {
    try {
      await api('/pagos', 'PUT', { id: p.id, ...cambios });
      await cargar();
      onToast('Guardado');
    } catch (e: any) { onToast(e.message); }
  }
  async function agregar(tipo: string) {
    try { await api('/pagos', 'POST', { tipo, config: tipo === 'link' ? { url: '' } : undefined }); await cargar(); }
    catch (e: any) { onToast(e.message); }
  }
  async function borrar(p: any) {
    if (!(globalThis as any).confirm('¿Quitar este medio de pago?')) return;
    await api(`/pagos?id=${p.id}`, 'DELETE'); await cargar();
  }

  if (!pagos) return <p className="text-gray-500">Cargando…</p>;
  const tiene = (t: string) => pagos.some((p) => p.tipo === t);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Tus clientas te pagan a vos. Cuando un pedido queda pago, lo mandás a Nadin y lo pagás en tu consolidación, como siempre.</p>
      {pagos.map((p) => (
        <PagoCard key={p.id} p={p} onSave={(c: any) => guardar(p, c)} onDelete={() => borrar(p)}>
          {p.tipo === 'mercadopago' && (
            <div className="space-y-2 text-sm">
              {p.config?.conectado ? (
                <p className="text-green-700">Cuenta conectada {p.config.cuenta ? `(${p.config.cuenta})` : ''}. Los pagos se marcan solos.</p>
              ) : mpOAuth ? (
                <a href="/api/mi-tienda/mercadopago/connect" className={`${btn} inline-block`}>Conectar mi Mercado Pago</a>
              ) : (
                <>
                  <p className="text-gray-600">Pegá tu Access Token de producción (Mercado Pago → Tu negocio → Configuración → Credenciales).</p>
                  <input className={input} placeholder="APP_USR-..." value={mpToken} onChange={(e) => setMpToken(val(e))} />
                  <button className={btn} onClick={() => guardar(p, { config: { accessToken: mpToken }, activo: true })}>Conectar</button>
                </>
              )}
            </div>
          )}
        </PagoCard>
      ))}
      <div className="flex flex-wrap gap-2">
        {!tiene('mercadopago') && <button className={btnSec} onClick={() => agregar('mercadopago')}>+ Mercado Pago</button>}
        {!tiene('transferencia') && <button className={btnSec} onClick={() => agregar('transferencia')}>+ Transferencia</button>}
        <button className={btnSec} onClick={() => agregar('link')}>+ Link de pago (Nave, MODO, Ualá…)</button>
        {!tiene('efectivo') && <button className={btnSec} onClick={() => agregar('efectivo')}>+ Efectivo</button>}
      </div>
    </div>
  );
}

function PagoCard({ p, onSave, onDelete, children }: any) {
  const [f, setF] = useState<any>({ nombre: p.nombre, descuentoPct: p.descuentoPct, instrucciones: p.instrucciones || '', config: p.config || {} });
  const setCfg = (k: string) => (e: any) => setF({ ...f, config: { ...f.config, [k]: val(e) } });
  return (
    <div className="space-y-3 rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <input className={`${input} font-semibold`} value={f.nombre} onChange={(e) => setF({ ...f, nombre: val(e) })} aria-label="Nombre que ve la clienta" />
        <label className="flex items-center gap-2 whitespace-nowrap text-sm">
          <input type="checkbox" checked={p.activo} onChange={(e) => onSave({ activo: chk(e) })} /> Activo
        </label>
      </div>
      {children}
      {p.tipo === 'transferencia' && (
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={input} placeholder="Alias" value={f.config.alias || ''} onChange={setCfg('alias')} />
          <input className={input} placeholder="CBU / CVU (22 números)" value={f.config.cbu || ''} onChange={setCfg('cbu')} inputMode="numeric" />
          <input className={input} placeholder="Titular" value={f.config.titular || ''} onChange={setCfg('titular')} />
          <input className={input} placeholder="Banco / billetera" value={f.config.banco || ''} onChange={setCfg('banco')} />
        </div>
      )}
      {p.tipo === 'link' && (
        <input className={input} placeholder="https://… (link de pago de Nave, MODO, Ualá Bis, etc.)" value={f.config.url || ''} onChange={setCfg('url')} />
      )}
      <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
        <label className="text-sm">% de descuento
          <input type="number" min={0} max={50} className={input} value={f.descuentoPct} onChange={(e) => setF({ ...f, descuentoPct: val(e) })} /></label>
        <label className="text-sm">Instrucciones para la clienta
          <input className={input} value={f.instrucciones} onChange={(e) => setF({ ...f, instrucciones: val(e) })} placeholder="Ej: Mandá el comprobante por WhatsApp" /></label>
      </div>
      <div className="flex justify-between">
        <button className="text-sm text-red-700" onClick={onDelete}>Quitar</button>
        <button className={btn} onClick={() => onSave({ nombre: f.nombre, descuentoPct: Number(f.descuentoPct) || 0, instrucciones: f.instrucciones, ...(p.tipo !== 'mercadopago' ? { config: f.config } : {}) })}>Guardar</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Entregas
// ---------------------------------------------------------------------

function Envios({ onToast }: { onToast: (s: string) => void }) {
  const [envios, setEnvios] = useState<any[] | null>(null);
  const [nuevo, setNuevo] = useState({ tipo: 'domicilio', nombre: '', precio: '', gratisDesde: '', descripcion: '' });
  const cargar = useCallback(() => api('/envios').then((d) => setEnvios(d.envios)), []);
  useEffect(() => { cargar().catch(() => setEnvios([])); }, [cargar]);

  async function crear() {
    try {
      await api('/envios', 'POST', { ...nuevo, precio: Number(nuevo.precio) || 0, gratisDesde: nuevo.gratisDesde === '' ? null : Number(nuevo.gratisDesde) });
      setNuevo({ tipo: 'domicilio', nombre: '', precio: '', gratisDesde: '', descripcion: '' });
      await cargar(); onToast('Agregado');
    } catch (e: any) { onToast(e.message); }
  }

  if (!envios) return <p className="text-gray-500">Cargando…</p>;
  return (
    <div className="space-y-4">
      {envios.map((e) => (
        <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-4 text-sm">
          <div>
            <p className="font-semibold">{e.nombre}</p>
            <p className="text-gray-600">{e.precio ? fmt(e.precio) : 'Gratis'}{e.gratisDesde != null ? ` · gratis desde ${fmt(e.gratisDesde)}` : ''}{e.pideDireccion ? ' · pide dirección' : ''}</p>
            {e.descripcion && <p className="text-xs text-gray-500">{e.descripcion}</p>}
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1"><input type="checkbox" checked={e.activo} onChange={async (ev) => { await api('/envios', 'PUT', { id: e.id, activo: chk(ev) }); cargar(); }} /> Activo</label>
            <button className="text-red-700" onClick={async () => { if ((globalThis as any).confirm('¿Quitar?')) { await api(`/envios?id=${e.id}`, 'DELETE'); cargar(); } }}>Quitar</button>
          </div>
        </div>
      ))}
      <div className="space-y-2 rounded-xl border border-dashed bg-white p-4">
        <p className="font-semibold">Agregar forma de entrega</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <select className={input} value={nuevo.tipo} onChange={(e) => setNuevo({ ...nuevo, tipo: val(e) })}>
            <option value="domicilio">Envío a domicilio (moto, cadete, propio)</option>
            <option value="correo">Correo / transporte</option>
            <option value="retiro">Retiro en un punto</option>
          </select>
          <input className={input} placeholder='Nombre, ej: "Moto en Rosario"' value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: val(e) })} />
          <input className={input} type="number" placeholder="Precio ($)" value={nuevo.precio} onChange={(e) => setNuevo({ ...nuevo, precio: val(e) })} />
          <input className={input} type="number" placeholder="Gratis desde ($, opcional)" value={nuevo.gratisDesde} onChange={(e) => setNuevo({ ...nuevo, gratisDesde: val(e) })} />
          <input className={`${input} sm:col-span-2`} placeholder="Detalle, ej: Llega en 24/48 hs" value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: val(e) })} />
        </div>
        <button className={btn} onClick={crear}>Agregar</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Cupones
// ---------------------------------------------------------------------

function Cupones({ onToast }: { onToast: (s: string) => void }) {
  const [cupones, setCupones] = useState<any[] | null>(null);
  const [n, setN] = useState({ codigo: '', tipo: 'porcentaje', valor: '', minimo: '', usosMax: '', venceAt: '' });
  const cargar = useCallback(() => api('/cupones').then((d) => setCupones(d.cupones)), []);
  useEffect(() => { cargar().catch(() => setCupones([])); }, [cargar]);

  async function crear() {
    try {
      await api('/cupones', 'POST', { ...n, valor: Number(n.valor) || 0, minimo: n.minimo ? Number(n.minimo) : null, usosMax: n.usosMax ? Number(n.usosMax) : null, venceAt: n.venceAt || null });
      setN({ codigo: '', tipo: 'porcentaje', valor: '', minimo: '', usosMax: '', venceAt: '' });
      await cargar(); onToast('Cupón creado');
    } catch (e: any) { onToast(e.message); }
  }

  if (!cupones) return <p className="text-gray-500">Cargando…</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">El descuento sale de tu ganancia: Nadin te cobra siempre el mismo costo.</p>
      {cupones.map((c) => (
        <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-4 text-sm">
          <div>
            <p className="font-mono font-bold">{c.codigo}</p>
            <p className="text-gray-600">
              {c.tipo === 'porcentaje' ? `${c.valor}% off` : c.tipo === 'monto' ? `${fmt(c.valor)} off` : 'Envío gratis'}
              {c.minimo ? ` · desde ${fmt(c.minimo)}` : ''} · usado {c.usos}{c.usosMax ? `/${c.usosMax}` : ''}
              {c.venceAt ? ` · vence ${new Date(c.venceAt).toLocaleDateString('es-AR')}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1"><input type="checkbox" checked={c.activo} onChange={async (e) => { await api('/cupones', 'PUT', { id: c.id, activo: chk(e) }); cargar(); }} /> Activo</label>
            <button className="text-red-700" onClick={async () => { if ((globalThis as any).confirm('¿Borrar cupón?')) { await api(`/cupones?id=${c.id}`, 'DELETE'); cargar(); } }}>Borrar</button>
          </div>
        </div>
      ))}
      <div className="space-y-2 rounded-xl border border-dashed bg-white p-4">
        <p className="font-semibold">Nuevo cupón</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <input className={`${input} uppercase`} placeholder="CÓDIGO" value={n.codigo} onChange={(e) => setN({ ...n, codigo: String(val(e)).toUpperCase() })} />
          <select className={input} value={n.tipo} onChange={(e) => setN({ ...n, tipo: val(e) })}>
            <option value="porcentaje">% de descuento</option>
            <option value="monto">$ de descuento</option>
            <option value="envio_gratis">Envío gratis</option>
          </select>
          {n.tipo !== 'envio_gratis' && <input className={input} type="number" placeholder={n.tipo === 'porcentaje' ? '% (ej 10)' : '$ (ej 2000)'} value={n.valor} onChange={(e) => setN({ ...n, valor: val(e) })} />}
          <input className={input} type="number" placeholder="Compra mínima (opcional)" value={n.minimo} onChange={(e) => setN({ ...n, minimo: val(e) })} />
          <input className={input} type="number" placeholder="Usos máximos (opcional)" value={n.usosMax} onChange={(e) => setN({ ...n, usosMax: val(e) })} />
          <label className="text-xs text-gray-500">Vence (opcional)<input className={input} type="date" value={n.venceAt} onChange={(e) => setN({ ...n, venceAt: val(e) })} /></label>
        </div>
        <button className={btn} onClick={crear}>Crear cupón</button>
      </div>
    </div>
  );
}
