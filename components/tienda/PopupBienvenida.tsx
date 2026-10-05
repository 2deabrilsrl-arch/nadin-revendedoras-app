'use client';
// Pop-up de bienvenida: aparece una sola vez por visitante y pide email o WhatsApp
import { useEffect, useState } from 'react';
import type { Popup } from '@/lib/tienda-diseno';

export default function PopupBienvenida({ popup, tiendaId, apiBase, enEditor = false }: { popup: Popup; tiendaId: string; apiBase: string; enEditor?: boolean }) {
  const [ver, setVer] = useState(false);
  const [dato, setDato] = useState('');
  const [estado, setEstado] = useState<'form' | 'enviando' | 'ok'>('form');
  const [cupon, setCupon] = useState<string | null>(null);
  const [error, setError] = useState('');
  const clave = `tn_popup_${tiendaId}`;

  useEffect(() => {
    if (!popup.activo) return;
    // En el editor solo se muestra mientras se edita el pop-up
    if (enEditor && !String((globalThis as any).location?.search || '').includes('popup=1')) return;
    let visto = false;
    try { visto = !enEditor && !!(globalThis as any).localStorage?.getItem(clave); } catch { /* sin storage */ }
    if (visto) return;
    const t = setTimeout(() => setVer(true), (enEditor ? 0 : popup.segundos) * 1000);
    return () => clearTimeout(t);
  }, [popup.activo, popup.segundos, clave, enEditor]);

  const cerrar = () => {
    setVer(false);
    try { if (!enEditor) (globalThis as any).localStorage?.setItem(clave, '1'); } catch { /* nada */ }
  };

  async function enviar(e: any) {
    e.preventDefault();
    setError('');
    setEstado('enviando');
    const body = popup.pide === 'email' ? { email: dato } : { telefono: dato };
    const r = await fetch(`${apiBase}/contacto`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
    const d: any = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) { setError(d.error || 'No se pudo enviar. Probá de nuevo.'); setEstado('form'); return; }
    setCupon(d.cupon || null);
    setEstado('ok');
    try { (globalThis as any).localStorage?.setItem(clave, '1'); } catch { /* nada */ }
  }

  if (!ver) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={popup.titulo}>
      <button className="absolute inset-0 bg-black/50" aria-label="Cerrar" onClick={cerrar} />
      <div className="relative w-full max-w-md overflow-hidden rounded-[calc(var(--t-radius)+8px)] bg-white shadow-2xl">
        <button onClick={cerrar} className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-lg leading-none text-gray-600" aria-label="Cerrar">×</button>
        {popup.imagen && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={popup.imagen} alt="" className="aspect-[16/9] w-full object-cover" />
        )}
        <div className="space-y-3 p-6 text-center">
          <h2 className="t-title text-2xl">{popup.titulo}</h2>
          {estado === 'ok' ? (
            <>
              <p className="text-gray-600">¡Gracias! Ya estás en la lista.</p>
              {cupon && <p className="text-sm">Usá este cupón en tu compra: <strong className="rounded bg-gray-100 px-2 py-1 tracking-widest">{cupon}</strong></p>}
              <button onClick={cerrar} className="t-btn mt-2 w-full">Seguir mirando</button>
            </>
          ) : (
            <>
              {popup.texto && <p className="text-gray-600">{popup.texto}</p>}
              {popup.pide === 'ninguno' ? (
                <button onClick={cerrar} className="t-btn mt-2 w-full">{popup.boton}</button>
              ) : (
                <form onSubmit={enviar} className="space-y-2 pt-1">
                  <input
                    required
                    type={popup.pide === 'email' ? 'email' : 'tel'}
                    inputMode={popup.pide === 'email' ? 'email' : 'tel'}
                    placeholder={popup.pide === 'email' ? 'Tu email' : 'Tu WhatsApp (ej: 341 555 1234)'}
                    value={dato}
                    onChange={(e) => setDato((e.target as any).value)}
                    className="w-full rounded-[var(--t-btn-radius)] border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
                  />
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <button disabled={estado === 'enviando'} className="t-btn w-full">{estado === 'enviando' ? 'Enviando…' : popup.boton}</button>
                </form>
              )}
              <button onClick={cerrar} className="text-xs text-gray-400 underline">No, gracias</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
