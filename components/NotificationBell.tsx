// COMPONENTE: CAMPANITA DE NOTIFICACIONES
// Ubicacion: components/NotificationBell.tsx

'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  link?: string;
  createdAt: string;
}

export default function NotificationBell({ userId }: { userId?: string }) {
  const router = useRouter();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      cargarNotificaciones();
      const interval = setInterval(cargarNotificaciones, 10000); // Cada 10 seg
      return () => clearInterval(interval);
    }
  }, [userId]);

  const cargarNotificaciones = async () => {
    try {
      const res = await fetch(`/api/notificaciones?userId=${userId}`);
      const data = await res.json();
      setNotificaciones((data as any).notificaciones || []);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  const marcarComoLeida = async (id: string, link?: string) => {
    try {
      await fetch(`/api/notificaciones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leida: true })
      });

      await cargarNotificaciones();
      setMostrarPanel(false);

      if (link) {
        router.push(link);
      }
    } catch (error) {
      console.error('Error marcando notificacion:', error);
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      setLoading(true);
      await fetch(`/api/notificaciones/marcar-todas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      await cargarNotificaciones();
    } catch (error) {
      console.error('Error marcando todas:', error);
    } finally {
      setLoading(false);
    }
  };

  const noLeidas = notificaciones.filter(n => !n.leida);

  return (
    <div className="relative">
      {/* Boton de campanita */}
      <button
        onClick={() => setMostrarPanel(!mostrarPanel)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell size={24} />
        {noLeidas.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {noLeidas.length > 9 ? '9+' : noLeidas.length}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {mostrarPanel && (
        <>
          {/* Overlay para cerrar al hacer clic afuera */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMostrarPanel(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Notificaciones</h3>
                <p className="text-xs text-gray-500">
                  {noLeidas.length} sin leer
                </p>
              </div>
              <button
                onClick={() => setMostrarPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Boton marcar todas */}
            {noLeidas.length > 0 && (
              <div className="p-2 border-b">
                <button
                  onClick={marcarTodasComoLeidas}
                  disabled={loading}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium disabled:text-gray-400"
                >
                  {loading ? 'Marcando...' : 'Marcar todas como leidas'}
                </button>
              </div>
            )}

            {/* Lista de notificaciones */}
            <div className="overflow-y-auto flex-1">
              {notificaciones.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notificaciones.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => marcarComoLeida(notif.id, notif.link)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notif.leida ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{notif.titulo}</h4>
                            {!notif.leida && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notif.mensaje}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(notif.createdAt).toLocaleString('es-AR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
