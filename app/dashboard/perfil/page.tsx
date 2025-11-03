'use client';
import { useState } from 'react';

export default function PerfilPage() {
  const [margen, setMargen] = useState(60);
  const [cbu, setCbu] = useState('');
  const [alias, setAlias] = useState('');

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Mi Perfil</h2>
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block font-medium mb-2"> de Ganancia</label>
          <input type="range" min="0" max="150" value={margen} onChange={(e) => setMargen(Number(e.target.value))} className="w-full" />
          <p className="text-2xl font-bold text-nadin-pink">{margen}</p>
        </div>
        <div>
          <label className="block font-medium mb-2">CBU</label>
          <input type="text" value={cbu} onChange={(e) => setCbu(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block font-medium mb-2">Alias</label>
          <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <button className="w-full bg-nadin-pink text-white py-3 rounded font-bold">Guardar</button>
      </div>
    </div>
  );
}
