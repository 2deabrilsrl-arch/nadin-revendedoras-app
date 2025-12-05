// COMPONENTE: Notificaciones Vendedora CORREGIDO
// Ubicacion: components/NotificacionesVendedora.tsx

'use client';

import { useState, useEffect } from 'react';
import { Bell, MessageCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificacionesVendedora() {
  const router = useRouter();
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [sinLeer, setSinLeer] = useState(0);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  useEffect(() => {
    cargarNotificaciones();
    
    const interval = setInterval(cargarNotificaciones, 10000);
    return () => clearInterval(interval);
  }, []);

  const cargarNotificaciones = async () => {
    try {
      const res = await fetch('/api/notificaciones/vendedora');
      if (!res.ok) return;
      
      const data = await res.json();
      if (data.notificaciones) {
        setNotificaciones(data.notificaciones);
        const count = data.notificaciones.filter((n: any) => !n.leida).length;
        setSinLeer(count);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  const marcarComoLeida = async (notifId: string) => {
    try {
      const res = await fetch(`/api/notificaciones/${notifId}`, {
        method: 'PATCH'
      });

      if (res.ok) {
        // Actualizar local
        setNotificaciones(prev => 
          prev.map(n => n.id === notifId ? { ...n, leida: true } : n)
        );
        setSinLeer(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marcando notificación:', error);
    }
  };

  const manejarClick = async (notif: any) => {
    // Marcar como leída
    if (!notif.leida) {
      await marcarComoLeida(notif.id);
    }
    
    // Cerrar dropdown
    setMostrarDropdown(false);
    
    // Navegar
    if (notif.tipo === 'mensaje_revendedora') {
      try {
        const metadata = JSON.parse(notif.metadata || '{}');
        const consolidacionId = metadata.consolidacionId;
        
        if (consolidacionId) {
          const res = await fetch(`/api/consolidaciones/${consolidacionId}/access-token`, {
            method: 'POST'
          });
          const data = await res.json();
          
          if (data.token) {
            router.push(`/armar-consolidacion/${data.token}`);
          }
        }
      } catch (error) {
        console.error('Error navegando:', error);
      }
    }
  };

  const eliminarNotificacion = async (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await fetch(`/api/notificaciones/${notifId}`, {
        method: 'DELETE'
      });
      
      setNotificaciones(prev => prev.filter(n => n.id !== notifId));
      if (!notificaciones.find(n => n.id === notifId)?.leida) {
        setSinLeer(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error eliminando notificación:', error);
    }
  };

  return (
    <div className="relative z-50">
      {/* Botón de campana */}
      <button
        onClick={() => setMostrarDropdown(!mostrarDropdown)}
        className="relative p-2 hover:bg-pink-100 rounded-full transition-colors"
      >
        <Bell size={24} className="text-gray-700" />
        
        {/* Badge de contador */}
        {sinLeer > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {sinLeer > 9 ? '9+' : sinLeer}
          </div>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {mostrarDropdown && (
        <>
          {/* Overlay para cerrar al hacer click afuera */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setMostrarDropdown(false)}
          />
          
          {/* Dropdown - z-index MUY alto para estar sobre todo */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-[9999] max-h-[500px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-pink-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                {sinLeer > 0 && (
                  <span className="text-sm text-pink-600 font-medium">
                    {sinLeer} sin leer
                  </span>
                )}
              </div>
            </div>

            {/* Lista de notificaciones */}
            <div className="overflow-y-auto flex-1">
              {notificaciones.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                notificaciones.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => manejarClick(notif)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notif.leida ? 'bg-pink-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icono */}
                      <div className={`p-2 rounded-full ${
                        !notif.leida ? 'bg-pink-100' : 'bg-gray-100'
                      }`}>
                        <MessageCircle size={20} className={
                          !notif.leida ? 'text-pink-600' : 'text-gray-600'
                        } />
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium ${
                            !notif.leida ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {notif.titulo}
                          </h4>
                          
                          {/* Botón eliminar */}
                          <button
                            onClick={(e) => eliminarNotificacion(notif.id, e)}
                            className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {notif.mensaje}
                        </p>
                        
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notif.createdAt).toLocaleString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {/* Punto de no leído */}
                      {!notif.leida && (
                        <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
