'use client';
import { useState } from 'react';

export default function ArrepentimientoForm({ apiBase }: { apiBase: string }) {
  const [numero, setNumero] = useState('');
  const [contacto, setContacto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const input = 'w-full rounded-[var(--t-btn-radius)] border border-gray-300 px-3 py-2.5';

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true); setError('');
    const r = await fetch(`${apiBase}/arrepentimiento`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero, contacto, motivo }),
    }).catch(() => null);
    const d: any = await r?.json().catch(() => ({}));
    if (!r?.ok) setError(d?.error || 'No pudimos registrar la solicitud.');
    else setCodigo(d.codigo);
    setEnviando(false);
  }

  if (codigo) {
    return (
      <div className="rounded-[var(--t-radius)] bg-green-50 p-5 text-green-900" role="status">
        <p className="font-semibold">Recibimos tu solicitud.</p>
        <p className="mt-1 text-sm">Código de trámite: <strong>{codigo}</strong>. Te vamos a contactar para coordinar la devolución.</p>
      </div>
    );
  }
  return (
    <form onSubmit={enviar} className="space-y-3">
      <label className="block text-sm">Número de pedido *<input required inputMode="numeric" className={input} value={numero} onChange={(e) => setNumero((e.target as any).value)} /></label>
      <label className="block text-sm">Email o teléfono con el que compraste *<input required className={input} value={contacto} onChange={(e) => setContacto((e.target as any).value)} /></label>
      <label className="block text-sm">Motivo (opcional)<textarea className={input} rows={3} value={motivo} onChange={(e) => setMotivo((e.target as any).value)} maxLength={500} /></label>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <button disabled={enviando} className="t-btn">
        {enviando ? 'Enviando…' : 'Solicitar cancelación'}
      </button>
    </form>
  );
}
