'use client';
// Editor de diseño de la tienda (pantalla completa)
import { useEffect, useState } from 'react';
import EditorDiseno from '@/components/tienda/editor/EditorDiseno';

export default function DisenarPage() {
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/mi-tienda', { credentials: 'include' })
      .then(async (r) => {
        const d: any = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.code === 'NO_SESSION' ? 'Volvé a iniciar sesión para editar tu tienda.' : d.error || 'Error');
        setInfo(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  const salir = () => { (globalThis as any).location.href = '/dashboard/mi-tienda?tab=portada'; };

  if (error) return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white p-6 text-center text-red-700">{error}</div>;
  if (!info) return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white text-gray-500">Abriendo el editor…</div>;
  return <EditorDiseno info={info} onSalir={salir} />;
}
