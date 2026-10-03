'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

interface Slide { imagen: string; imagenMobile?: string; titulo?: string; texto?: string; boton?: string; href?: string }

export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const ref = useRef<any>(null);
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);
  const n = slides.length;

  // Solo avanza solo cuando se ve en pantalla (no compite con el scroll de la página)
  useEffect(() => {
    const el = ref.current;
    const IO = (globalThis as any).IntersectionObserver;
    if (!el || !IO) return;
    const io = new IO((e: any[]) => setVisible(!!e[0]?.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const ir = (k: number) => {
    const el = ref.current;
    if (!el) return;
    const idx = (k + n) % n;
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
  };

  useEffect(() => {
    if (n < 2 || !visible) return;
    const t = setInterval(() => { if (!(globalThis as any).document?.hidden) ir(i + 1); }, 5500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, n, visible]);

  if (!n) return null;

  return (
    <section className="relative" aria-roledescription="carrusel" aria-label="Novedades">
      <div
        ref={ref}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const el = e.currentTarget as any;
          const k = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
          if (k !== i) setI(k);
        }}
      >
        {slides.map((s, k) => {
          const contenido = (
            <div className="relative w-full">
              <picture>
                {s.imagenMobile && <source media="(max-width: 640px)" srcSet={s.imagenMobile} />}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.imagen} alt={s.titulo || ''} loading={k === 0 ? 'eager' : 'lazy'} className="aspect-[4/5] w-full object-cover sm:aspect-[21/8]" />
              </picture>
              {(s.titulo || s.texto || s.boton) && (
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/45 via-black/10 to-transparent sm:items-center sm:bg-gradient-to-r sm:from-black/40 sm:via-black/10">
                  <div className="mx-auto w-full max-w-7xl px-6 pb-10 text-white sm:px-12 sm:pb-0">
                    {s.titulo && <h2 className="t-title max-w-lg text-3xl leading-tight sm:text-5xl">{s.titulo}</h2>}
                    {s.texto && <p className="mt-3 max-w-md text-base text-white/90 sm:text-lg">{s.texto}</p>}
                    {s.boton && <span className="t-btn-light mt-6 inline-block">{s.boton}</span>}
                  </div>
                </div>
              )}
            </div>
          );
          return (
            <div key={k} className="w-full shrink-0 snap-start" aria-roledescription="slide" aria-label={`${k + 1} de ${n}`}>
              {s.href ? <a href={s.href} className="block">{contenido}</a> : contenido}
            </div>
          );
        })}
      </div>

      {n > 1 && (
        <>
          <button type="button" onClick={() => ir(i - 1)} className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 shadow sm:block" aria-label="Anterior"><Icon name="flechaIzq" /></button>
          <button type="button" onClick={() => ir(i + 1)} className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 shadow sm:block" aria-label="Siguiente"><Icon name="flechaDer" /></button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {slides.map((_, k) => (
              <button key={k} type="button" onClick={() => ir(k)} aria-label={`Ir a ${k + 1}`} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-6 bg-white' : 'w-1.5 bg-white/60'}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
