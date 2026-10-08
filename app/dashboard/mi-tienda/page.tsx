'use client';

// Panel "Mi Tienda Web" de la revendedora
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { reducirImagen } from '@/components/tienda/reducirImagen';
import { SelectorProductos } from '@/components/tienda/editor/EditorDiseno';
import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';

type Tab = 'inicio' | 'pedidos' | 'portada' | 'productos' | 'paginas' | 'clientes' | 'estadisticas' | 'diseno' | 'pagos' | 'envios' | 'cupones';

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

const TABS: Tab[] = ['inicio', 'pedidos', 'portada', 'productos', 'paginas', 'clientes', 'estadisticas', 'diseno', 'pagos', 'envios', 'cupones'];

// La página se genera estática en producción, así que la sección (?tab=) se lee
// en el navegador con useSearchParams (dentro de Suspense), no con la prop searchParams.
export default function MiTiendaPage() {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Cargando tu tienda…</p>}>
      <MiTienda />
    </Suspense>
  );
}

function MiTienda() {
  // La sección viene del menú lateral (?tab=); por defecto, Inicio
  const pedida = useSearchParams()?.get('tab') as Tab | null;
  const tab: Tab = pedida && TABS.includes(pedida) ? pedida : 'inicio';
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
  return (
    <div className="mx-auto max-w-5xl pb-24">
      {tab === 'inicio' && <Inicio info={info} onToast={setToast} />}

      {tab === 'pedidos' && (
        <div className="space-y-8">
          <Pedidos onToast={setToast} tienda={t} onTienda={(nt: any) => setInfo({ ...info, tienda: { ...t, ...nt } })} />
          <CarritosAbandonados tiendaNombre={t.nombre} />
        </div>
      )}
      {tab === 'productos' && <ProductosTienda onToast={setToast} slug={t.slug} />}
      {tab === 'paginas' && <Paginas onToast={setToast} urlApp={info.urlApp} />}
      {tab === 'clientes' && <Clientes onToast={setToast} />}
      {tab === 'estadisticas' && <Estadisticas onToast={setToast} />}
      {tab === 'portada' && <Portada info={info} />}
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
// Inicio: resumen + lista "Empezá acá"
// ---------------------------------------------------------------------

const PASOS_INICIO: { k: string; titulo: string; texto: string; tab: string }[] = [
  { k: 'marca', titulo: 'Poné tu nombre, logo y WhatsApp', texto: 'Así tus clientas reconocen tu tienda y te pueden escribir.', tab: 'diseno' },
  { k: 'diseno', titulo: 'Elegí el diseño', texto: 'Plantilla, colores, fotos del carrusel y secciones.', tab: 'portada' },
  { k: 'productos', titulo: 'Destacá productos o cargá los tuyos', texto: 'Los de Nadin ya están cargados. Elegí cuáles mostrar primero.', tab: 'productos' },
  { k: 'cobros', titulo: 'Activá cómo te pagan', texto: 'Transferencia, Mercado Pago, link de pago o efectivo.', tab: 'pagos' },
  { k: 'entregas', titulo: 'Activá cómo entregás', texto: 'Envío a domicilio, correo o retiro.', tab: 'envios' },
  { k: 'publicada', titulo: 'Publicá tu tienda', texto: 'En Marca, datos y dominio → Publicar tienda.', tab: 'diseno' },
];

function Inicio({ info, onToast }: { info: any; onToast: (s: string) => void }) {
  const t = info.tienda;
  const prog = info.progreso || {};
  const res = info.resumen || {};
  const hechos = PASOS_INICIO.filter((p) => prog[p.k]).length;
  const completo = hechos === PASOS_INICIO.length;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 p-5 text-white">
        <p className="text-sm opacity-90">Mi tienda web</p>
        <h2 className="text-2xl font-bold">{t.nombre}</h2>
        <p className="mt-1 break-all text-sm opacity-90">{info.url}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${t.activa ? 'bg-green-500' : 'bg-white/25'}`}>
            {t.activa ? 'Publicada' : 'Borrador (solo vos la ves)'}
          </span>
          <a href={info.urlApp} target="_blank" className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-pink-700">Ver mi tienda</a>
          <button
            className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold"
            onClick={() => { (globalThis as any).navigator?.clipboard?.writeText(info.url); onToast('Link copiado'); }}
          >
            Copiar link
          </button>
          <a className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold" target="_blank"
            href={`https://wa.me/?text=${encodeURIComponent(`¡Mirá mi tienda online! ${info.url}`)}`}>
            Compartir por WhatsApp
          </a>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/dashboard/mi-tienda?tab=pedidos" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 hover:ring-pink-200">
          <p className="text-xs text-gray-500">Pedidos para atender</p>
          <p className={`text-2xl font-bold ${res.pendientes ? 'text-pink-600' : ''}`}>{res.pendientes || 0}</p>
          <p className="text-xs text-gray-400">Esperando pago o para enviar a Nadin</p>
        </Link>
        <Link href="/dashboard/mi-tienda?tab=estadisticas" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 hover:ring-pink-200">
          <p className="text-xs text-gray-500">Ventas de este mes</p>
          <p className="text-2xl font-bold">{fmt(res.ventasMes)}</p>
          <p className="text-xs text-gray-400">{res.pedidosMes || 0} pedido{res.pedidosMes === 1 ? '' : 's'} pagado{res.pedidosMes === 1 ? '' : 's'}</p>
        </Link>
        <Link href="/dashboard/mi-tienda?tab=estadisticas" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 hover:ring-pink-200">
          <p className="text-xs text-gray-500">Visitas (últimos 7 días)</p>
          <p className="text-2xl font-bold">{res.visitas7 || 0}</p>
          <p className="text-xs text-gray-400">Compartí tu link para tener más</p>
        </Link>
      </div>

      {!completo && (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Empezá acá</h2>
            <span className="text-xs text-gray-500">{hechos} de {PASOS_INICIO.length} listos</span>
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-pink-500 transition-all" style={{ width: `${(hechos / PASOS_INICIO.length) * 100}%` }} />
          </div>
          <ol className="space-y-2">
            {PASOS_INICIO.map((p, i) => {
              const ok = !!prog[p.k];
              return (
                <li key={p.k}>
                  <Link href={`/dashboard/mi-tienda?tab=${p.tab}`} className={`flex items-start gap-3 rounded-xl p-3 transition ${ok ? 'bg-green-50/60' : 'bg-gray-50 hover:bg-pink-50'}`}>
                    {ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-gray-300" />}
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-medium ${ok ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{i + 1}. {p.titulo}</span>
                      {!ok && <span className="block text-xs text-gray-500">{p.texto}</span>}
                    </span>
                    {!ok && <span className="shrink-0 text-xs font-semibold text-pink-700">Hacerlo →</span>}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/dashboard/catalogo" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 hover:ring-pink-200">
          <p className="font-semibold">🛒 Comprar a Nadin</p>
          <p className="text-xs text-gray-500">Hacé tu pedido para stock o para una clienta que te pidió por fuera de la tienda.</p>
        </Link>
        <Link href="/dashboard/ayuda" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 hover:ring-pink-200">
          <p className="font-semibold">📘 Guías y tutoriales</p>
          <p className="text-xs text-gray-500">Paso a paso de cada sección, para leer o descargar en PDF.</p>
        </Link>
      </div>
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
  const [sel, setSel] = useState<string[]>([]);

  const cargar = useCallback(() => api('/ordenes').then((d) => setOrdenes(d.ordenes)).catch(() => setOrdenes([])), []);
  useEffect(() => { cargar(); }, [cargar]);

  async function accion(id: string, a: string, confirmar?: string) {
    if (confirmar && !(globalThis as any).confirm(confirmar)) return;
    setBusy(id + a);
    try {
      await api(`/ordenes/${id}`, 'PATCH', { accion: a });
      onToast(a === 'marcar_pagada' ? 'Marcado como pagado. Ya lo podés enviar a Nadin.' : 'Actualizado');
      await cargar();
    } catch (e: any) {
      onToast(e.message);
    }
    setBusy('');
  }

  async function enviarSeleccionados(datos: { formaPago: string; tipoEnvio: string; transporteNombre: string | null }) {
    setBusy('enviar');
    try {
      const r = await api('/ordenes/enviar-nadin', 'POST', { ids: sel, ...datos });
      onTienda({ nadinFormaPago: datos.formaPago, nadinTipoEnvio: datos.tipoEnvio, nadinTransporte: datos.transporteNombre });
      onToast(`¡Listo! ${r.pedidos === 1 ? 'El pedido ya está' : `Los ${r.pedidos} pedidos ya están`} en Nadin para armar.`);
      setSel([]);
      await cargar();
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
        <p className="mt-1 text-sm">Completá “Marca, datos y dominio” y “Cobros”, publicá la tienda y compartí tu link.</p>
      </div>
    );
  }

  const paraEnviar = ordenes.filter((o) => o.paraEnviar);
  const toggle = (id: string) => setSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const seleccionadas = ordenes.filter((o) => sel.includes(o.id));
  const costoSel = seleccionadas.reduce((acc, o) => acc + (o.totalMayorista || 0), 0);

  return (
    <div className="space-y-3">
      {paraEnviar.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-100">
          <p className="flex-1">
            <strong>{paraEnviar.length} pedido{paraEnviar.length === 1 ? '' : 's'} para enviar a Nadin.</strong> Tildá los que quieras mandar juntos y tocá <strong>Enviar a Nadin</strong>: van en un solo envío.
          </p>
          <button type="button" className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200"
            onClick={() => setSel(sel.length === paraEnviar.length ? [] : paraEnviar.map((o) => o.id))}>
            {sel.length === paraEnviar.length ? 'Quitar selección' : 'Seleccionar todos'}
          </button>
        </div>
      )}

      <ul className="space-y-3">
        {ordenes.map((o) => {
          const est = ESTADOS[o.estado] || { label: o.estado, color: 'bg-gray-100' };
          const ganancia = o.total - o.envioCosto - o.totalMayorista;
          const marcada = sel.includes(o.id);
          return (
            <li key={o.id} className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ${marcada ? 'ring-2 ring-pink-400' : 'ring-black/5'}`}>
              <div className="flex items-start gap-3">
                {o.paraEnviar && (
                  <input type="checkbox" checked={marcada} onChange={() => toggle(o.id)} className="mt-1 h-5 w-5 shrink-0 accent-pink-600" aria-label={`Enviar pedido #${o.numero} a Nadin`} />
                )}
                <button className="flex min-w-0 flex-1 items-start justify-between gap-3 text-left" onClick={() => setAbierta(abierta === o.id ? null : o.id)}>
                  <div className="min-w-0">
                    <p className="font-semibold">#{o.numero} · {o.clienteNombre}</p>
                    <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString('es-AR')} · {o.metodoPagoNombre}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${est.color}`}>
                      {o.paraEnviar && o.estado === 'enviada_nadin' ? 'Falta enviar a Nadin' : est.label}
                    </span>
                    {o.arrepentimiento && <span className="ml-1 inline-block rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">Pidió arrepentimiento</span>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold">{fmt(o.total)}</p>
                    <p className="text-xs text-green-700">Ganás {fmt(ganancia)}</p>
                  </div>
                </button>
              </div>

              {o.estado === 'pagada' && o.items.some((i: any) => i.propio) && (
                <p className="mt-3 rounded-xl bg-blue-50 p-3 text-xs text-blue-900">
                  {o.items.every((i: any) => i.propio)
                    ? 'Este pedido tiene solo productos tuyos: lo preparás y entregás vos.'
                    : 'Los productos tuyos (marcados “Tuyo”) no van a Nadin: los preparás vos.'}
                </p>
              )}

              {abierta === o.id && (
                <div className="mt-3 space-y-3 border-t pt-3 text-sm">
                  <ul className="space-y-1">
                    {o.items.map((i: any) => (
                      <li key={i.id} className="flex justify-between gap-2">
                        <span>{i.qty} × {i.nombre} {i.talle && `· ${i.talle}`} {i.color && `· ${i.color}`}{i.propio && <span className="ml-1 rounded bg-blue-100 px-1.5 text-[10px] font-semibold text-blue-800">Tuyo</span>}</span>
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

      {sel.length > 0 && (
        <EnviarNadin tienda={tienda} busy={busy === 'enviar'} cantidad={sel.length} costo={costoSel} onEnviar={enviarSeleccionados} onCancelar={() => setSel([])} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Panel fijo abajo: enviar los pedidos elegidos a Nadin (una sola consolidación)
// ---------------------------------------------------------------------

const PAGOS_NADIN: Record<string, string> = { transferencia: 'Transferencia', mercadopago: 'Mercado Pago', efectivo: 'Efectivo', tarjeta: 'Tarjeta' };
const ENTREGAS_NADIN: Record<string, string> = { retiro: 'Retiro en el local', envio: 'Envío por transporte' };

function EnviarNadin({ tienda, busy, cantidad, costo, onEnviar, onCancelar }: {
  tienda: any; busy: boolean; cantidad: number; costo: number;
  onEnviar: (x: { formaPago: string; tipoEnvio: string; transporteNombre: string | null }) => void; onCancelar: () => void;
}) {
  const guardado = !!(tienda.nadinFormaPago && tienda.nadinTipoEnvio);
  const [editar, setEditar] = useState(!guardado);
  const [formaPago, setFormaPago] = useState(tienda.nadinFormaPago || '');
  const [tipoEnvio, setTipoEnvio] = useState(tienda.nadinTipoEnvio || '');
  const [transporte, setTransporte] = useState(tienda.nadinTransporte || '');
  const listo = formaPago && tipoEnvio && (tipoEnvio !== 'envio' || transporte.trim());

  return (
    <div className="sticky bottom-3 z-30 rounded-2xl bg-white p-4 text-sm shadow-2xl ring-2 ring-pink-400">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-gray-900">
          {cantidad} pedido{cantidad === 1 ? '' : 's'} seleccionado{cantidad === 1 ? '' : 's'} · Le pagás a Nadin {fmt(costo)}
        </p>
        <button type="button" className="text-xs text-gray-500 underline" onClick={onCancelar}>Cancelar</button>
      </div>
      {!editar ? (
        <p className="mt-1 text-gray-700">
          Pago a Nadin: <strong>{PAGOS_NADIN[formaPago] || formaPago}</strong> · {ENTREGAS_NADIN[tipoEnvio] || tipoEnvio}{tipoEnvio === 'envio' && transporte ? ` (${transporte})` : ''}.{' '}
          <button type="button" className="text-pink-700 underline" onClick={() => setEditar(true)}>Cambiar</button>
        </p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-gray-700">¿Cómo le pagás a Nadin?
            <select className={`${input} mt-1 bg-white`} value={formaPago} onChange={(e) => setFormaPago(val(e))}>
              <option value="">Elegí…</option>
              {Object.entries(PAGOS_NADIN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-700">¿Cómo lo recibís?
            <select className={`${input} mt-1 bg-white`} value={tipoEnvio} onChange={(e) => setTipoEnvio(val(e))}>
              <option value="">Elegí…</option>
              {Object.entries(ENTREGAS_NADIN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          {tipoEnvio === 'envio' && (
            <label className="text-xs text-gray-700 sm:col-span-2">Transporte
              <input className={`${input} mt-1 bg-white`} value={transporte} onChange={(e) => setTransporte(val(e))} placeholder="Ej: Vía Cargo, Andreani…" />
            </label>
          )}
          <p className="text-xs text-gray-500 sm:col-span-2">Lo recordamos para la próxima.</p>
        </div>
      )}
      <button className={`${btn} mt-3 w-full`} disabled={busy || !listo}
        onClick={() => onEnviar({ formaPago, tipoEnvio, transporteNombre: tipoEnvio === 'envio' ? transporte : null })}>
        {busy ? 'Enviando…' : `Enviar ${cantidad === 1 ? 'pedido' : `${cantidad} pedidos`} a Nadin`}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------
// Diseño modular: plantilla + barra de anuncio + secciones (tipo Tiendanube)
// ---------------------------------------------------------------------

function Portada({ info }: { info: any }) {
  const t = info.tienda;
  const conBorrador = !!t.disenoBorrador;
  return (
    <div className="space-y-4">
      <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Diseño de tu tienda</h2>
            <p className="text-sm text-gray-500">Plantillas, colores, letra, encabezado y secciones, con vista previa en vivo.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${conBorrador ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
            {conBorrador ? 'Tenés cambios sin publicar' : 'Diseño publicado'}
          </span>
        </div>
        <div className="overflow-hidden rounded-xl ring-1 ring-black/10">
          <iframe src={info.urlApp} title="Tu tienda" className="pointer-events-none h-[420px] w-full border-0" loading="lazy" />
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/dashboard/mi-tienda/disenar" className={btn}>{conBorrador ? 'Seguir editando' : 'Editar diseño'}</a>
          <a href={info.urlApp} target="_blank" className={btnSec}>Ver tienda</a>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------
// Productos: destacar y ocultar
// ---------------------------------------------------------------------

function ProductosTienda({ onToast, slug }: { onToast: (s: string) => void; slug: string }) {
  const [vista, setVista] = useState<'nadin' | 'propios'>('nadin');
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-black/5">
        {([['nadin', 'Productos de Nadin'], ['propios', 'Mis productos']] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setVista(id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${vista === id ? 'bg-gray-900 text-white' : 'text-gray-600'}`}>{label}</button>
        ))}
      </div>
      {vista === 'nadin' ? <ProductosNadin onToast={onToast} /> : <MisProductos onToast={onToast} slug={slug} />}
    </div>
  );
}

function ProductosNadin({ onToast }: { onToast: (s: string) => void }) {
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
      delete body.id; delete body.diseno; delete body.userId; delete body.dominioPropio; delete body.dominioPendiente; delete body.createdAt; delete body.updatedAt;
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
            <p className="text-xs text-gray-500">Se muestra arriba de todo si no cargaste fotos en el carrusel (Diseño). Va sola, sin texto encima: si querés texto, ponelo en la imagen. Medida ideal: 1920 × 730.</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {f.bannerUrl && <img src={f.bannerUrl} alt="Portada" className="my-2 h-16 w-full rounded-lg object-cover" />}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => subir('banner', (e.target as any).files?.[0])} />
          </div>
        </div>
        <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">Los colores, la letra y las secciones se cambian en la pestaña <strong>Diseño</strong>, con vista previa.</p>
        <label className="block text-sm"><span className="font-medium">Sobre tu tienda</span>
          <span className="block text-xs text-gray-500">Contá quién sos y dónde vendés. Ayuda a aparecer en Google.</span>
          <textarea className={`${input} mt-1`} rows={4} value={f.descripcion ?? ''} onChange={set('descripcion')} maxLength={2000} /></label>
      </section>

      <DominioPropio onCambio={() => api('').then((d: any) => onSaved({ tienda: d.tienda, url: d.url })).catch(() => {})} />

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
              {p.config?.vencido ? (
                <div className="space-y-2 rounded-lg bg-red-50 p-3 text-red-800">
                  <p><strong>Tu conexión con Mercado Pago venció.</strong> Mientras tanto tus clientas no ven Mercado Pago al pagar. Volvé a conectarla:</p>
                  {mpOAuth && <a href="/api/mi-tienda/mercadopago/connect" className={`${btn} inline-block`}>Volver a conectar Mercado Pago</a>}
                </div>
              ) : p.config?.conectado ? (
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
      <Promociones onToast={onToast} />
      <h3 className="pt-2 font-semibold">Cupones de descuento</h3>
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
// ---------------------------------------------------------------------
// Mis productos: lo que la revendedora vende por su cuenta (no es de Nadin)
// ---------------------------------------------------------------------

const PRODUCTO_VACIO = { nombre: '', categoria: '', descripcion: '', imagenes: [] as string[], activo: true, destacado: false, variantes: [{ talle: '', color: '', precio: '', precioAntes: '', stock: '', sku: '' }] as any[] };

function MisProductos({ onToast, slug }: { onToast: (s: string) => void; slug: string }) {
  const [lista, setLista] = useState<any[] | null>(null);
  const [editando, setEditando] = useState<any | null>(null);

  const cargar = useCallback(() => {
    api('/propios').then((d) => setLista(d.productos)).catch((e) => onToast(e.message));
  }, [onToast]);
  useEffect(() => { cargar(); }, [cargar]);

  if (editando) {
    return <EditorProductoPropio inicial={editando} slug={slug} onToast={onToast} onCerrar={(cambio) => { setEditando(null); if (cambio) cargar(); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-semibold">Vendé también tus propios productos</p>
        <p className="mt-1">Cargá lo que vendés por tu cuenta (accesorios, carteras, lo que quieras). Aparecen en tu tienda junto a los de Nadin y se cobran igual. Esos pedidos los preparás y entregás vos: no se mandan a Nadin.</p>
        <p className="mt-2 text-xs text-blue-800">Gratis por tiempo limitado. Más adelante podría aplicarse una comisión chica (alrededor del 0,5%) sobre las ventas de productos propios; te avisaríamos antes. No se permiten productos ilegales, falsificados, medicamentos, armas ni contenido para adultos.</p>
      </div>
      <button type="button" className={btn} onClick={() => setEditando({ ...PRODUCTO_VACIO })}>+ Nuevo producto</button>
      {!lista ? <p className="text-gray-500">Cargando…</p> : lista.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500 ring-1 ring-black/5">Todavía no cargaste productos propios.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          {lista.map((p) => {
            const precios = p.variantes.map((v: any) => v.precio);
            const stock = p.variantes.reduce((a: number, v: any) => a + v.stock, 0);
            return (
              <li key={p.id} className="flex items-center gap-3 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.imagenes?.[0] ? <img src={p.imagenes[0]} alt="" className="h-14 w-11 rounded object-cover" /> : <div className="h-14 w-11 rounded bg-gray-100" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.nombre}{!p.activo && <span className="ml-2 text-xs text-gray-400">(oculto)</span>}</p>
                  <p className="text-xs text-gray-500">{precios.length ? fmt(Math.min(...precios)) : '-'} · {stock} en stock · {p.categoria}</p>
                </div>
                <button type="button" className={btnSec} onClick={() => setEditando({
                  ...p,
                  variantes: p.variantes.map((v: any) => ({ ...v, precio: String(v.precio), precioAntes: v.precioAntes ? String(v.precioAntes) : '', stock: String(v.stock), sku: v.sku || '' })),
                })}>Editar</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EditorProductoPropio({ inicial, slug, onToast, onCerrar }: { inicial: any; slug: string; onToast: (s: string) => void; onCerrar: (cambio: boolean) => void }) {
  const [f, setF] = useState<any>(inicial);
  // Categorías existentes de la tienda (las de Nadin + las propias ya creadas)
  const [cats, setCats] = useState<string[]>([]);
  const [nuevaCat, setNuevaCat] = useState(false);
  const [padre, setPadre] = useState('');
  const [nombreCat, setNombreCat] = useState('');
  useEffect(() => {
    fetch(`/api/tienda/${slug}/categorias`).then((r) => r.json())
      .then((x: any) => setCats((x.categorias || []).map((c: any) => String(c.nombre).replace(/ › /g, ' > '))))
      .catch(() => {});
  }, [slug]);
  const opciones = Array.from(new Set([...cats, ...(f.categoria ? [f.categoria] : [])])).sort((a, b) => a.localeCompare(b, 'es'));
  const [subiendo, setSubiendo] = useState(false);
  const [saving, setSaving] = useState(false);
  const setVar = (k: number, campo: string, v: string) => setF((x: any) => ({ ...x, variantes: x.variantes.map((y: any, j: number) => (j === k ? { ...y, [campo]: v } : y)) }));

  async function subirFotos(files: any) {
    const arr = Array.from(files || []).slice(0, 8 - f.imagenes.length);
    if (!arr.length) return;
    setSubiendo(true);
    for (const file of arr) {
      const fd = new FormData();
      fd.append('file', await reducirImagen(file, 1600));
      fd.append('kind', 'producto');
      const r = await fetch('/api/mi-tienda/upload', { method: 'POST', body: fd, credentials: 'include' });
      const d: any = await r.json().catch(() => ({}));
      if (!r.ok) { onToast(d.error || 'No se pudo subir una foto'); continue; }
      setF((x: any) => ({ ...x, imagenes: [...x.imagenes, d.url] }));
    }
    setSubiendo(false);
  }

  async function guardar() {
    if (!f.categoria) return onToast('Elegí una categoría.');
    setSaving(true);
    try {
      const body = { ...f, variantes: f.variantes.map((v: any) => ({ ...v, precio: Number(v.precio), precioAntes: v.precioAntes ? Number(v.precioAntes) : null, stock: Number(v.stock) })) };
      await api('/propios', f.id ? 'PUT' : 'POST', body);
      onToast('Producto guardado');
      onCerrar(true);
    } catch (e: any) { onToast(e.message); }
    setSaving(false);
  }

  async function borrar() {
    if (!f.id || !(globalThis as any).confirm?.('¿Borrar este producto de tu tienda?')) return;
    try { await api(`/propios?id=${f.id}`, 'DELETE'); onToast('Producto borrado'); onCerrar(true); } catch (e: any) { onToast(e.message); }
  }

  return (
    <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{f.id ? 'Editar producto' : 'Nuevo producto'}</h3>
        <button type="button" className="text-sm text-gray-500" onClick={() => onCerrar(false)}>Cancelar</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Nombre *<input className={`${input} mt-1`} value={f.nombre} onChange={(e) => setF({ ...f, nombre: val(e) })} placeholder="Mochila urbana" /></label>
        <div className="text-sm">
          Categoría *
          {!nuevaCat ? (
            <select className={`${input} mt-1`} value={f.categoria || ''} onChange={(e) => {
              if (val(e) === '__nueva') { setNuevaCat(true); return; }
              setF({ ...f, categoria: val(e) });
            }}>
              <option value="">Elegí una categoría…</option>
              {opciones.map((c) => <option key={c} value={c}>{c.replace(/ > /g, ' › ')}</option>)}
              <option value="__nueva">+ Crear una categoría nueva…</option>
            </select>
          ) : (
            <div className="mt-1 space-y-2 rounded-lg bg-gray-50 p-2">
              <select className={input} value={padre} onChange={(e) => setPadre(val(e))}>
                <option value="">Categoría principal (sin padre)</option>
                {opciones.filter((c) => c.split(' > ').length < 3).map((c) => <option key={c} value={c}>Dentro de: {c.replace(/ > /g, ' › ')}</option>)}
              </select>
              <input className={input} placeholder="Nombre de la categoría (ej: Mochilas)" value={nombreCat} onChange={(e) => setNombreCat(val(e))} />
              <div className="flex gap-2">
                <button type="button" className={btnSec} onClick={() => {
                  const n = nombreCat.trim().replace(/\s*>\s*/g, ' ');
                  if (!n) return;
                  const nombre = n.charAt(0).toUpperCase() + n.slice(1);
                  setF({ ...f, categoria: padre ? `${padre} > ${nombre}` : nombre });
                  setNuevaCat(false); setNombreCat(''); setPadre('');
                }}>Usar esta categoría</button>
                <button type="button" className="text-xs text-gray-500" onClick={() => setNuevaCat(false)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <label className="block text-sm">Descripción<textarea className={`${input} mt-1`} rows={4} value={f.descripcion || ''} onChange={(e) => setF({ ...f, descripcion: val(e) })} /></label>

      <div>
        <p className="mb-2 text-sm">Fotos (hasta 8)</p>
        <div className="flex flex-wrap gap-2">
          {f.imagenes.map((u: string, k: number) => (
            <div key={u} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-24 w-20 rounded object-cover" />
              <button type="button" className="absolute right-1 top-1 rounded-full bg-white/90 px-1.5 text-xs" onClick={() => setF((x: any) => ({ ...x, imagenes: x.imagenes.filter((_: any, j: number) => j !== k) }))}>✕</button>
              {k > 0 && <button type="button" className="absolute bottom-1 left-1 rounded bg-white/90 px-1 text-[10px]" onClick={() => setF((x: any) => { const n = [...x.imagenes]; [n[0], n[k]] = [n[k], n[0]]; return { ...x, imagenes: n }; })}>Principal</button>}
            </div>
          ))}
          {f.imagenes.length < 8 && (
            <label className="flex h-24 w-20 cursor-pointer items-center justify-center rounded border-2 border-dashed border-gray-300 text-center text-xs text-gray-500">
              {subiendo ? 'Subiendo…' : '+ Fotos'}
              <input type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => subirFotos((e.target as any).files)} />
            </label>
          )}
        </div>
      </div>

      <div>
        <p className="text-sm">Variantes y precios</p>
        <p className="mb-2 text-xs text-gray-500">Si no tiene talles ni colores, dejá esos campos vacíos y cargá una sola fila.</p>
        <div className="space-y-2">
          {f.variantes.map((v: any, k: number) => (
            <div key={v.id || k} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_100px_100px_80px_1fr_auto]">
              <input className={input} placeholder="Talle / tamaño" value={v.talle} onChange={(e) => setVar(k, 'talle', val(e))} />
              <input className={input} placeholder="Color / modelo" value={v.color} onChange={(e) => setVar(k, 'color', val(e))} />
              <input className={input} placeholder="Precio $" inputMode="numeric" value={v.precio} onChange={(e) => setVar(k, 'precio', val(e).replace(/[^0-9]/g, ''))} />
              <input className={input} placeholder="Antes $ (oferta)" title="Precio tachado (opcional)" inputMode="numeric" value={v.precioAntes || ''} onChange={(e) => setVar(k, 'precioAntes', val(e).replace(/[^0-9]/g, ''))} />
              <input className={input} placeholder="Stock" inputMode="numeric" value={v.stock} onChange={(e) => setVar(k, 'stock', val(e).replace(/[^0-9]/g, ''))} />
              <input className={input} placeholder="Código (opcional)" value={v.sku || ''} onChange={(e) => setVar(k, 'sku', val(e))} />
              <button type="button" className="text-xs text-red-600" disabled={f.variantes.length === 1} onClick={() => setF((x: any) => ({ ...x, variantes: x.variantes.filter((_: any, j: number) => j !== k) }))}>Quitar</button>
            </div>
          ))}
        </div>
        <button type="button" className={`${btnSec} mt-2`} onClick={() => setF((x: any) => ({ ...x, variantes: [...x.variantes, { talle: '', color: '', precio: x.variantes[x.variantes.length - 1]?.precio || '', precioAntes: '', stock: '', sku: '' }] }))}>+ Variante</button>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.activo} onChange={(e) => setF({ ...f, activo: chk(e) })} /> Visible en la tienda</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.destacado} onChange={(e) => setF({ ...f, destacado: chk(e) })} /> Destacado</label>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className={btn} disabled={saving || subiendo} onClick={guardar}>{saving ? 'Guardando…' : 'Guardar'}</button>
        {f.id && <button type="button" className="text-sm text-red-600" onClick={borrar}>Borrar producto</button>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Páginas propias (Cómo comprar, Cambios, Envíos…)
// ---------------------------------------------------------------------

function Paginas({ onToast, urlApp }: { onToast: (s: string) => void; urlApp: string }) {
  const [data, setData] = useState<any>(null);
  const [editando, setEditando] = useState<any>(null);
  const cargar = useCallback(() => { api('/paginas').then(setData).catch((e) => onToast(e.message)); }, [onToast]);
  useEffect(() => { cargar(); }, [cargar]);

  async function crear(modelo?: string) {
    try { const r = await api('/paginas', 'POST', modelo ? { modelo } : { titulo: 'Nueva página' }); cargar(); setEditando(r.pagina); } catch (e: any) { onToast(e.message); }
  }
  async function guardar() {
    try { await api('/paginas', 'PUT', editando); onToast('Página guardada'); setEditando(null); cargar(); } catch (e: any) { onToast(e.message); }
  }
  async function borrar(id: string) {
    if (!(globalThis as any).confirm('¿Borrar esta página?')) return;
    try { await api(`/paginas?id=${id}`, 'DELETE'); setEditando(null); cargar(); } catch (e: any) { onToast(e.message); }
  }

  if (!data) return <p className="text-gray-500">Cargando…</p>;
  if (editando) {
    return (
      <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Editar página</h3>
          <button className="text-sm text-gray-500" onClick={() => setEditando(null)}>Cancelar</button>
        </div>
        <input className={input} value={editando.titulo} onChange={(e) => setEditando({ ...editando, titulo: val(e) })} placeholder="Título" />
        <textarea className={`${input} font-mono`} rows={14} value={editando.contenido} onChange={(e) => setEditando({ ...editando, contenido: val(e) })} />
        <p className="text-xs text-gray-500">Tip: empezá una línea con <code>## </code> para un subtítulo y con <code>- </code> para una lista. Dejá una línea vacía entre párrafos.</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!editando.visible} onChange={(e) => setEditando({ ...editando, visible: chk(e) })} /> Publicada</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!editando.enPie} onChange={(e) => setEditando({ ...editando, enPie: chk(e) })} /> Link en el pie de página</label>
        </div>
        <div className="flex items-center gap-3">
          <button className={btn} onClick={guardar}>Guardar</button>
          <a href={`${urlApp}/p/${editando.slug}`} target="_blank" className={btnSec}>Ver</a>
          <button className="ml-auto text-sm text-red-600" onClick={() => borrar(editando.id)}>Borrar</button>
        </div>
      </div>
    );
  }
  const faltan = data.modelos.filter((m: any) => !data.paginas.some((p: any) => p.slug === m.slug));
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Páginas con información para tus clientas. Aparecen en el pie de la tienda y las podés sumar al menú desde <strong>Diseño → Menú</strong>.</p>
      {data.paginas.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          {data.paginas.map((p: any) => (
            <li key={p.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{p.titulo}</p>
                <p className="text-xs text-gray-500">/p/{p.slug}{!p.visible && ' · oculta'}</p>
              </div>
              <button className={btnSec} onClick={() => setEditando(p)}>Editar</button>
            </li>
          ))}
        </ul>
      )}
      {faltan.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <p className="mb-2 text-sm font-medium">Crear con texto sugerido</p>
          <div className="flex flex-wrap gap-2">
            {faltan.map((m: any) => <button key={m.slug} className={btnSec} onClick={() => crear(m.slug)}>+ {m.titulo}</button>)}
          </div>
        </div>
      )}
      <button className={btn} onClick={() => crear()}>+ Página en blanco</button>
    </div>
  );
}

// ---------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------

function Clientes({ onToast }: { onToast: (s: string) => void }) {
  const [lista, setLista] = useState<any[] | null>(null);
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<'todas' | 'compra' | 'suscripta'>('todas');
  const cargar = useCallback(() => { api('/clientes').then((d) => setLista(d.clientes)).catch((e) => onToast(e.message)); }, [onToast]);
  useEffect(() => { cargar(); }, [cargar]);

  async function borrar(c: any) {
    if (!(globalThis as any).confirm(`¿Borrar los datos de contacto de ${c.nombre || c.telefono || c.email}?\n\nSe borran su suscripción del pop-up y sus carritos sin terminar. Los pedidos se mantienen como respaldo de la venta.`)) return;
    try {
      await api('/clientes', 'DELETE', { telefono: c.telefono, email: c.email });
      onToast('Datos borrados');
      cargar();
    } catch (e: any) { onToast(e.message); }
  }

  if (!lista) return <p className="text-gray-500">Cargando…</p>;
  const t = q.trim().toLowerCase();
  const vista = lista.filter((c) => (filtro === 'todas' || c.origen === filtro) && (!t || `${c.nombre} ${c.email || ''} ${c.telefono || ''} ${c.localidad}`.toLowerCase().includes(t)));

  function exportar() {
    const filas = [['Nombre', 'Teléfono', 'Email', 'Localidad', 'Pedidos', 'Compras pagadas', 'Total gastado', 'Última actividad', 'Origen']];
    vista.forEach((c) => filas.push([c.nombre, c.telefono || '', c.email || '', c.localidad, c.pedidos, c.comprados, Math.round(c.gastado), new Date(c.ultima).toLocaleDateString('es-AR'), c.origen === 'compra' ? 'Compró' : 'Pop-up']));
    const csv = '﻿' + filas.map((f) => f.map((x: any) => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\n');
    const g: any = globalThis as any;
    const a = g.document.createElement('a');
    a.href = g.URL.createObjectURL(new g.Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input className={`${input} max-w-xs`} placeholder="Buscar por nombre, teléfono o email" value={q} onChange={(e) => setQ(val(e))} />
        <select className={`${input} w-auto`} value={filtro} onChange={(e) => setFiltro(val(e))}>
          <option value="todas">Todas ({lista.length})</option>
          <option value="compra">Compraron</option>
          <option value="suscripta">Dejaron sus datos</option>
        </select>
        <button className={`${btnSec} ml-auto`} onClick={exportar} disabled={!vista.length}>⬇ Exportar Excel</button>
      </div>
      {vista.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500 ring-1 ring-black/5">Todavía no hay clientas acá. Aparecen cuando alguien compra o deja sus datos en el pop-up.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          {vista.map((c, k) => {
            const wa = (c.telefono || '').replace(/\D/g, '');
            return (
              <li key={k} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.nombre || 'Sin nombre'} {c.origen === 'suscripta' && <span className="ml-1 rounded bg-blue-50 px-1.5 text-[10px] font-semibold text-blue-700">POP-UP</span>}</p>
                  <p className="truncate text-xs text-gray-500">{[c.telefono, c.email, c.localidad].filter(Boolean).join(' · ')}</p>
                </div>
                <div className="text-right text-xs text-gray-600">
                  {c.comprados > 0 ? <p><strong>{fmt(c.gastado)}</strong> en {c.comprados} compra{c.comprados === 1 ? '' : 's'}</p> : <p>{c.pedidos ? `${c.pedidos} pedido(s) sin pagar` : 'Sin compras'}</p>}
                  <p className="text-gray-400">{new Date(c.ultima).toLocaleDateString('es-AR')}</p>
                </div>
                {wa && <a href={`https://wa.me/${wa.length === 10 ? `549${wa}` : wa}`} target="_blank" className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">WhatsApp</a>}
                <button onClick={() => borrar(c)} className="text-xs text-gray-400 underline hover:text-red-700" title="Si te pide que borres sus datos">Borrar datos</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Dominio propio (alta automática en Vercel)
// ---------------------------------------------------------------------

function DominioPropio({ onCambio }: { onCambio: () => void }) {
  const [d, setD] = useState<any>(null);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const [err, setErr] = useState('');
  const [copiado, setCopiado] = useState('');

  const revisar = useCallback(async () => {
    setCargando(true);
    setErr('');
    try { setD(await api('/dominio')); } catch (e: any) { setErr(e.message); }
    setCargando(false);
  }, []);
  useEffect(() => { revisar(); }, [revisar]);

  async function conectar() {
    setCargando(true);
    setErr('');
    try {
      const r = await api('/dominio', 'POST', { dominio: texto });
      setD({ habilitado: true, estado: r.estado });
      setTexto('');
      onCambio();
    } catch (e: any) { setErr(e.message); }
    setCargando(false);
  }

  async function desconectar() {
    if (!(globalThis as any).confirm('¿Desconectar tu dominio? Tu tienda va a seguir funcionando con la dirección de Nadin.')) return;
    setCargando(true);
    try { await api('/dominio', 'DELETE'); setD({ ...d, estado: null }); onCambio(); } catch (e: any) { setErr(e.message); }
    setCargando(false);
  }

  const copiar = (v: string) => {
    (globalThis as any).navigator?.clipboard?.writeText(v);
    setCopiado(v);
    setTimeout(() => setCopiado(''), 1500);
  };

  if (!d) return <section className="rounded-2xl bg-white p-5 text-sm text-gray-500 shadow-sm ring-1 ring-black/5">Cargando dominio…</section>;
  const e = d.estado;

  return (
    <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div>
        <h2 className="font-semibold">Dominio propio</h2>
        <p className="text-xs text-gray-500">Si compraste tu dominio (ej: www.lenceriamaria.com.ar), conectalo para que tu tienda se vea con tu dirección.</p>
      </div>

      {!d.habilitado && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Todavía no está habilitado. Avisale a Nadin.</p>}

      {d.habilitado && !e && (
        <>
          <div className="flex gap-2">
            <input className={input} placeholder="www.tudominio.com.ar" value={texto} onChange={(ev) => setTexto(val(ev))} inputMode="url" autoCapitalize="none" />
            <button className={btn} disabled={cargando || !texto.trim()} onClick={conectar}>{cargando ? 'Conectando…' : 'Conectar'}</button>
          </div>
          <p className="text-xs text-gray-500">¿No tenés dominio? Los .com.ar se compran en <a href="https://nic.ar" target="_blank" rel="noopener" className="underline">nic.ar</a> (necesitás clave fiscal). Después volvé acá.</p>
        </>
      )}

      {e && (
        <div className="space-y-3">
          <div className={`flex flex-wrap items-center gap-2 rounded-lg p-3 text-sm ${e.activo ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
            <span className="font-semibold">{e.activo ? '✅ Funcionando' : '⏳ Esperando que apunte'}</span>
            <a href={`https://${e.dominio}`} target="_blank" rel="noopener" className="font-mono underline">{e.dominio}</a>
          </div>
          <p className="text-sm text-gray-700">{e.mensaje}</p>

          {e.registros?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Datos para cargar donde compraste el dominio</p>
              <div className="overflow-x-auto rounded-lg ring-1 ring-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500"><tr><th className="p-2">Tipo</th><th className="p-2">Nombre / Host</th><th className="p-2">Valor / Destino</th><th className="p-2"></th></tr></thead>
                  <tbody>
                    {e.registros.map((r: any, i: number) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="p-2 font-semibold">{r.tipo}</td>
                        <td className="p-2 font-mono">{r.nombre}</td>
                        <td className="p-2 font-mono break-all">
                          <button type="button" onClick={() => copiar(r.valor)} className="underline decoration-dotted" title="Copiar">{r.valor}</button>
                          {copiado === r.valor && <span className="ml-1 text-green-700">copiado</span>}
                        </td>
                        <td className="p-2">{r.ok ? '✅' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <details className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                <summary className="cursor-pointer font-semibold">Paso a paso (NIC.ar y otros)</summary>
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>Entrá al panel donde compraste el dominio (DonWeb, Hostinger, GoDaddy, Cloudflare, etc.). Si lo compraste en NIC.ar, NIC.ar no tiene panel de DNS: usá el de tu hosting o creá una cuenta gratis en Cloudflare y delegá el dominio ahí desde NIC.ar.</li>
                  <li>Buscá la sección <strong>DNS</strong>, <strong>Zona DNS</strong> o <strong>Registros DNS</strong>.</li>
                  <li>Por cada fila de la tabla de arriba, agregá un registro con ese <strong>Tipo</strong>, <strong>Nombre</strong> y <strong>Valor</strong>. Si ya existe uno con el mismo nombre y tipo, editalo o borralo (por ejemplo, el que apuntaba a Tiendanube).</li>
                  <li>Guardá y volvé acá. Tocá <strong>Revisar ahora</strong>. Puede tardar de unos minutos a 24 horas; te avisamos con una notificación cuando quede funcionando.</li>
                </ol>
              </details>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!e.activo && <button className={btn} disabled={cargando} onClick={revisar}>{cargando ? 'Revisando…' : 'Revisar ahora'}</button>}
            <button className={btnSec} disabled={cargando} onClick={desconectar}>Desconectar dominio</button>
          </div>
        </div>
      )}
      {err && <p className="text-sm text-red-700">{err}</p>}
    </section>
  );
}

// ---------------------------------------------------------------------
// Estadísticas
// ---------------------------------------------------------------------

function Estadisticas({ onToast }: { onToast: (s: string) => void }) {
  const [dias, setDias] = useState(30);
  const [d, setD] = useState<any>(null);
  useEffect(() => { setD(null); api(`/estadisticas?dias=${dias}`).then(setD).catch((e) => onToast(e.message)); }, [dias, onToast]);

  const tarjeta = (titulo: string, valor: string, sub?: string) => (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-xs text-gray-500">{titulo}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{valor}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[7, 30, 90].map((n) => (
          <button key={n} onClick={() => setDias(n)} className={`rounded-full px-3 py-1 text-sm ${dias === n ? 'bg-gray-900 text-white' : 'bg-white ring-1 ring-black/5'}`}>Últimos {n} días</button>
        ))}
      </div>
      {!d ? <p className="text-gray-500">Cargando…</p> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tarjeta('Visitas', d.totales.visitas.toLocaleString('es-AR'), `${d.totales.vistasProducto.toLocaleString('es-AR')} vistas de productos`)}
            {tarjeta('Pedidos', String(d.totales.pedidos), `${d.totales.pagados} pagados`)}
            {tarjeta('Ventas', fmt(d.totales.ventas), `Ganancia ${fmt(d.totales.ganancia)}`)}
            {tarjeta('Conversión', `${d.totales.conversion}%`, 'de las visitas compró')}
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <p className="mb-3 text-sm font-medium">Visitas por día</p>
            <div className="flex h-36 items-end gap-[2px]" role="img" aria-label="Gráfico de visitas por día">
              {(() => {
                const max = Math.max(1, ...d.porDia.map((x: any) => x.visitas));
                return d.porDia.map((x: any) => (
                  <div key={x.fecha} className="group relative flex-1">
                    <div className={`w-full rounded-t ${x.pedidos ? 'bg-pink-500' : 'bg-pink-200'}`} style={{ height: `${Math.max(2, (x.visitas / max) * 136)}px` }} />
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] text-white group-hover:block">
                      {new Date(`${x.fecha}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}: {x.visitas} visitas · {x.pedidos} pedidos
                    </span>
                  </div>
                ));
              })()}
            </div>
            <p className="mt-2 text-xs text-gray-400">Las barras más oscuras son días con pedidos.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {([['Más vistos', d.masVistos, (x: any) => `${x.vistas} vistas`], ['Más vendidos', d.masVendidos, (x: any) => `${x.unidades} u. · ${fmt(x.total)}`]] as const).map(([titulo, items, detalle]: any) => (
              <div key={titulo} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                <p className="mb-3 text-sm font-medium">{titulo}</p>
                {items.length === 0 ? <p className="text-sm text-gray-400">Todavía sin datos.</p> : (
                  <ul className="space-y-2">
                    {items.map((x: any) => (
                      <li key={x.productId} className="flex items-center gap-3 text-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {x.imagen ? <img src={x.imagen} alt="" className="h-10 w-8 rounded object-cover" /> : <div className="h-10 w-8 rounded bg-gray-100" />}
                        <span className="min-w-0 flex-1 truncate">{x.nombre}</span>
                        <span className="text-xs text-gray-500">{detalle(x)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Promociones automáticas (3x2, 2x1, % off)
// ---------------------------------------------------------------------

const PROMO_VACIA = { nombre: '', tipo: 'nxm', lleva: 3, paga: 2, porcentaje: '', alcance: 'todo', categoria: '', productos: [] as string[], desde: '', hasta: '' };

function Promociones({ onToast }: { onToast: (s: string) => void }) {
  const [lista, setLista] = useState<any[] | null>(null);
  const [n, setN] = useState<any>(null);
  const [cats, setCats] = useState<{ nombre: string; path: string }[]>([]);
  const cargar = useCallback(() => api('/promociones').then((d) => setLista(d.promociones)).catch((e) => onToast(e.message)), [onToast]);
  useEffect(() => {
    cargar();
    api('').then((d) => fetch(`/api/tienda/${d.tienda.slug}/categorias`)).then((r: any) => r.json()).then((x: any) => setCats(x.categorias || [])).catch(() => {});
  }, [cargar]);

  async function crear() {
    try {
      await api('/promociones', 'POST', { ...n, porcentaje: Number(n.porcentaje) || 0, desde: n.desde || null, hasta: n.hasta ? `${n.hasta}T23:59:59` : null });
      setN(null); cargar(); onToast('Promoción creada');
    } catch (e: any) { onToast(e.message); }
  }

  const describir = (p: any) => `${p.tipo === 'nxm' ? `Llevá ${p.lleva} pagá ${p.paga}` : `${p.porcentaje}% OFF`} · ${p.alcance === 'todo' ? 'toda la tienda' : p.alcance === 'categoria' ? `categoría ${(cats.find((c) => c.path === p.categoria)?.nombre) || p.categoria}` : `${(p.productos || []).length} productos`}${p.hasta ? ` · hasta ${new Date(p.hasta).toLocaleDateString('es-AR')}` : ''}`;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-semibold">Promociones automáticas</h3>
        <p className="text-sm text-gray-600">Se aplican solas en el carrito y se muestran en los productos (ej: “3x2”). Salen de tu ganancia.</p>
      </div>
      {lista?.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/5">
          <div>
            <p className="font-semibold">{p.nombre}</p>
            <p className="text-gray-600">{describir(p)}</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1"><input type="checkbox" checked={p.activa} onChange={async (e) => { await api('/promociones', 'PUT', { id: p.id, activa: chk(e) }); cargar(); }} /> Activa</label>
            <button className="text-red-700" onClick={async () => { if ((globalThis as any).confirm('¿Borrar promoción?')) { await api(`/promociones?id=${p.id}`, 'DELETE'); cargar(); } }}>Borrar</button>
          </div>
        </div>
      ))}
      {!n ? (
        <button className={btnSec} onClick={() => setN({ ...PROMO_VACIA })}>+ Nueva promoción</button>
      ) : (
        <div className="space-y-3 rounded-2xl border border-dashed border-gray-300 bg-white p-5">
          <div className="grid gap-2 sm:grid-cols-3">
            <select className={input} value={n.tipo} onChange={(e) => setN({ ...n, tipo: val(e) })}>
              <option value="nxm">Llevá X, pagá Y (3x2, 2x1…)</option>
              <option value="porcentaje">% de descuento</option>
            </select>
            {n.tipo === 'nxm' ? (
              <div className="flex items-center gap-2 text-sm">
                Llevá <input className={`${input} w-16`} type="number" min={2} value={n.lleva} onChange={(e) => setN({ ...n, lleva: Number(val(e)) })} />
                pagá <input className={`${input} w-16`} type="number" min={1} value={n.paga} onChange={(e) => setN({ ...n, paga: Number(val(e)) })} />
              </div>
            ) : (
              <input className={input} type="number" placeholder="% (ej 20)" value={n.porcentaje} onChange={(e) => setN({ ...n, porcentaje: val(e) })} />
            )}
            <input className={input} placeholder="Nombre (opcional)" value={n.nombre} onChange={(e) => setN({ ...n, nombre: val(e) })} />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <select className={input} value={n.alcance} onChange={(e) => setN({ ...n, alcance: val(e) })}>
              <option value="todo">En toda la tienda</option>
              <option value="categoria">En una categoría</option>
              <option value="productos">En productos elegidos</option>
            </select>
            {n.alcance === 'categoria' && (
              <select className={`${input} sm:col-span-2`} value={n.categoria} onChange={(e) => setN({ ...n, categoria: val(e) })}>
                <option value="">Elegí la categoría…</option>
                {cats.map((c) => <option key={c.path} value={c.path}>{c.nombre}</option>)}
              </select>
            )}
          </div>
          {n.alcance === 'productos' && <SelectorProductos ids={n.productos} max={100} onChange={(ids) => setN({ ...n, productos: ids })} />}
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-gray-500">Desde (opcional)<input className={input} type="date" value={n.desde} onChange={(e) => setN({ ...n, desde: val(e) })} /></label>
            <label className="text-xs text-gray-500">Hasta (opcional)<input className={input} type="date" value={n.hasta} onChange={(e) => setN({ ...n, hasta: val(e) })} /></label>
          </div>
          <div className="flex gap-2">
            <button className={btn} onClick={crear}>Crear promoción</button>
            <button className={btnSec} onClick={() => setN(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------
// Carritos abandonados
// ---------------------------------------------------------------------

function CarritosAbandonados({ tiendaNombre }: { tiendaNombre: string }) {
  const [lista, setLista] = useState<any[] | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  useEffect(() => { api('/carritos').then((d) => setLista(d.carritos)).catch(() => setLista([])); }, []);
  if (!lista || !lista.length) return null;
  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-semibold">🛒 Carritos abandonados ({lista.length})</h3>
        <p className="text-sm text-gray-600">Dejaron sus datos pero no terminaron la compra. Escribiles: muchas compran con un empujoncito. Si dejaron email, les mandamos un recordatorio automático a las 2 horas.</p>
      </div>
      <ul className="divide-y divide-gray-100 rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        {lista.map((c) => {
          const tel = String(c.telefono || '').replace(/\D/g, '');
          const wa = tel ? (tel.length === 10 ? `549${tel}` : tel) : '';
          const msg = `¡Hola${c.nombre ? ` ${c.nombre.split(' ')[0]}` : ''}! Vi que dejaste unos productos en tu carrito de ${tiendaNombre}. ¿Te ayudo a terminar la compra? Lo tenés guardado acá: ${c.link}`;
          return (
            <li key={c.id} className="p-4 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <button className="min-w-0 flex-1 text-left" onClick={() => setAbierto(abierto === c.id ? null : c.id)}>
                  <p className="font-medium">{c.nombre || 'Sin nombre'} · {fmt(c.total)}</p>
                  <p className="text-xs text-gray-500">{(c.items as any[]).length} producto(s) · {new Date(c.updatedAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}{c.estado === 'avisado' ? ' · recordatorio enviado' : ''}</p>
                </button>
                {wa && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`} target="_blank" className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">Escribir por WhatsApp</a>}
              </div>
              {abierto === c.id && (
                <ul className="mt-2 space-y-1 text-xs text-gray-600">
                  {(c.items as any[]).map((i, k) => <li key={k}>{i.qty} × {i.nombre} {i.talle && `· ${i.talle}`} {i.color && `· ${i.color}`}</li>)}
                  {c.email && <li className="pt-1">Email: {c.email}</li>}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
