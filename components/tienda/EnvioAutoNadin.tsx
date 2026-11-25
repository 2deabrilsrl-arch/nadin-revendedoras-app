'use client';
// Envío automático a Nadin: cuando un pedido web queda pago, se manda solo a Nadin
// (con la forma de pago y de entrega elegidas acá). Se usa en:
// - EnvioAutoPopup: la pregunta que aparece una sola vez en Mi Tienda
// - EnvioAutoSeccion: el apartado fijo en "Marca, datos y dominio" para activarlo o apagarlo cuando quiera
import { useState } from 'react';

export const PAGOS_NADIN: Record<string, string> = { transferencia: 'Transferencia', mercadopago: 'Mercado Pago', efectivo: 'Efectivo', tarjeta: 'Tarjeta' };
export const ENTREGAS_NADIN: Record<string, string> = { retiro: 'Retiro en el local', envio: 'Envío por transporte' };

const input = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-pink-500';
const btn = 'rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
const btnSec = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm';
const val = (e: any) => (e.target as any).value;

async function guardarTienda(body: any) {
  const r = await fetch('/api/mi-tienda', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  const d: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'No se pudo guardar.');
  return d.tienda;
}

/** Elegir cómo se le paga a Nadin y cómo se recibe (lo mismo que se elige al tocar "Enviar a Nadin") */
function Datos({ v, setV }: { v: { formaPago: string; tipoEnvio: string; transporte: string }; setV: (x: any) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="text-xs text-gray-700">¿Cómo le pagás a Nadin?
        <select className={`${input} mt-1`} value={v.formaPago} onChange={(e) => setV({ ...v, formaPago: val(e) })}>
          <option value="">Elegí…</option>
          {Object.entries(PAGOS_NADIN).map(([k, x]) => <option key={k} value={k}>{x}</option>)}
        </select>
      </label>
      <label className="text-xs text-gray-700">¿Cómo recibís los pedidos?
        <select className={`${input} mt-1`} value={v.tipoEnvio} onChange={(e) => setV({ ...v, tipoEnvio: val(e) })}>
          <option value="">Elegí…</option>
          {Object.entries(ENTREGAS_NADIN).map(([k, x]) => <option key={k} value={k}>{x}</option>)}
        </select>
      </label>
      {v.tipoEnvio === 'envio' && (
        <label className="text-xs text-gray-700 sm:col-span-2">Transporte
          <input className={`${input} mt-1`} value={v.transporte} onChange={(e) => setV({ ...v, transporte: val(e) })} placeholder="Ej: Vía Cargo, Andreani…" />
        </label>
      )}
    </div>
  );
}

function useDatos(tienda: any) {
  const [v, setV] = useState({ formaPago: tienda.nadinFormaPago || '', tipoEnvio: tienda.nadinTipoEnvio || '', transporte: tienda.nadinTransporte || '' });
  const listo = !!(v.formaPago && v.tipoEnvio && (v.tipoEnvio !== 'envio' || v.transporte.trim()));
  const body = { nadinFormaPago: v.formaPago, nadinTipoEnvio: v.tipoEnvio, nadinTransporte: v.tipoEnvio === 'envio' ? v.transporte : null };
  return { v, setV, listo, body };
}

const EXPLICACION = 'Cuando una clienta paga (por Mercado Pago, o cuando tocás “Ya me pagó”), el pedido se manda solo a Nadin para armar. No te tenés que acordar de nada y el stock queda reservado.';

/** Se muestra una sola vez. "Ahora no" lo deja apagado y disponible en Marca, datos y dominio. */
export function EnvioAutoPopup({ tienda, onCerrar }: { tienda: any; onCerrar: (t: any | null, msg?: string) => void }) {
  const d = useDatos(tienda);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  async function responder(activar: boolean) {
    setBusy(activar ? 'si' : 'no'); setErr('');
    try {
      const t = await guardarTienda(activar ? { envioAutoNadin: true, envioAutoPreguntado: true, ...d.body } : { envioAutoPreguntado: true });
      onCerrar(t, activar ? '¡Listo! Los pedidos pagos se van a mandar solos a Nadin.' : 'Lo podés activar cuando quieras en Marca, datos y dominio.');
    } catch (e: any) {
      setErr(e.message);
    }
    setBusy('');
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="envio-auto-titulo">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-2xl">
        <div>
          <p className="text-3xl">📦⚡</p>
          <h2 id="envio-auto-titulo" className="mt-1 text-lg font-bold">¿Querés que tus pedidos se manden solos a Nadin?</h2>
          <p className="mt-1 text-sm text-gray-700">{EXPLICACION}</p>
        </div>
        <Datos v={d.v} setV={d.setV} />
        <p className="text-xs text-gray-500">Lo podés apagar o cambiar cuando quieras en <strong>Marca, datos y dominio</strong>.</p>
        {err && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-800" role="alert">{err}</p>}
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button type="button" className={`${btn} flex-1`} disabled={!!busy || !d.listo} onClick={() => responder(true)}>
            {busy === 'si' ? 'Activando…' : 'Sí, activar'}
          </button>
          <button type="button" className={`${btnSec} flex-1`} disabled={!!busy} onClick={() => responder(false)}>
            {busy === 'no' ? '…' : 'Ahora no'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Apartado fijo en la configuración de la tienda */
export function EnvioAutoSeccion({ tienda, onGuardado }: { tienda: any; onGuardado: (t: any, msg: string) => void }) {
  const d = useDatos(tienda);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const activo = !!tienda.envioAutoNadin;

  async function guardar(activar: boolean) {
    setBusy(true); setErr('');
    try {
      const t = await guardarTienda(activar ? { envioAutoNadin: true, ...d.body } : { envioAutoNadin: false, envioAutoPreguntado: true });
      onGuardado(t, activar ? (activo ? 'Guardado' : 'Envío automático activado') : 'Envío automático apagado');
    } catch (e: any) {
      setErr(e.message);
    }
    setBusy(false);
  }

  return (
    <section id="envio-auto" className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">📦 Envío automático a Nadin</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          {activo ? 'Activado' : 'Apagado'}
        </span>
      </div>
      <p className="text-sm text-gray-700">{EXPLICACION}</p>
      <Datos v={d.v} setV={d.setV} />
      {err && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-800" role="alert">{err}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} disabled={busy || !d.listo} onClick={() => guardar(true)}>
          {busy ? 'Guardando…' : activo ? 'Guardar cambios' : 'Activar envío automático'}
        </button>
        {activo && <button type="button" className={btnSec} disabled={busy} onClick={() => guardar(false)}>Apagar</button>}
      </div>
    </section>
  );
}
