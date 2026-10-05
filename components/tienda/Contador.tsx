'use client';
// Cuenta regresiva para la sección "Oferta con temporizador"
import { useEffect, useState } from 'react';

export default function Contador({ hasta }: { hasta: string }) {
  const fin = new Date(hasta).getTime();
  const [ahora, setAhora] = useState<number | null>(null);
  useEffect(() => {
    setAhora(Date.now());
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!Number.isFinite(fin)) return null;
  const resta = Math.max(0, fin - (ahora ?? fin));
  const d = Math.floor(resta / 864e5);
  const h = Math.floor((resta % 864e5) / 36e5);
  const m = Math.floor((resta % 36e5) / 6e4);
  const s = Math.floor((resta % 6e4) / 1e3);
  const caja = (n: number, l: string) => (
    <div className="min-w-[64px] rounded-[var(--t-radius)] bg-white/95 px-3 py-2 text-center text-gray-900 shadow-sm">
      <div className="text-2xl font-bold tabular-nums sm:text-3xl">{ahora === null ? '--' : String(n).padStart(2, '0')}</div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-gray-500">{l}</div>
    </div>
  );
  return (
    <div className="flex justify-center gap-2 sm:gap-3" aria-live="off">
      {caja(d, 'días')}{caja(h, 'horas')}{caja(m, 'min')}{caja(s, 'seg')}
    </div>
  );
}
