'use client';

import { useState } from 'react';
import Icon from './Icon';
import { CartBadgeLink } from './TiendaCart';

interface Cat { nombre: string; href: string; hijos: { nombre: string; href: string }[] }

export default function HeaderTienda({ nombre, logoUrl, home, buscarHref, categorias, variante = 'centrado' }: {
  nombre: string; logoUrl: string | null; home: string; buscarHref: string; categorias: Cat[]; variante?: 'centrado' | 'izquierda';
}) {
  const [abierto, setAbierto] = useState(false);
  const [buscando, setBuscando] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white">
      {variante === 'izquierda' ? (
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 lg:py-4">
          <button type="button" className="rounded-full p-2 lg:hidden" onClick={() => setAbierto(true)} aria-label="Abrir menú">
            <Icon name="menu" />
          </button>
          <a href={home} className="flex shrink-0 items-center gap-2" aria-label={`${nombre} - inicio`}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={nombre} className="h-10 max-w-[150px] object-contain" />
            ) : (
              <span className="t-title text-xl">{nombre}</span>
            )}
          </a>
          <nav className="hidden flex-1 lg:block" aria-label="Categorías">
            <ul className="flex flex-wrap gap-6 text-[13px] font-medium uppercase tracking-[0.1em]">
              {categorias.map((c) => (
                <li key={c.href} className="group relative">
                  <a href={c.href} className="block py-2 text-gray-700 hover:text-[var(--t-primary)]">{c.nombre}</a>
                  {c.hijos.length > 0 && (
                    <ul className="invisible absolute left-0 top-full z-40 min-w-[200px] bg-white py-2 text-[13px] normal-case tracking-normal opacity-0 shadow-lg ring-1 ring-black/5 transition group-hover:visible group-hover:opacity-100">
                      {c.hijos.map((h) => (
                        <li key={h.href}><a href={h.href} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">{h.nombre}</a></li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <button type="button" className="rounded-full p-2" onClick={() => setBuscando((v) => !v)} aria-label="Buscar">
              <Icon name="buscar" />
            </button>
            <CartBadgeLink />
          </div>
        </div>
      ) : (
      <>
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 lg:py-4">
          <div className="flex items-center gap-1">
            <button type="button" className="rounded-full p-2 lg:hidden" onClick={() => setAbierto(true)} aria-label="Abrir menú">
              <Icon name="menu" />
            </button>
            <button type="button" className="hidden rounded-full p-2 lg:inline-flex" onClick={() => setBuscando((v) => !v)} aria-label="Buscar">
              <Icon name="buscar" />
            </button>
          </div>
  
          <a href={home} className="flex items-center justify-center gap-2" aria-label={`${nombre} - inicio`}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={nombre} className="h-10 max-w-[160px] object-contain lg:h-12" />
            ) : (
              <span className="t-title text-xl tracking-wide lg:text-2xl">{nombre}</span>
            )}
          </a>
  
          <div className="flex items-center justify-end gap-1">
            <button type="button" className="rounded-full p-2 lg:hidden" onClick={() => setBuscando((v) => !v)} aria-label="Buscar">
              <Icon name="buscar" />
            </button>
            <CartBadgeLink />
          </div>
        </div>
  
        {categorias.length > 0 && (
          <nav className="hidden border-t border-black/5 lg:block" aria-label="Categorías">
            <ul className="mx-auto flex max-w-7xl justify-center gap-8 px-4 text-[13px] uppercase tracking-[0.12em]">
              {categorias.map((c) => (
                <li key={c.href} className="group relative">
                  <a href={c.href} className="block py-3 text-gray-700 hover:text-[var(--t-primary)]">{c.nombre}</a>
                  {c.hijos.length > 0 && (
                    <ul className="invisible absolute left-1/2 top-full z-40 min-w-[200px] -translate-x-1/2 bg-white py-2 text-[13px] normal-case tracking-normal opacity-0 shadow-lg ring-1 ring-black/5 transition group-hover:visible group-hover:opacity-100">
                      {c.hijos.map((h) => (
                        <li key={h.href}><a href={h.href} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">{h.nombre}</a></li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        )}
  
        </>
      )}

      {buscando && (
        <form action={buscarHref} className="border-t border-black/5 px-4 py-3" role="search">
          <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-full border border-gray-200 px-4">
            <Icon name="buscar" size={18} className="text-gray-400" />
            <input name="q" type="search" autoFocus placeholder="¿Qué estás buscando?" aria-label="Buscar productos" className="w-full bg-transparent py-2.5 text-sm outline-none" />
          </div>
        </form>
      )}

      {abierto && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <button className="absolute inset-0 bg-black/40" aria-label="Cerrar menú" onClick={() => setAbierto(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm overflow-y-auto bg-white p-5">
            <div className="mb-6 flex items-center justify-between">
              <span className="t-title text-lg">{nombre}</span>
              <button onClick={() => setAbierto(false)} aria-label="Cerrar"><Icon name="cerrar" /></button>
            </div>
            <ul className="divide-y divide-gray-100 text-[15px]">
              <li><a href={home} className="block py-3">Inicio</a></li>
              {categorias.map((c) => (
                <li key={c.href} className="py-1">
                  <a href={c.href} className="block py-2 font-medium">{c.nombre}</a>
                  {c.hijos.length > 0 && (
                    <ul className="mb-2 ml-3 space-y-1 text-sm text-gray-600">
                      {c.hijos.map((h) => <li key={h.href}><a href={h.href} className="block py-1">{h.nombre}</a></li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
