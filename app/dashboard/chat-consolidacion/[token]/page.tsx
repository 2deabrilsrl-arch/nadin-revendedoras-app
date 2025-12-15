// CHAT CONSOLIDACIÓN - SOLO PARA REVENDEDORA
// Ubicación: app/dashboard/chat-consolidacion/[token]/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MessageCircle, Send, ArrowLeft, AlertCircle, Package, DollarSign } from 'lucide-react';

export default function ChatConsolidacionPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [consolidacion, setConsolidacion] = useState<any>(null);
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = (globalThis as any).localStorage?.getItem('user');
    if (userData) {
      const u = JSON.parse(userData);
      setUser(u);
      console.log('👤 Usuario:', u.name, 'Rol:', u.rol);
    } else {
      (globalThis as any).window?.location?.assign('/login');
      return;
    }

    cargarConsolidacion();
    cargarMensajes();

    const interval = setInterval(cargarMensajes, 10000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const scrollToBottom = () => {
    ((messagesEndRef.current as any))?.scrollIntoView({ behavior: 'smooth' });
  };

  const cargarConsolidacion = async () => {
    try {
      const res = await fetch(`/api/armar-consolidacion/${token}`);
      const data = await res.json() as any;

      if (data.consolidacion) {
        setConsolidacion(data.consolidacion);
        console.log('📦 Consolidación cargada:', data.consolidacion.id);
      }
    } catch (error) {
      console.error('Error cargando consolidación:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarMensajes = async () => {
    try {
      const res = await fetch(`/api/armar-consolidacion/${token}/mensajes`);
      const data = await res.json() as any;

      if (data.mensajes) {
        setMensajes(data.mensajes);

        // Marcar como leídos los mensajes de la vendedora
        const sinLeer = data.mensajes.filter(
          (m: any) => !m.leido && m.autorTipo === 'vendedora'
        );

        if (sinLeer.length > 0) {
          await fetch(`/api/armar-consolidacion/${token}/mensajes`, {
            method: 'PATCH'
          });
        }
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return;

    setEnviandoMensaje(true);

    try {
      const res = await fetch(`/api/armar-consolidacion/${token}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: nuevoMensaje,
          autorTipo: 'revendedora',
          autorNombre: user?.name || 'Revendedora'
        })
      });

      if (!res.ok) throw new Error('Error enviando mensaje');

      setNuevoMensaje('');
      await cargarMensajes();

    } catch (error) {
      console.error('Error enviando mensaje:', error);
      ((globalThis as any).alert)?.('Error al enviar el mensaje');
    } finally {
      setEnviandoMensaje(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!consolidacion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Consolidación no encontrada</h1>
          <p className="text-gray-600 mt-2">El enlace puede estar vencido o ser inválido</p>
          <button
            onClick={() => router.push('/dashboard/notificaciones')}
            className="mt-6 bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600"
          >
            Volver a Notificaciones
          </button>
        </div>
      </div>
    );
  }

  // 🔥 Verificar si está completado/cancelado
  const estaCompletado = consolidacion.cerrado || consolidacion.estado === 'completado';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Botón Volver */}
        <button
          onClick={() => router.push('/dashboard/notificaciones')}
          className="mb-6 flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Volver a Notificaciones</span>
        </button>

        {/* Header - Info Consolidación */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Consolidación #{consolidacion.id.slice(-8)}
              </h1>
              <p className="text-gray-600">
                Chat con <span className="font-medium">Nadin Lencería</span>
              </p>
            </div>

            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
              estaCompletado
                ? 'bg-green-100 text-green-700'
                : consolidacion.estado === 'armado'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {estaCompletado ? '✅ Completado' : consolidacion.estado === 'armado' ? '📦 Armado' : '⏳ Pendiente'}
            </div>
          </div>

          {/* Resumen rápido */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <DollarSign size={20} className="text-pink-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Monto Total</div>
                <div className="text-lg font-bold text-gray-900">
                  ${consolidacion.totalMayorista?.toLocaleString('es-AR') || '0'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Pedidos</div>
                <div className="text-lg font-bold text-gray-900">
                  {consolidacion.pedidos?.length || JSON.parse(consolidacion.pedidoIds || '[]').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col" style={{ height: '600px' }}>
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-4">
            <div className="flex items-center gap-3">
              <MessageCircle size={24} />
              <div>
                <h2 className="font-bold">Conversación</h2>
                <p className="text-sm text-pink-100">
                  {mensajes.length} mensaje(s)
                </p>
              </div>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mensajes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
                <p>No hay mensajes aún</p>
                <p className="text-sm mt-2">Escribe un mensaje para comenzar la conversación</p>
              </div>
            ) : (
              mensajes.map((mensaje: any) => {
                const esPropio = mensaje.autorTipo === 'revendedora';
                
                return (
                  <div
                    key={mensaje.id}
                    className={`flex ${esPropio ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        esPropio
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {mensaje.autorNombre}
                        </span>
                        <span className={`text-xs ${esPropio ? 'text-pink-200' : 'text-gray-500'}`}>
                          {new Date(mensaje.createdAt).toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words">{mensaje.mensaje}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de mensaje O aviso de completado */}
          {estaCompletado ? (
            <div className="bg-gray-100 border-t p-6 text-center">
              <AlertCircle size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-700 font-medium mb-2">
                Esta consolidación está completada
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Para consultas adicionales, contactanos por email:
              </p>
              <a
                href="mailto:nadinlenceria@gmail.com"
                className="inline-flex items-center gap-2 bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 font-semibold"
              >
                📧 nadinlenceria@gmail.com
              </a>
            </div>
          ) : (
            <div className="bg-gray-50 border-t p-4">
              <div className="flex gap-2">
                <textarea
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje((e.target as any).value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                  rows={2}
                  disabled={enviandoMensaje}
                />
                <button
                  onClick={enviarMensaje}
                  disabled={!nuevoMensaje.trim() || enviandoMensaje}
                  className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
                >
                  {enviandoMensaje ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Enviar
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Presiona Enter para enviar, Shift+Enter para nueva línea
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
