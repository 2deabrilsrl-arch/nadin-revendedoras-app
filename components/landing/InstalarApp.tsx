'use client';
// Botón "Instalar la app": en Android/Chrome abre el instalador; en iPhone muestra cómo agregarla
import { useEffect, useState } from 'react';
import { esSamsungInternet, urlAbrirEnChrome } from '@/lib/instalar-pwa';

export default function InstalarApp() {
  const [evento, setEvento] = useState<any>(null);
  const [ios, setIos] = useState(false);
  const [ayuda, setAyuda] = useState(false);
  const [instalada, setInstalada] = useState(false);
  const [samsung, setSamsung] = useState(false);

  useEffect(() => {
    const g: any = globalThis as any;
    setIos(/iphone|ipad|ipod/i.test(g.navigator?.userAgent || ''));
    setInstalada(!!g.matchMedia?.('(display-mode: standalone)').matches);
    const enSamsung = esSamsungInternet();
    setSamsung(enSamsung);
    // En el navegador de Samsung no usamos su instalador (Play Protect lo bloquea)
    const h = (e: any) => { e.preventDefault(); if (!enSamsung) setEvento(e); };
    g.addEventListener?.('beforeinstallprompt', h);
    return () => g.removeEventListener?.('beforeinstallprompt', h);
  }, []);

  if (instalada) return null;

  async function instalar() {
    if (evento) {
      evento.prompt();
      await evento.userChoice.catch(() => null);
      setEvento(null);
    } else {
      setAyuda(true);
    }
  }

  return (
    <div className="space-y-3">
      <button onClick={instalar} className="w-full rounded-full border-2 border-white/80 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 sm:w-auto">
        📲 Instalar la app en mi celular
      </button>
      {ayuda && (
        <div className="rounded-2xl bg-white/95 p-4 text-left text-sm text-gray-800 shadow-lg">
          {samsung ? (
            <div className="space-y-2">
              <p>Desde el navegador de Samsung el celular puede bloquear la app. Instalala desde <strong>Chrome</strong>:</p>
              <a href={urlAbrirEnChrome()} className="inline-block rounded-full bg-pink-600 px-4 py-2 font-semibold text-white">Abrir en Chrome</a>
              <p className="text-xs text-gray-500">Ahí tocá los tres puntitos → <strong>Instalar app</strong>.</p>
            </div>
          ) : ios ? (
            <ol className="list-decimal space-y-1 pl-5">
              <li>Abrí esta página en <strong>Safari</strong>.</li>
              <li>Tocá el botón <strong>Compartir</strong> (el cuadrado con la flecha para arriba).</li>
              <li>Elegí <strong>Agregar a inicio</strong> y tocá <strong>Agregar</strong>.</li>
            </ol>
          ) : (
            <ol className="list-decimal space-y-1 pl-5">
              <li>Abrí esta página en <strong>Chrome</strong>.</li>
              <li>Tocá los <strong>tres puntitos</strong> de arriba a la derecha.</li>
              <li>Elegí <strong>Instalar app</strong> o <strong>Agregar a pantalla principal</strong>.</li>
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
