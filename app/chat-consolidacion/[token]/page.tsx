'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MessageCircle, Send, User, Package, Calendar, Loader2, AlertCircle } from 'lucide-react';
import BackToHomeButton from '@/components/BackToHomeButton';

export default function ChatConsolidacionPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [consolidacion, setConsolidacion] = useState<any>(null);
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = (globalThis as any).localStorage?.getItem('user');
    if (userData) {
      const u = JSON.parse(userData);
      setUser(u);
      console.log('👤 Usuario:', u.name, 'Rol:', u.rol);
      
      if (u.rol !== 'revendedora') {
        ((globalThis as any).alert)?.('❌ Esta página es solo para revendedoras');
        router.push('/dashboard');
        return;
      }
    } else {
      router.push('/login');
      return;
    }

    cargarDatos();
    
    const interval = setInterval(cargarMensajes, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📡 Cargando consolidación con token:', token.substring(0, 20) + '...');
      
      const resConsolidacion = await fetch(`/api/armar-consolidacion/${token}`);
      console.log('📡 Respuesta:', resConsolidacion.status, resConsolidacion.statusText);
      
      if (!resConsolidacion.ok) {
        const errorText = await resConsolidacion.text();
        console.error('❌ Error:', errorText);
        throw new Error(`Error ${resConsolidacion.status}: ${errorText}`);
      }
      
      const dataConsolidacion = await resConsolidacion.json() as any;
      console.log('✅ Datos recibidos:', dataConsolidacion);
      
      if (!dataConsolidacion.consolidacion) {
        throw new Error('No se recibieron datos de consolidación');
      }
      
      setConsolidacion(dataConsolidacion.consolidacion);
      console.log('✅ Consolidación cargada:', dataConsolidacion.consolidacion.id);

      await cargarMensajes();
    } catch (error: any) {
      console.error('❌ Error cargando datos:', error);
      setError(error.message || 'Error al cargar el chat');
    } finally {
      setLoading(false);
    }
  };

  const cargarMensajes = async () => {
    try {
      console.log('📬 Cargando mensajes...');
      const res = await fetch(`/api/armar-consolidacion/${token}/mensajes`);
      
      if (res.ok) {
        const data = await res.json() as any;
        console.log('✅ Mensajes cargados:', data.mensajes?.length || 0);
        setMensajes(data.mensajes || []);
      } else {
        console.error('❌ Error cargando mensajes:', res.status);
      }
    } catch (error) {
      console.error('❌ Error cargando mensajes:', error);
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !user) return;

    try {
      setEnviando(true);
      console.log('📤 Enviando mensaje...');

      const res = await fetch(`/api/armar-consolidacion/${token}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: nuevoMensaje.trim(),
          autorId: user.id,
          autorNombre: user.name,
          autorTipo: 'revendedora'
        })
      });

      if (res.ok) {
        console.log('✅ Mensaje enviado');
        setNuevoMensaje('');
        await cargarMensajes();
      } else {
        const errorData = await res.json() as any;
        console.error('❌ Error enviando:', errorData);
        ((globalThis as any).alert)?.('Error al enviar mensaje: ' + (errorData.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      ((globalThis as any).alert)?.('Error al enviar mensaje');
    } finally {
      setEnviando(false);
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
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-gray-600">Cargando chat...</p>
          <p className="text-xs text-gray-500 mt-2">Token: {token.substring(0, 20)}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full">
          <BackToHomeButton />
          <div className="bg-white rounded-lg shadow-lg p-8 text-center mt-4">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error al cargar el chat</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={cargarDatos}
              className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600"
            >
              Reintentar
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="ml-3 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!consolidacion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Consolidación no encontrada</p>
        </div>
      </div>
    );
  }

  // Parsear pedidoIds de forma segura
  let pedidoIds: any[] = [];
  try {
    if (consolidacion.pedidoIds) {
      pedidoIds = typeof consolidacion.pedidoIds === 'string' 
        ? JSON.parse(consolidacion.pedidoIds) 
        : (Array.isArray(consolidacion.pedidoIds) ? consolidacion.pedidoIds : []);
    }
  } catch (error) {
    console.error('Error parseando pedidoIds:', error);
    pedidoIds = [];
  }

  const chatCerrado = consolidacion.estado === 'completado' || consolidacion.cerrado;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <BackToHomeButton />

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle size={32} className="text-pink-500" />
            <div>
              <h1 className="text-2xl font-bold">Chat con Nadin</h1>
              <p className="text-gray-600">Consolidación #{consolidacion.id?.slice(-8) || 'N/A'}</p>
            </div>
          </div>

          {/* Info de la consolidación */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Package size={20} className="text-gray-600" />
              <div>
                <div className="text-sm text-gray-600">Pedidos</div>
                <div className="font-semibold">{pedidoIds.length || 0}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-gray-600" />
              <div>
                <div className="text-sm text-gray-600">Enviado</div>
                <div className="font-semibold">
                  {consolidacion.enviadoAt 
                    ? new Date(consolidacion.enviadoAt).toLocaleDateString('es-AR')
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User size={20} className="text-gray-600" />
              <div>
                <div className="text-sm text-gray-600">Estado</div>
                <div className="font-semibold capitalize">{consolidacion.estado || 'N/A'}</div>
              </div>
            </div>
          </div>

          {chatCerrado && (
            <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg text-center">
              <p className="text-gray-700 font-medium">
                🔒 Este chat está cerrado porque el pedido fue completado
              </p>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="bg-white rounded-lg shadow-lg">
          {/* Mensajes */}
          <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
            {mensajes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>No hay mensajes aún</p>
                <p className="text-sm">Escribí un mensaje para empezar la conversación</p>
              </div>
            ) : (
              mensajes.map((msg: any) => {
                const esMio = msg.autorTipo === 'revendedora';
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        esMio
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{msg.autorNombre}</span>
                        {msg.autorTipo === 'vendedora' && (
                          <span className="text-xs opacity-75">👑 Nadin</span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{msg.mensaje}</p>
                      <p className={`text-xs mt-2 ${esMio ? 'opacity-75' : 'text-gray-500'}`}>
                        {new Date(msg.createdAt).toLocaleDateString('es-AR')} - 
                        {new Date(msg.createdAt).toLocaleTimeString('es-AR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input de mensaje */}
          {!chatCerrado && (
            <div className="border-t p-4">
              <div className="flex gap-3">
                <textarea
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje((e.target as any).value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribí tu mensaje... (Enter para enviar)"
                  disabled={enviando}
                  className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none disabled:bg-gray-100"
                  rows={3}
                />
                <button
                  onClick={enviarMensaje}
                  disabled={enviando || !nuevoMensaje.trim()}
                  className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 h-fit"
                >
                  {enviando ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
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
                Presioná Enter para enviar o Shift+Enter para nueva línea
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
