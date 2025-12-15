'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, MessageCircle, CheckCheck } from 'lucide-react';
import BackToHomeButton from '@/components/BackToHomeButton';

export default function NotificacionesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [marcandoTodas, setMarcandoTodas] = useState(false);

  useEffect(() => {
    const userData = (globalThis as any).localStorage?.getItem('user');
    if (userData) {
      const u = JSON.parse(userData);
      setUser(u);
      console.log('👤 Usuario cargado:', u.name, 'Rol:', u.rol);
      cargarNotificaciones(u.id);
    } else {
      (globalThis as any).window?.location?.assign('/login');
    }
  }, []);

  const cargarNotificaciones = async (userId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/notificaciones?userId=${userId}`);
      const data = await res.json() as any;
      setNotificaciones(data.notificaciones || []);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeida = async (notificacionId: string) => {
    try {
      const res = await fetch(`/api/notificaciones/${notificacionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leida: true })
      });

      if (res.ok) {
        setNotificaciones(prev =>
          prev.map(n => (n.id === notificacionId ? { ...n, leida: true } : n))
        );
      }
    } catch (error) {
      console.error('Error marcando como leída:', error);
    }
  };

  const marcarTodasComoLeidas = async () => {
    if (!user?.id) return;

    try {
      setMarcandoTodas(true);
      const res = await fetch(`/api/notificaciones`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id,
          markAllAsRead: true 
        })
      });

      if (res.ok) {
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
        await cargarNotificaciones(user.id);
      }
    } catch (error) {
      console.error('Error marcando todas:', error);
    } finally {
      setMarcandoTodas(false);
    }
  };

  // ✅ CORREGIDO: Navegación FORZADA según rol
  const irAConversacion = async (notificacion: any) => {
    const metadata = notificacion.metadata ? JSON.parse(notificacion.metadata) : {};
    const consolidacionId = metadata.consolidacionId;

    if (!consolidacionId) {
      console.log('❌ No hay consolidacionId en metadata');
      return;
    }

    console.log('📍 Navegando a chat de consolidación:', consolidacionId);
    console.log('👤 Rol del usuario:', user?.rol);

    try {
      const res = await fetch(`/api/consolidaciones/${consolidacionId}`);
      if (res.ok) {
        const data = await res.json() as any;
        const token = data.consolidacion?.accessTokens?.token;
        
        if (token) {
          // ✅ NAVEGACIÓN FORZADA POR ROL
          if (user?.rol === 'vendedora') {
            console.log('🔀 Vendedora → /armar-consolidacion/' + token);
            router.push(`/armar-consolidacion/${token}`);
          } else {
            // ✅ REVENDEDORA → SOLO CHAT
            console.log('🔀 Revendedora → /chat-consolidacion/' + token);
            router.push(`/chat-consolidacion/${token}`);
          }
        } else {
          console.error('❌ No se encontró token');
          ((globalThis as any).alert)?.('No se puede acceder al chat en este momento');
        }
      } else {
        console.error('❌ Error obteniendo consolidación');
        ((globalThis as any).alert)?.('Error al cargar el chat');
      }
    } catch (error) {
      console.error('❌ Error navegando:', error);
      ((globalThis as any).alert)?.('Error al abrir el chat');
    }
  };

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            <p className="mt-4 text-gray-600">Cargando notificaciones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <BackToHomeButton />

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell size={32} className="text-pink-500" />
            <div>
              <h1 className="text-2xl font-bold">Notificaciones</h1>
              <p className="text-gray-600">
                {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día'}
              </p>
            </div>
          </div>

          {noLeidas > 0 && (
            <button
              onClick={marcarTodasComoLeidas}
              disabled={marcandoTodas}
              className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {marcandoTodas ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Marcando...
                </>
              ) : (
                <>
                  <CheckCheck size={18} />
                  Marcar todas como leídas
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      {notificaciones.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Bell size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">No tenés notificaciones</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notificaciones.map((notif: any) => {
            const metadata = notif.metadata ? JSON.parse(notif.metadata) : {};
            const esNotificacionMensaje = notif.tipo === 'mensaje_vendedora' || metadata.consolidacionId;

            return (
              <div
                key={notif.id}
                className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all ${
                  !notif.leida ? 'border-l-4 border-pink-500' : 'opacity-75'
                }`}
                onClick={() => {
                  if (!notif.leida) marcarComoLeida(notif.id);
                  if (esNotificacionMensaje) irAConversacion(notif);
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-full ${
                      !notif.leida ? 'bg-pink-100' : 'bg-gray-100'
                    }`}
                  >
                    <MessageCircle
                      size={24}
                      className={!notif.leida ? 'text-pink-500' : 'text-gray-400'}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{notif.titulo}</h3>
                        <p className="text-gray-600 mt-1">{notif.mensaje}</p>
                      </div>

                      {!notif.leida && (
                        <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                          Nuevo
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <span>{new Date(notif.createdAt).toLocaleDateString('es-AR')}</span>
                      <span>{new Date(notif.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                      
                      {esNotificacionMensaje && (
                        <span className="text-pink-500 font-medium">
                          Click para ver chat →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
