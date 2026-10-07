'use client';
// Todas las guías de la app, ordenadas como el menú, para leer o descargar en PDF
import { useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import { MENU } from '@/lib/menu-revendedora';
import { GUIAS, ContenidoGuia } from '@/components/AyudaSeccion';

export default function AyudaPage() {
  const [abierta, setAbierta] = useState<string | null>('inicio');
  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div>
          <p className="font-semibold">Guía completa de Mi Tienda</p>
          <p className="text-sm text-gray-500">Todas las secciones en un solo PDF, para imprimir o mandar por WhatsApp.</p>
        </div>
        <a href="/ayuda/guia-completa.pdf" target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white">
          <Download className="h-4 w-4" /> Descargar PDF
        </a>
      </div>

      {MENU.map((g, gi) => {
        const items = g.items.filter((x) => x.id !== 'ayuda' && GUIAS[x.id]);
        if (!items.length) return null;
        return (
          <section key={gi}>
            {g.titulo && <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-400">{g.titulo}</p>}
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              {items.map((x) => {
                const Icono = x.icon;
                const open = abierta === x.id;
                return (
                  <li key={x.id}>
                    <button onClick={() => setAbierta(open ? null : x.id)} aria-expanded={open} className="flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50">
                      <Icono className="h-5 w-5 shrink-0 text-pink-500" />
                      <span className="flex-1">
                        <span className="block font-medium">{GUIAS[x.id].titulo}</span>
                        <span className="block text-xs text-gray-500">{GUIAS[x.id].para}</span>
                      </span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && <div className="px-4 pb-5 pl-12"><ContenidoGuia id={x.id} guia={GUIAS[x.id]} /></div>}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
