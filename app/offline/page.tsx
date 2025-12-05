'use client';
import { WifiOff, RefreshCcw, Home, Package } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const handleReload = () => {
    if (typeof globalThis !== 'undefined' && globalThis.location) {
      globalThis.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Ícono */}
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="text-orange-500" size={48} />
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Sin Conexión
          </h1>

          {/* Descripción */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            No podemos conectarnos al servidor en este momento.
            Verifica tu conexión a internet y vuelve a intentar.
          </p>

          {/* Botones de acción */}
          <div className="space-y-3">
            <button
              onClick={handleReload}
              className="w-full bg-nadin-pink text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-nadin-pink-dark transition-colors"
            >
              <RefreshCcw size={20} />
              Reintentar Conexión
            </button>

            <Link
              href="/dashboard"
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <Home size={20} />
              Volver al Inicio
            </Link>
          </div>

          {/* Info adicional */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3 text-left">
              <Package size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">💡 Modo Offline Disponible</p>
                <p className="text-blue-600">
                  Algunos datos pueden estar disponibles sin conexión.
                  Los productos que ya visitaste están guardados localmente.
                </p>
              </div>
            </div>
          </div>

          {/* Estado de la app */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              La aplicación intentará reconectarse automáticamente
            </p>
          </div>
        </div>

        {/* Tips offline */}
        <div className="mt-6 bg-white rounded-xl p-6 shadow-md">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-lg">📌</span>
            Mientras tanto, puedes:
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Ver productos que ya exploraste</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Revisar tu historial de pedidos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Preparar pedidos (se sincronizarán al reconectar)</span>
            </li>
          </ul>
        </div>

        {/* Ayuda */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            ¿Problemas de conexión persistentes?{' '}
            <a
              href="https://wa.me/5493416789012"
              className="text-nadin-pink hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contacta soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
