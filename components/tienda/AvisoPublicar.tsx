'use client';
// Aviso para las que todavía no publicaron la tienda: qué paso les falta y cómo hacerlo.
// - AvisoPublicar: arriba de cada sección de Mi Tienda (menos Inicio, que tiene su lista).
// - AvisoTiendaBarra: franja en el resto de la app (se puede ocultar por 3 días).
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PASOS_TIENDA, estadoPasos, type PasoTienda, type Progreso } from '@/lib/pasos-tienda';

const btn = 'inline-block rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
const btnSec = 'inline-block rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm';

function leer(storage: 'localStorage' | 'sessionStorage', k: string) {
  try { return (globalThis as any)[storage]?.getItem(k) as string | null; } catch { return null; }
}
function guardar(storage: 'localStorage' | 'sessionStorage', k: string, v: string) {
  try { (globalThis as any)[storage]?.setItem(k, v); } catch { /* sin almacenamiento: no pasa nada */ }
}

function Barra({ hechos, total }: { hechos: number; total: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/70 ring-1 ring-black/5">
      <div className="h-full rounded-full bg-pink-500 transition-all" style={{ width: `${(hechos / total) * 100}%` }} />
    </div>
  );
}

/** Paso a paso numerado de un paso. */
export function PasoAPaso({ paso }: { paso: PasoTienda }) {
  return (
    <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700">
      {paso.pasos.map((x, i) => <li key={i}>{x}</li>)}
    </ol>
  );
}

/** Botón "Publicar ahora" (con un medio de cobro activo ya se puede). */
export function BotonPublicar({ onPublicar }: { onPublicar: () => Promise<void> }) {
  const [ocupado, setOcupado] = useState(false);
  return (
    <button type="button" className={btn} disabled={ocupado} onClick={async () => { setOcupado(true); try { await onPublicar(); } finally { setOcupado(false); } }}>
      {ocupado ? 'Publicando…' : '🚀 Publicar ahora'}
    </button>
  );
}

export default function AvisoPublicar({ progreso, tab, onPublicar }: { progreso: Progreso; tab: string; onPublicar: () => Promise<void> }) {
  const e = estadoPasos(progreso);
  const [chico, setChico] = useState(false);
  useEffect(() => { setChico(leer('sessionStorage', 'avisoPublicarChico') === '1'); }, []);
  if (e.publicada || !e.siguiente) return null;
  // Con un cobro activo ya puede publicar: le mostramos el próximo paso recomendado
  const muestra = e.puedePublicar ? e.faltan.find((x) => x.k !== 'publicada') : e.siguiente;

  if (chico) {
    return (
      <button type="button" onClick={() => { setChico(false); guardar('sessionStorage', 'avisoPublicarChico', '0'); }}
        className="mb-4 flex w-full items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-2 text-left text-sm text-amber-900 ring-1 ring-amber-200">
        <span>🟡 Tu tienda está en borrador · {e.hechos} de {e.total} pasos listos</span>
        <span className="shrink-0 font-semibold">Ver qué falta</span>
      </button>
    );
  }

  return (
    <section className="mb-5 space-y-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 sm:p-5" aria-label="Pasos para publicar tu tienda">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-amber-950">
            {e.puedePublicar ? '¡Tu tienda ya se puede publicar!' : 'Tu tienda todavía no está publicada'}
          </p>
          <p className="text-xs text-amber-900">
            Mientras esté en borrador, solo la ves vos. {e.hechos} de {e.total} pasos listos.
          </p>
        </div>
        <button type="button" className="shrink-0 text-xs text-amber-900 underline" onClick={() => { setChico(true); guardar('sessionStorage', 'avisoPublicarChico', '1'); }}>
          Achicar
        </button>
      </div>
      <Barra hechos={e.hechos} total={e.total} />

      {e.puedePublicar && (
        <div className="space-y-2 rounded-xl bg-white p-3 ring-1 ring-black/5">
          <p className="text-sm">Ya tenés un medio de cobro activo, así que podés publicarla ya. {e.faltan.length > 1 && 'Los otros pasos los podés completar después.'}</p>
          <BotonPublicar onPublicar={onPublicar} />
        </div>
      )}

      {muestra && (
        <div className="space-y-2 rounded-xl bg-white p-3 ring-1 ring-black/5">
          <p className="text-sm font-semibold">
            {e.puedePublicar ? 'Recomendado' : 'Próximo paso'}: {muestra.titulo}
            {muestra.obligatorio && <span className="ml-2 rounded-full bg-pink-100 px-2 py-0.5 text-[11px] font-semibold text-pink-700">Obligatorio para publicar</span>}
          </p>
          <PasoAPaso paso={muestra} />
          {muestra.tab === tab
            ? <p className="text-xs text-gray-500">👇 Lo hacés acá abajo, en esta misma pantalla.</p>
            : <Link href={`/dashboard/mi-tienda?tab=${muestra.tab}`} className={btnSec}>{muestra.boton} →</Link>}
        </div>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer text-amber-900">Ver todos los pasos</summary>
        <ol className="mt-2 space-y-1">
          {PASOS_TIENDA.map((p, i) => (
            <li key={p.k}>
              <Link href={`/dashboard/mi-tienda?tab=${p.tab}`} className={progreso[p.k] ? 'text-gray-400 line-through' : 'text-gray-800 underline decoration-dotted'}>
                {progreso[p.k] ? '✅' : '⬜'} {i + 1}. {p.titulo}
              </Link>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

const OCULTO_KEY = 'avisoTiendaOcultoHasta';

/** Franja para el resto de la app (Catálogo, pedidos a Nadin…): crear la tienda o terminar de publicarla.
 *  Se puede ocultar por 3 días. */
export function AvisoTiendaBarra({ visible }: { visible: boolean }) {
  const [d, setD] = useState<any>(null);
  useEffect(() => {
    if (!visible) return;
    const hasta = Number(leer('localStorage', OCULTO_KEY) || 0);
    if (hasta > Date.now()) return;
    fetch('/api/mi-tienda/estado', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((x) => setD(x))
      .catch(() => {});
  }, [visible]);
  if (!visible || !d || (d.tiene && d.activa)) return null;

  const ocultar = () => { guardar('localStorage', OCULTO_KEY, String(Date.now() + 3 * 864e5)); setD(null); };
  const e = d.tiene ? estadoPasos(d.progreso) : null;
  const texto = !e
    ? '🛍️ Tenés una tienda web gratis, con los productos de Nadin ya cargados.'
    : e.puedePublicar
      ? '🟡 Tu tienda web está lista para publicar: es un solo toque.'
      : `🟡 Tu tienda web está en borrador: te falta${e.faltan.length === 1 ? '' : 'n'} ${e.faltan.length} paso${e.faltan.length === 1 ? '' : 's'}.`;
  const href = !e ? '/dashboard/mi-tienda' : e.puedePublicar ? '/dashboard/mi-tienda?tab=inicio' : `/dashboard/mi-tienda?tab=${e.siguiente?.tab || 'inicio'}`;
  const boton = !e ? 'Crear mi tienda' : e.puedePublicar ? 'Publicar' : 'Ver el paso a paso';

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-200">
      <span className="min-w-0 flex-1">{texto}</span>
      <Link href={href} className="rounded-lg bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white">{boton}</Link>
      <button type="button" className="text-xs text-amber-900 underline" onClick={ocultar}>En 3 días</button>
    </div>
  );
}
