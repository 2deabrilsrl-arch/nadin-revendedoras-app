'use client';
import BackToHomeButton from '@/components/BackToHomeButton';
export default function HistorialPage() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <BackToHomeButton />
      <h2 className="text-2xl font-bold mb-4">Historial de Envíos</h2>
      <p className="text-gray-600">Aquí verás tus consolidaciones enviadas</p>
    </div>
  );
}
