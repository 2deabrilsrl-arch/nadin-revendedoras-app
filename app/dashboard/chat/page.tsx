// PÁGINA: CHAT SEPARADO PARA REVENDEDORA - CORREGIDO SIN USESESSION
// Ubicacion: app/dashboard/chat/page.tsx
// CORRECCION: Usa localStorage en vez de useSession (como el resto de la app)

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageCircle, Send, Home } from 'lucide-react';

interface Consolidacion {
  id: string;
  enviadoAt: string;
  estado: string;
  armadoEn: string | null;
  pagadoEn: string | null;
  completadoEn: string | null;
}

interface Mensaje {
  id: string;
  mensaje: string;
  autorNombre: string;
  autorTipo: 'revendedora' | 'vendedora';
  createdAt: string;
  leido: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  rol?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const consolidacionIdParam = searchParams.get('id');
  
  const [user, setUser] = useState<User | null>(null);
  const [consolidaciones, setConsolidaciones] = useState<Consolidacion[]>([]);
  const [consolidacionSeleccionada, setConsolidacionSeleccionada] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [chatCerrado, setChatCerrado] = useState(false);
  const mensajesEndRef = useRef<HTMLDivElement>(null);

  // ✅ CORREGIDO: Obtener usuario de localStorage
  useEffect(() => {
    const userData = (globalThis as any).localStorage?.getItem('user');
    if (userData) {
      const u = JSON.parse(userData);
      setUser(u);
      
      // Si es vendedora, redirigir
      if (u.rol === 'vendedora') {
        router.push('/admin/dashboard');
        return;
      }
    } else {
      router.push('/login');
      return;
    }
  }, [router]);

  // Cargar consolidaciones cuando hay usuario
  useEffect(() => {
    if (user?.id) {
      cargarConsolidaciones();
    }
  }, [user]);

  // Si viene con ?id=X, seleccionarla automáticamente
  useEffect(() => {
    if (consolidacionIdParam && consolidaciones.length > 0) {
      const existe = consolidaciones.find(c => c.id === consolidacionIdParam);
      if (existe) {
        setConsolidacionSeleccionada(consolidacionIdParam);
      }
    }
  }, [consolidacionIdParam, consolidaciones]);

  // Cargar mensajes cuando se selecciona una consolidación
  useEffect(() => {
    if (consolidacionSeleccionada) {
      cargarMensajes();
      const interval = setInterval(cargarMensajes, 5000);
      return () => clearInterval(interval);
    }
  }, [consolidacionSeleccionada]);

  // Auto-scroll
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const cargarConsolidaciones = async () => {
    if (!user?.id) return;
    
    try {
      const res = await fetch(`/api/consolidaciones?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setConsolidaciones(data.consolidaciones);
      }
    } catch (error) {
      console.error('Error cargando consolidaciones:', error);
    }
  };

  const cargarMensajes = async () => {
    if (!consolidacionSeleccionada) return;

    try {
      const res = await fetch(`/api/consolidaciones/${consolidacionSeleccionada}/mensajes`);
      const data = await res.json();
      
      if (data.success) {
        setMensajes(data.mensajes);
        
        // Verificar si el chat está cerrado
        const consol = consolidaciones.find(c => c.id === consolidacionSeleccionada);
        const cerrado = consol?.armadoEn && consol?.pagadoEn && consol?.completadoEn;
        setChatCerrado(!!cerrado);
        
        // Marcar mensajes como leídos
        await fetch(`/api/consolidaciones/${consolidacionSeleccionada}/mensajes`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ autorTipo: 'revendedora' })
        });
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !consolidacionSeleccionada || enviando || chatCerrado || !user) return;

    setEnviando(true);
    try {
      const res = await fetch(`/api/consolidaciones/${consolidacionSeleccionada}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: nuevoMensaje,
          autorId: user.id,
          autorNombre: user.name || 'Revendedora',
          autorTipo: 'revendedora'
        })
      });

      if (res.ok) {
        setNuevoMensaje('');
        await cargarMensajes();
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Botón Volver */}
        <div className="mb-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
          >
            <Home size={20} />
            <span className="font-medium">Volver al Inicio</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
          <div className="flex h-full">
            {/* Sidebar: Lista de consolidaciones */}
            <div className="w-80 border-r border-gray-200 flex flex-col">
              <div className="p-4 bg-pink-600 text-white">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MessageCircle size={24} />
                  Mis Consolidaciones
                </h2>
                <p className="text-sm text-pink-100 mt-1">
                  Seleccioná una para ver el chat
                </p>
              </div>

              <div className="flex-1 overflow-y-auto">
                {consolidaciones.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p>No tenés consolidaciones</p>
                  </div>
                ) : (
                  consolidaciones.map((consol) => {
                    const chatCerrado = consol.armadoEn && consol.pagadoEn && consol.completadoEn;
                    
                    return (
                      <div
                        key={consol.id}
                        onClick={() => setConsolidacionSeleccionada(consol.id)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          consolidacionSeleccionada === consol.id ? 'bg-pink-50 border-l-4 border-l-pink-600' : ''
                        }`}
                      >
                        <div className="font-semibold text-gray-900">
                          Consolidación #{consol.id.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {new Date(consol.enviadoAt).toLocaleDateString('es-AR')}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {consol.armadoEn && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✓ Armado</span>
                          )}
                          {chatCerrado && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">🔒 Cerrado</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col">
              {!consolidacionSeleccionada ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle size={64} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Seleccioná una consolidación para ver el chat</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">
                      Chat - Consolidación #{consolidacionSeleccionada.slice(-8)}
                    </h3>
                    {chatCerrado && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        🔒 Chat cerrado - Pedido completado
                      </p>
                    )}
                  </div>

                  {/* Mensajes */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {mensajes.map((msg) => {
                      const esMio = msg.autorTipo === 'revendedora';
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${esMio ? 'order-2' : 'order-1'}`}>
                            <div className={`rounded-lg p-3 ${
                              esMio 
                                ? 'bg-pink-600 text-white' 
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <p className="text-sm font-medium mb-1">
                                {msg.autorNombre}
                              </p>
                              <p className="whitespace-pre-wrap">{msg.mensaje}</p>
                              <p className={`text-xs mt-2 ${
                                esMio ? 'text-pink-100' : 'text-gray-500'
                              }`}>
                                {new Date(msg.createdAt).toLocaleString('es-AR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={mensajesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    {chatCerrado ? (
                      <div className="text-center text-gray-500 py-2">
                        🔒 Chat cerrado - Pedido completado
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <textarea
                          value={nuevoMensaje}
                          onChange={(e) => setNuevoMensaje(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Escribí tu mensaje... [Enter para enviar]"
                          disabled={enviando}
                          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                          rows={2}
                        />
                        <button
                          onClick={enviarMensaje}
                          disabled={enviando || !nuevoMensaje.trim()}
                          className="bg-pink-600 text-white px-6 rounded-lg hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          <Send size={20} />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Se actualiza automáticamente cada 5 segundos
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
