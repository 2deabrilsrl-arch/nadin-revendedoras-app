'use client';

// Panel "Mi Tienda Web" de la revendedora
import { useCallback, useEffect, useState } from 'react';
import { PLANTILLAS, ICONOS, DISENO_DEFAULT, SECCIONES_INFO, seccionNueva } from '@/lib/tienda-diseno';
import { reducirImagen } from '@/components/tienda/reducirImagen';
import { tnImgClient } from '@/components/tienda/img';

type Tab = 'pedidos' | 'portada' | 'productos' | 'diseno' | 'pagos' | 'envios' | 'cupones';

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
    { id: 'portada', label: 'Diseño' },
    { id: 'productos', label: 'Productos' },
    { id: 'diseno', label: 'Marca y datos' },
    { id: 'pagos', label: 'Cobros' },
    { id: 'envios', label: 'Entregas' },
    { id: 'cupones', label: 'Cupones' },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-4xl bg-gray-50/60 p-4 pb-24">
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
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${tab === x.id ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 ring-1 ring-black/5 hover:text-gray-900'}`}
          >
            {x.label}
          </button>
        ))}
      </nav>

      {tab === 'pedidos' && <Pedidos onToast={setToast} tienda={t} onTienda={(nt: any) => setInfo({ ...info, tienda: { ...t, ...nt } })} />}
      {tab === 'productos' && <ProductosTienda onToast={setToast} />}
      {tab === 'portada' && <Portada info={info} onSaved={(d: any) => { setInfo({ ...info, ...d }); setToast('Diseño guardado'); }} onToast={setToast} />}
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

function Pedidos({ onToast, tienda, onTienda }: { onToast: (s: string) => void; tienda: any; onTienda: (t: any) => void }) {
  const [ordenes, setOrdenes] = useState<any[] | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [busy, setBusy] = useState('');

  const cargar = useCallback(() => api('/ordenes').then((d) => setOrdenes(d.ordenes)).catch(() => setOrdenes([])), []);
  useEffect(() => { cargar(); }, [cargar]);

  async function accion(id: string, a: string, confirmar?: string, extra: any = {}) {
    if (confirmar && !(globalThis as any).confirm(confirmar)) return;
    setBusy(id + a);
    try {
      const d = await api(`/ordenes/${id}`, 'PATCH', { accion: a, ...extra });
      setOrdenes((prev) => (prev || []).map((o) => (o.id === id ? d.orden : o)));
      if (a === 'enviar_nadin' && extra.consolidar) {
        onTienda({ nadinFormaPago: extra.formaPago, nadinTipoEnvio: extra.tipoEnvio, nadinTransporte: extra.transporteNombre || null });
      }
      onToast(a === 'enviar_nadin' ? (extra.consolidar ? '¡Listo! Nadin ya lo tiene para armar.' : 'Enviado. Consolidalo desde "Consolidar" cuando quieras.') : 'Actualizado');
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
          <li key={o.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
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
              <EnviarNadin tienda={tienda} busy={!!busy} onEnviar={(extra: any) => accion(o.id, 'enviar_nadin', undefined, extra)} />
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
// Enviar a Nadin = pedido + consolidación en un solo paso
// ---------------------------------------------------------------------

const PAGOS_NADIN: Record<string, string> = { transferencia: 'Transferencia', mercadopago: 'Mercado Pago', efectivo: 'Efectivo', tarjeta: 'Tarjeta' };
const ENTREGAS_NADIN: Record<string, string> = { retiro: 'Retiro en el local', envio: 'Envío por transporte' };

function EnviarNadin({ tienda, busy, onEnviar }: { tienda: any; busy: boolean; onEnviar: (x: any) => void }) {
  const guardado = !!(tienda.nadinFormaPago && tienda.nadinTipoEnvio);
  const [editar, setEditar] = useState(!guardado);
  const [formaPago, setFormaPago] = useState(tienda.nadinFormaPago || '');
  const [tipoEnvio, setTipoEnvio] = useState(tienda.nadinTipoEnvio || '');
  const [transporte, setTransporte] = useState(tienda.nadinTransporte || '');
  const [despues, setDespues] = useState(false);
  const listo = despues || (formaPago && tipoEnvio && (tipoEnvio !== 'envio' || transporte.trim()));

  return (
    <div className="mt-3 rounded-xl bg-emerald-50 p-4 text-sm ring-1 ring-emerald-100">
      <p className="font-semibold text-emerald-900">Pedido pago 🎉 ¿Lo mandamos a Nadin para asegurar el stock?</p>
      {!despues && (!editar ? (
        <p className="mt-1 text-emerald-800">
          Le pagás con <strong>{PAGOS_NADIN[formaPago] || formaPago}</strong> · {ENTREGAS_NADIN[tipoEnvio] || tipoEnvio}{tipoEnvio === 'envio' && transporte ? ` (${transporte})` : ''}.{' '}
          <button type="button" className="underline" onClick={() => setEditar(true)}>Cambiar</button>
        </p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-emerald-900">¿Cómo le pagás a Nadin?
            <select className={`${input} mt-1 bg-white`} value={formaPago} onChange={(e) => setFormaPago(val(e))}>
              <option value="">Elegí…</option>
              {Object.entries(PAGOS_NADIN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="text-xs text-emerald-900">¿Cómo lo recibís?
            <select className={`${input} mt-1 bg-white`} value={tipoEnvio} onChange={(e) => setTipoEnvio(val(e))}>
              <option value="">Elegí…</option>
              {Object.entries(ENTREGAS_NADIN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          {tipoEnvio === 'envio' && (
            <label className="text-xs text-emerald-900 sm:col-span-2">Transporte
              <input className={`${input} mt-1 bg-white`} value={transporte} onChange={(e) => setTransporte(val(e))} placeholder="Ej: Vía Cargo, Andreani…" />
            </label>
          )}
          <p className="text-xs text-emerald-700 sm:col-span-2">Lo recordamos para la próxima: vas a enviarlo con un solo toque.</p>
        </div>
      ))}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button className={btn} disabled={busy || !listo}
          onClick={() => onEnviar(despues ? { consolidar: false } : { consolidar: true, formaPago, tipoEnvio, transporteNombre: tipoEnvio === 'envio' ? transporte : null })}>
          {despues ? 'Enviar sin consolidar' : 'Enviar a Nadin'}
        </button>
        <label className="flex items-center gap-1.5 text-xs text-emerald-800">
          <input type="checkbox" checked={despues} onChange={(e) => setDespues(chk(e))} /> Prefiero juntarlo con otros pedidos y consolidar después
        </label>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Diseño modular: plantilla + barra de anuncio + secciones (tipo Tiendanube)
// ---------------------------------------------------------------------

function MiniPlantilla({ id }: { id: string }) {
  // Vista en miniatura de cada plantilla
  const header = id === 'urbana' || id === 'aurora' ? 'justify-start' : 'justify-center';
  const bg = id === 'atelier' ? 'bg-pink-50' : id === 'aurora' ? 'bg-orange-50/60' : 'bg-white';
  const hero = id === 'urbana' ? 'bg-gray-900' : 'bg-gray-200';
  const r = id === 'atelier' ? 'rounded-lg' : id === 'aurora' ? 'rounded' : 'rounded-none';
  const titulo = id === 'urbana' ? 'font-black uppercase' : id === 'atelier' || id === 'aurora' ? 'font-serif italic' : 'uppercase tracking-[0.2em]';
  return (
    <span className={`block overflow-hidden rounded-lg ring-1 ring-black/5 ${bg}`} aria-hidden="true">
      <span className={`flex ${header} border-b border-black/5 px-2 py-1.5`}><span className="h-1.5 w-10 rounded bg-gray-700" /></span>
      <span className={`m-1.5 flex h-10 items-center justify-center ${r} ${hero}`}><span className={`text-[7px] ${titulo} ${id === 'urbana' ? 'text-white' : 'text-gray-600'}`}>Colección</span></span>
      <span className="grid grid-cols-4 gap-1 px-1.5 pb-2">
        {[0, 1, 2, 3].map((k) => (
          <span key={k} className={`${id === 'atelier' || id === 'aurora' ? 'bg-white p-0.5 ring-1 ring-black/5' : ''} ${r}`}>
            <span className={`block h-6 ${r} ${id === 'urbana' ? 'bg-pink-100' : 'bg-gray-200'}`} />
          </span>
        ))}
      </span>
    </span>
  );
}

function Portada({ info, onSaved, onToast }: { info: any; onSaved: (d: any) => void; onToast: (s: string) => void }) {
  const [d, setD] = useState<any>(() => JSON.parse(JSON.stringify(info.tienda.diseno || DISENO_DEFAULT)));
  const [abierta, setAbierta] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subiendo, setSubiendo] = useState('');
  const [cats, setCats] = useState<{ nombre: string; path: string }[]>([]);

  useEffect(() => {
    fetch(`/api/tienda/${info.tienda.slug}/categorias`).then((r) => r.json()).then((x: any) => setCats(x.categorias || [])).catch(() => {});
  }, [info.tienda.slug]);

  const upd = (id: string, cambios: any) => setD((x: any) => ({ ...x, secciones: x.secciones.map((s: any) => (s.id === id ? { ...s, ...cambios } : s)) }));
  const mover = (i: number, dir: number) => setD((x: any) => {
    const arr = [...x.secciones]; const j = i + dir;
    if (j < 0 || j >= arr.length) return x;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return { ...x, secciones: arr };
  });
  const quitar = (id: string) => { if ((globalThis as any).confirm('¿Quitar esta sección?')) setD((x: any) => ({ ...x, secciones: x.secciones.filter((s: any) => s.id !== id) })); };
  const agregar = (tipo: any) => {
    const s = seccionNueva(tipo);
    setD((x: any) => ({ ...x, secciones: [...x.secciones, s] }));
    setAbierta(s.id);
    setAgregando(false);
  };

  async function subir(file: any, onUrl: (u: string) => void, key: string) {
    if (!file) return;
    setSubiendo(key);
    const fd = new FormData();
    fd.append('file', await reducirImagen(file, 1920));
    fd.append('kind', 'slide');
    const r = await fetch('/api/mi-tienda/upload', { method: 'POST', body: fd, credentials: 'include' });
    const res: any = await r.json().catch(() => ({}));
    setSubiendo('');
    if (!r.ok) return onToast(res.error || 'No se pudo subir la imagen');
    onUrl(res.url);
  }

  async function guardar() {
    setSaving(true);
    try {
      const r = await api('', 'PUT', { diseno: d });
      setD(r.tienda.diseno);
      onSaved({ tienda: r.tienda, url: r.url });
    } catch (e: any) { onToast(e.message); }
    setSaving(false);
  }

  const card = 'space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5';
  const info2 = (tipo: string) => SECCIONES_INFO.find((x) => x.tipo === tipo);
  const ImgInput = ({ label, onUrl, k }: { label: string; onUrl: (u: string) => void; k: string }) => (
    <label className={`${btnSec} inline-flex cursor-pointer items-center gap-2 bg-white`}>
      {subiendo === k ? 'Subiendo…' : label}
      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => subir((e.target as any).files?.[0], onUrl, k)} />
    </label>
  );

  function resumen(s: any): string {
    switch (s.tipo) {
      case 'carrusel': return `${s.slides.length} imagen${s.slides.length === 1 ? '' : 'es'}`;
      case 'beneficios': return s.items.map((b: any) => b.titulo).join(' · ');
      case 'productos': return `${s.titulo || 'Sin título'} · ${({ destacados: 'destacados', mas_vendidos: 'más vendidos', categoria: 'de una categoría', todos: 'todos', elegidos: `${(s.productos || []).length} elegidos` } as any)[s.fuente]} · ${s.formato}`;
      case 'banners': return `${s.items.length} banner${s.items.length === 1 ? '' : 's'}`;
      default: return s.titulo || '';
    }
  }

  function editor(s: any) {
    switch (s.tipo) {
      case 'carrusel':
        return (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Ideal: 1920×730 px (compu) y 1080×1350 px (celular). Hasta 6 imágenes.</p>
            {s.slides.map((sl: any, k: number) => (
              <div key={k} className="space-y-2 rounded-xl bg-gray-50 p-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sl.imagen} alt="" className="h-14 w-28 rounded object-cover" />
                  <ImgInput label="Cambiar" k={`${s.id}-${k}`} onUrl={(u) => upd(s.id, { slides: s.slides.map((x: any, j: number) => (j === k ? { ...x, imagen: u } : x)) })} />
                  <ImgInput label={sl.imagenMobile ? 'Cambiar versión celular' : '+ Versión celular'} k={`${s.id}-m${k}`} onUrl={(u) => upd(s.id, { slides: s.slides.map((x: any, j: number) => (j === k ? { ...x, imagenMobile: u } : x)) })} />
                  <button type="button" className="ml-auto text-xs text-red-600" onClick={() => upd(s.id, { slides: s.slides.filter((_: any, j: number) => j !== k) })}>Quitar</button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(['titulo', 'boton', 'texto', 'link'] as const).map((f) => (
                    <input key={f} className={input} placeholder={({ titulo: 'Título (opcional)', boton: 'Texto del botón', texto: 'Bajada', link: 'Link: /categoria/... o https://' } as any)[f]}
                      value={sl[f] || ''} onChange={(e) => upd(s.id, { slides: s.slides.map((x: any, j: number) => (j === k ? { ...x, [f]: val(e) } : x)) })} />
                  ))}
                </div>
              </div>
            ))}
            {s.slides.length < 6 && <ImgInput label="+ Agregar imagen" k={`${s.id}-new`} onUrl={(u) => upd(s.id, { slides: [...s.slides, { imagen: u }] })} />}
          </div>
        );
      case 'beneficios':
        return (
          <div className="space-y-2">
            {s.items.map((b: any, k: number) => (
              <div key={k} className="grid gap-2 sm:grid-cols-[130px_1fr_1.4fr_auto]">
                <select className={input} value={b.icono} onChange={(e) => upd(s.id, { items: s.items.map((x: any, j: number) => (j === k ? { ...x, icono: val(e) } : x)) })}>
                  {ICONOS.map((ic) => <option key={ic} value={ic}>{({ envio: '🚚 Envío', pago: '💳 Pago', cambio: '🔁 Cambios', whatsapp: '💬 WhatsApp', seguro: '🛡️ Seguro', regalo: '🎁 Regalo' } as any)[ic]}</option>)}
                </select>
                <input className={input} placeholder="Título" value={b.titulo} onChange={(e) => upd(s.id, { items: s.items.map((x: any, j: number) => (j === k ? { ...x, titulo: val(e) } : x)) })} />
                <input className={input} placeholder="Detalle" value={b.texto} onChange={(e) => upd(s.id, { items: s.items.map((x: any, j: number) => (j === k ? { ...x, texto: val(e) } : x)) })} />
                <button type="button" className="text-xs text-red-600" onClick={() => upd(s.id, { items: s.items.filter((_: any, j: number) => j !== k) })}>Quitar</button>
              </div>
            ))}
            {s.items.length < 4 && <button type="button" className={btnSec} onClick={() => upd(s.id, { items: [...s.items, { icono: 'regalo', titulo: '', texto: '' }] })}>+ Beneficio</button>}
          </div>
        );
      case 'categorias':
        return (
          <div className="grid gap-2 sm:grid-cols-3">
            <input className={input} placeholder="Título" value={s.titulo} onChange={(e) => upd(s.id, { titulo: val(e) })} />
            <select className={input} value={s.formato} onChange={(e) => upd(s.id, { formato: val(e) })}>
              <option value="tarjetas">Tarjetas con foto</option>
              <option value="circulos">Círculos</option>
            </select>
            <select className={input} value={s.cantidad} onChange={(e) => upd(s.id, { cantidad: Number(val(e)) })}>
              {[3, 4, 6, 8].map((n) => <option key={n} value={n}>Mostrar {n}</option>)}
            </select>
          </div>
        );
      case 'productos':
        return (
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={input} placeholder="Título" value={s.titulo} onChange={(e) => upd(s.id, { titulo: val(e) })} />
            <select className={input} value={s.fuente} onChange={(e) => upd(s.id, { fuente: val(e) })}>
              <option value="destacados">Mis destacados</option>
              <option value="mas_vendidos">Más vendidos</option>
              <option value="categoria">De una categoría</option>
              <option value="todos">Todos (con páginas)</option>
              <option value="elegidos">Elegidos por mí (a mano)</option>
            </select>
            {s.fuente === 'elegidos' && (
              <div className="sm:col-span-2">
                <SelectorProductos ids={s.productos || []} onChange={(ids) => upd(s.id, { productos: ids })} />
              </div>
            )}
            {s.fuente === 'categoria' && (
              <select className={`${input} sm:col-span-2`} value={s.categoria} onChange={(e) => upd(s.id, { categoria: val(e) })}>
                <option value="">Elegí la categoría…</option>
                {cats.map((c) => <option key={c.path} value={c.path}>{c.nombre}</option>)}
              </select>
            )}
            {s.fuente !== 'todos' && (
              <>
                <select className={input} value={s.formato} onChange={(e) => upd(s.id, { formato: val(e) })}>
                  <option value="grilla">Grilla</option>
                  <option value="slider">Carrusel deslizable</option>
                </select>
                {s.fuente !== 'elegidos' && (
                  <select className={input} value={s.cantidad} onChange={(e) => upd(s.id, { cantidad: Number(val(e)) })}>
                    {[4, 8, 12, 16].map((n) => <option key={n} value={n}>{n} productos</option>)}
                  </select>
                )}
              </>
            )}
            {s.fuente === 'destacados' && <p className="text-xs text-gray-500 sm:col-span-2">Los destacados se eligen en la pestaña “Productos”. Si no marcaste ninguno, esta sección no se muestra.</p>}
          </div>
        );
      case 'banners':
        return (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">1 banner = ancho completo · 2 o 3 = lado a lado.</p>
            {s.items.map((b: any, k: number) => (
              <div key={k} className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.imagen} alt="" className="h-12 w-16 rounded object-cover" />
                <input className={`${input} w-40 flex-1`} placeholder="Título" value={b.titulo || ''} onChange={(e) => upd(s.id, { items: s.items.map((x: any, j: number) => (j === k ? { ...x, titulo: val(e) } : x)) })} />
                <input className={`${input} w-40 flex-1`} placeholder="Link" value={b.link || ''} onChange={(e) => upd(s.id, { items: s.items.map((x: any, j: number) => (j === k ? { ...x, link: val(e) } : x)) })} />
                <button type="button" className="text-xs text-red-600" onClick={() => upd(s.id, { items: s.items.filter((_: any, j: number) => j !== k) })}>Quitar</button>
              </div>
            ))}
            {s.items.length < 3 && <ImgInput label="+ Agregar banner" k={`${s.id}-new`} onUrl={(u) => upd(s.id, { items: [...s.items, { imagen: u }] })} />}
          </div>
        );
      case 'imagen_texto':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {s.imagen && <img src={s.imagen} alt="" className="h-14 w-14 rounded object-cover" />}
              <ImgInput label={s.imagen ? 'Cambiar imagen' : '+ Imagen'} k={`${s.id}-img`} onUrl={(u) => upd(s.id, { imagen: u })} />
              <select className={`${input} w-auto`} value={s.lado} onChange={(e) => upd(s.id, { lado: val(e) })}>
                <option value="izq">Imagen a la izquierda</option>
                <option value="der">Imagen a la derecha</option>
              </select>
            </div>
            <input className={input} placeholder="Título" value={s.titulo} onChange={(e) => upd(s.id, { titulo: val(e) })} />
            <textarea className={input} rows={3} placeholder="Texto" value={s.texto} onChange={(e) => upd(s.id, { texto: val(e) })} />
            <div className="grid gap-2 sm:grid-cols-2">
              <input className={input} placeholder="Botón" value={s.boton} onChange={(e) => upd(s.id, { boton: val(e) })} />
              <input className={input} placeholder="Link del botón" value={s.link} onChange={(e) => upd(s.id, { link: val(e) })} />
            </div>
          </div>
        );
      case 'texto':
        return (
          <div className="space-y-2">
            <input className={input} placeholder="Título (vacío = “Sobre tu tienda”)" value={s.titulo} onChange={(e) => upd(s.id, { titulo: val(e) })} />
            <textarea className={input} rows={4} placeholder="Texto (vacío = usa “Sobre tu tienda” de Marca y datos)" value={s.texto} onChange={(e) => upd(s.id, { texto: val(e) })} />
          </div>
        );
      case 'video':
        return (
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={input} placeholder="Título" value={s.titulo} onChange={(e) => upd(s.id, { titulo: val(e) })} />
            <input className={input} placeholder="Link de YouTube" value={s.url} onChange={(e) => upd(s.id, { url: val(e) })} />
          </div>
        );
      case 'redes':
        return (
          <div className="space-y-2">
            <input className={input} placeholder="Título" value={s.titulo} onChange={(e) => upd(s.id, { titulo: val(e) })} />
            <input className={input} placeholder="Texto" value={s.texto} onChange={(e) => upd(s.id, { texto: val(e) })} />
            <p className="text-xs text-gray-500">Usa tu Instagram y WhatsApp de “Marca y datos”.</p>
          </div>
        );
    }
    return null;
  }

  return (
    <div className="space-y-5">
      <section className={card}>
        <div>
          <h2 className="font-semibold">Plantilla</h2>
          <p className="text-xs text-gray-500">Define tipografías, menú, tarjetas y botones. Tus colores, logo y secciones se mantienen.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {PLANTILLAS.map((p) => (
            <button key={p.id} type="button" onClick={() => setD({ ...d, plantilla: p.id })}
              className={`rounded-xl border p-2.5 text-left transition ${d.plantilla === p.id ? 'border-pink-500 ring-2 ring-pink-200' : 'border-gray-200 hover:border-gray-300'}`}>
              <MiniPlantilla id={p.id} />
              <span className="mt-2 block text-sm font-semibold">{p.nombre}</span>
              <span className="block text-[11px] leading-snug text-gray-500">{p.detalle}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={card}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Barra de anuncio</h2>
            <p className="text-xs text-gray-500">Una línea arriba de todo. Ej: “Envío gratis desde $40.000”.</p>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!d.anuncio.activo} onChange={(e) => setD({ ...d, anuncio: { ...d.anuncio, activo: chk(e) } })} /> Mostrar</label>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={input} maxLength={120} placeholder="Texto del anuncio" value={d.anuncio.texto} onChange={(e) => setD({ ...d, anuncio: { ...d.anuncio, texto: val(e) } })} />
          <input className={input} placeholder="Link opcional" value={d.anuncio.link} onChange={(e) => setD({ ...d, anuncio: { ...d.anuncio, link: val(e) } })} />
        </div>
      </section>

      <section className={card}>
        <div>
          <h2 className="font-semibold">Secciones de la página de inicio</h2>
          <p className="text-xs text-gray-500">Ordenalas como quieras, ocultalas o sumá nuevas. Tocá una para editarla.</p>
        </div>
        <ul className="space-y-2">
          {d.secciones.map((s: any, i: number) => {
            const meta = info2(s.tipo);
            return (
              <li key={s.id} className={`rounded-xl border ${abierta === s.id ? 'border-pink-300' : 'border-gray-200'} ${s.visible ? '' : 'opacity-60'}`}>
                <div className="flex items-center gap-2 p-3">
                  <span className="text-lg" aria-hidden="true">{meta?.emoji}</span>
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setAbierta(abierta === s.id ? null : s.id)}>
                    <span className="block text-sm font-medium">{meta?.nombre}</span>
                    <span className="block truncate text-xs text-gray-500">{resumen(s) || meta?.detalle}</span>
                  </button>
                  <button type="button" className="rounded p-1.5 text-gray-500 disabled:opacity-25" disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Subir">↑</button>
                  <button type="button" className="rounded p-1.5 text-gray-500 disabled:opacity-25" disabled={i === d.secciones.length - 1} onClick={() => mover(i, 1)} aria-label="Bajar">↓</button>
                  <button type="button" className="rounded px-2 py-1 text-xs text-gray-600 ring-1 ring-gray-200" onClick={() => upd(s.id, { visible: !s.visible })}>{s.visible ? 'Ocultar' : 'Mostrar'}</button>
                </div>
                {abierta === s.id && (
                  <div className="space-y-3 border-t border-gray-100 p-3">
                    {editor(s)}
                    <button type="button" className="text-xs text-red-600" onClick={() => quitar(s.id)}>Quitar sección</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {agregando ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {SECCIONES_INFO.map((x) => (
              <button key={x.tipo} type="button" onClick={() => agregar(x.tipo)} className="rounded-xl border border-gray-200 p-3 text-left hover:border-pink-300">
                <span className="text-lg">{x.emoji}</span>
                <span className="block text-sm font-medium">{x.nombre}</span>
                <span className="block text-xs text-gray-500">{x.detalle}</span>
              </button>
            ))}
            <button type="button" className="text-sm text-gray-500" onClick={() => setAgregando(false)}>Cancelar</button>
          </div>
        ) : (
          <button type="button" className={btnSec} onClick={() => setAgregando(true)}>+ Agregar sección</button>
        )}
      </section>

      <div className="sticky bottom-20 flex justify-end gap-2">
        <a href={info.urlApp} target="_blank" className={`${btnSec} bg-white shadow`}>Ver cómo queda</a>
        <button className={`${btn} shadow-lg`} disabled={saving || !!subiendo} onClick={guardar}>{saving ? 'Guardando…' : 'Guardar diseño'}</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Productos: destacar y ocultar
// ---------------------------------------------------------------------

function ProductosTienda({ onToast }: { onToast: (s: string) => void }) {
  const [q, setQ] = useState('');
  const [lista, setLista] = useState<any[] | null>(null);
  const [ocultos, setOcultos] = useState(0);

  const cargar = useCallback((query: string) => {
    api(`/productos${query ? `?q=${encodeURIComponent(query)}` : ''}`).then((d) => { setLista(d.productos); setOcultos(d.ocultos); }).catch((e) => onToast(e.message));
  }, [onToast]);
  useEffect(() => { cargar(''); }, [cargar]);

  async function marcar(p: any, cambios: any) {
    try {
      await api('/productos', 'PUT', { productId: p.id, ...cambios });
      if (cambios.oculto) { setLista((l) => (l || []).filter((x) => x.id !== p.id)); setOcultos((n) => n + 1); onToast('Producto oculto en tu tienda'); }
      else setLista((l) => (l || []).map((x) => (x.id === p.id ? { ...x, ...cambios } : x)));
    } catch (e: any) { onToast(e.message); }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); cargar(q); }} className="flex gap-2">
        <input className={input} placeholder="Buscá por nombre, marca o código" value={q} onChange={(e) => setQ(val(e))} />
        <button className={btn}>Buscar</button>
      </form>
      <p className="text-xs text-gray-500">
        {q ? 'Resultados de la búsqueda.' : 'Tus destacados (aparecen en la sección “Destacados”). Buscá productos para destacar u ocultar.'}
        {ocultos > 0 && ` Tenés ${ocultos} producto${ocultos === 1 ? '' : 's'} oculto${ocultos === 1 ? '' : 's'}.`}
      </p>
      {!lista ? <p className="text-gray-500">Cargando…</p> : lista.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500 ring-1 ring-black/5">{q ? 'No encontramos productos.' : 'Todavía no destacaste productos.'}</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          {lista.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.image ? <img src={p.image} alt="" className="h-14 w-11 rounded object-cover" /> : <div className="h-14 w-11 rounded bg-gray-100" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.nombre}</p>
                <p className="text-xs text-gray-500">{fmt(p.precio)}{!p.disponible && ' · sin stock'}</p>
              </div>
              <button type="button" onClick={() => marcar(p, { destacado: !p.destacado })}
                className={`rounded-full px-3 py-1 text-xs font-medium ${p.destacado ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                {p.destacado ? '★ Destacado' : '☆ Destacar'}
              </button>
              <button type="button" onClick={() => marcar(p, { oculto: true })} className="text-xs text-gray-500 underline">Ocultar</button>
            </li>
          ))}
        </ul>
      )}
    </div>
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
    fd.append('file', await reducirImagen(file, kind === 'logo' ? 600 : 1920));
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
      delete body.id; delete body.diseno; delete body.userId; delete body.dominioPropio; delete body.createdAt; delete body.updatedAt;
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
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
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

      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
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

      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="font-semibold">Precios</h2>
        {field({ label: "Tu % de ganancia", k: "margen", type: "number", min: info.margenMinimo, max: 500, hint: `Si lo dejás vacío usa el de tu perfil (${info.margenUsuaria}%). Ej: 60% = vendés a 1,6 veces el costo.` })}
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
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

      <details className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <summary className="cursor-pointer font-semibold">Avanzado: Google, Meta y Nadin</summary>
        <div className="mt-3 space-y-3">
          {field({ label: "Título para Google", k: "seoTitulo", maxLength: 70, hint: "Hasta 70 caracteres. Vacío = automático." })}
          {field({ label: "Descripción para Google", k: "seoDescripcion", maxLength: 160, hint: "Hasta 160 caracteres." })}
          {field({ label: "Pixel de Meta (ID)", k: "metaPixelId", inputMode: "numeric" })}
          {field({ label: "Google Analytics 4 (G-XXXX)", k: "ga4Id" })}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.mostrarNadin} onChange={(e) => setF({ ...f, mostrarNadin: chk(e) })} /> Mostrar “Productos de Nadin Lencería” al pie de la tienda (opcional)</label>
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
    <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
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
        <div key={e.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/5">
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
      <div className="space-y-2 rounded-2xl border border-dashed border-gray-300 bg-white p-5">
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
        <div key={c.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/5">
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
      <div className="space-y-2 rounded-2xl border border-dashed border-gray-300 bg-white p-5">
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

// Selector de productos para las secciones "Elegidos por mí": buscar, agregar, ordenar y quitar
function SelectorProductos({ ids, onChange }: { ids: string[]; onChange: (ids: string[]) => void }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<any[]>([]);
  const [info, setInfo] = useState<Record<string, any>>({});
  const [buscando, setBuscando] = useState(false);

  // Datos (foto y nombre) de los ya elegidos
  useEffect(() => {
    const faltan = ids.filter((id) => !info[id]);
    if (!faltan.length) return;
    fetch(`/api/mi-tienda/productos?ids=${faltan.join(',')}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d: any) => setInfo((x) => ({ ...x, ...Object.fromEntries((d.productos || []).map((p: any) => [p.id, p])) })))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')]);

  async function buscar() {
    if (q.trim().length < 2) return;
    setBuscando(true);
    const d: any = await fetch(`/api/mi-tienda/productos?q=${encodeURIComponent(q.trim())}`, { credentials: 'include' }).then((r) => r.json()).catch(() => ({}));
    setRes(d.productos || []);
    setInfo((x) => ({ ...x, ...Object.fromEntries((d.productos || []).map((p: any) => [p.id, p])) }));
    setBuscando(false);
  }
  const mover = (k: number, dir: number) => {
    const j = k + dir;
    if (j < 0 || j >= ids.length) return;
    const n = [...ids];
    [n[k], n[j]] = [n[j], n[k]];
    onChange(n);
  };

  return (
    <div className="space-y-3 rounded-xl bg-gray-50 p-3">
      <p className="text-xs text-gray-500">Buscá y agregá los productos que querés mostrar, en el orden que quieras (hasta 48). Los que se queden sin stock se ocultan solos.</p>
      {ids.length > 0 && (
        <ul className="space-y-1">
          {ids.map((id, k) => {
            const p = info[id];
            return (
              <li key={id} className="flex items-center gap-2 rounded-lg bg-white p-2 text-sm ring-1 ring-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p?.image ? <img src={tnImgClient(p.image, 120)} alt="" className="h-10 w-8 rounded object-cover" /> : <div className="h-10 w-8 rounded bg-gray-100" />}
                <span className="min-w-0 flex-1 truncate">{p?.nombre || 'Producto no disponible'}</span>
                <button type="button" className="px-1 text-gray-500" onClick={() => mover(k, -1)} aria-label="Subir">↑</button>
                <button type="button" className="px-1 text-gray-500" onClick={() => mover(k, 1)} aria-label="Bajar">↓</button>
                <button type="button" className="px-1 text-xs text-red-600" onClick={() => onChange(ids.filter((x) => x !== id))}>Quitar</button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          placeholder="Buscar producto (ej: boxer, corpiño, 5051)"
          value={q}
          onChange={(e) => setQ((e.target as any).value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } }}
        />
        <button type="button" className="rounded-xl bg-gray-900 px-4 py-2 text-sm text-white" onClick={buscar}>{buscando ? '…' : 'Buscar'}</button>
      </div>
      {res.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {res.map((p) => {
            const ya = ids.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={ya || ids.length >= 48}
                  onClick={() => onChange([...ids, p.id])}
                  className={`w-full rounded-lg bg-white p-2 text-left text-xs ring-1 ${ya ? 'opacity-50 ring-green-500' : 'ring-black/5 hover:ring-gray-400'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.image && <img src={tnImgClient(p.image, 240)} alt="" loading="lazy" className="mb-1 aspect-[3/4] w-full rounded object-cover" />}
                  <span className="line-clamp-2">{p.nombre}</span>
                  <span className="mt-1 block font-semibold">{ya ? '✓ Agregado' : '+ Agregar'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
