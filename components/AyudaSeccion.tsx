'use client';
// Botón "¿Cómo funciona?" de cada sección: abre los pasos ahí mismo y permite bajar el PDF
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HelpCircle, X, Download } from 'lucide-react';
import AYUDA from '@/lib/ayuda.json';

export type Guia = { titulo: string; para: string; pasos: string[]; consejos: string[] };
export const GUIAS = AYUDA as Record<string, Guia>;

export function ContenidoGuia({ id, guia }: { id: string; guia: Guia }) {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p>{guia.para}</p>
      {guia.pasos.length > 0 && (
        <ol className="space-y-2">
          {guia.pasos.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-700">{i + 1}</span>
              <span className="pt-0.5">{p}</span>
            </li>
          ))}
        </ol>
      )}
      {guia.consejos.length > 0 && (
        <div className="rounded-xl bg-amber-50 p-3 text-amber-900">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide">Consejos</p>
          <ul className="list-disc space-y-1 pl-4">{guia.consejos.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </div>
      )}
      <a href={`/ayuda/${id}.pdf`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50">
        <Download className="h-4 w-4" /> Descargar PDF
      </a>
    </div>
  );
}

export default function AyudaSeccion({ id, compacto = false }: { id: string; compacto?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const guia = GUIAS[id];

  useEffect(() => {
    if (!abierto) return;
    const g: any = globalThis as any;
    const esc = (e: any) => { if (e.key === 'Escape') setAbierto(false); };
    g.addEventListener?.('keydown', esc);
    return () => g.removeEventListener?.('keydown', esc);
  }, [abierto]);

  if (!guia) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-pink-700 ring-1 ring-pink-200 hover:bg-pink-50 ${compacto ? '' : 'sm:text-sm'}`}
      >
        <HelpCircle className="h-4 w-4" /> ¿Cómo funciona?
      </button>
      {abierto && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={guia.titulo}>
          <button className="absolute inset-0 bg-black/40" aria-label="Cerrar" onClick={() => setAbierto(false)} />
          <div className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900">{guia.titulo}</h2>
              <button onClick={() => setAbierto(false)} className="rounded-full p-1 text-gray-500 hover:bg-gray-100" aria-label="Cerrar"><X className="h-5 w-5" /></button>
            </div>
            <ContenidoGuia id={id} guia={guia} />
            <p className="mt-4 text-xs text-gray-500">
              <Link href="/dashboard/ayuda" onClick={() => setAbierto(false)} className="underline">Ver todas las guías</Link>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
