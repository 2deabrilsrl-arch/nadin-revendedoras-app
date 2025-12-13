// ADMIN: BACKUP DE CONVERSACIONES
// Ubicacion: app/admin/conversaciones/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Archive, MessageCircle, Lock, Search } from 'lucide-react';

export default function ConversacionesPage() {
  const [loading, setLoading] = useState(true);
  const [conversaciones, setConversaciones] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [conversacionAbierta, setConversacionAbierta] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<any[]>([]);

  useEffect(() => {
    cargarConversaciones();
  }, []);

  const cargarConversaciones = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/conversaciones');
      const data = await res.json();
      setConversaciones((data as any).conversaciones || []);
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirConversacion = async (consolidacionId: string) => {
    if (conversacionAbierta === consolidacionId) {
      setConversacionAbierta(null);
      setMensajes([]);
      return;
    }

    try {
      const res = await fetch(`/api/consolidaciones/${consolidacionId}/mensajes`);
      const data = await res.json();
      setMensajes((data as any).mensajes || []);
      setConversacionAbierta(consolidacionId);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const conversacionesFiltradas = conversaciones.filter(c => {
    if (!busqueda) return true;
    const searchLower = busqueda.toLowerCase();
    return (
      c.user?.name?.toLowerCase().includes(searchLower) ||
      c.user?.handle?.toLowerCase().includes(searchLower) ||
      c.id.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-gray-600">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-2">
          <Archive size={32} className="text-pink-500" />
          <h1 className="text-2xl font-bold">Backup de Conversaciones</h1>
        </div>
        <p className="text-gray-600">
          Historial completo de chats con revendedoras (incluyendo conversaciones cerradas)
        </p>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, handle o ID..."
            value={busqueda}
            onChange={(e) => setBusqueda((e.target as any).value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      </div>

      {/* Estadística */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <MessageCircle size={24} className="text-gray-600" />
          <div>
            <div className="text-2xl font-bold text-gray-700">{conversaciones.length}</div>
            <div className="text-sm text-gray-600">Conversaciones archivadas</div>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-lg shadow">
        {conversacionesFiltradas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Archive size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold">No hay conversaciones</p>
            <p className="text-sm">Las conversaciones aparecerán aquí cuando se completen pedidos</p>
          </div>
        ) : (
          <div className="divide-y">
            {conversacionesFiltradas.map((conversacion: any) => {
              const pedidoIds = JSON.parse(conversacion.pedidoIds);
              const estaAbierta = conversacionAbierta === conversacion.id;

              return (
                <div key={conversacion.id} className="p-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                    onClick={() => abrirConversacion(conversacion.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{conversacion.user?.name || 'Usuario'}</h3>
                        <span className="text-sm text-gray-500">@{conversacion.user?.handle}</span>
                        {conversacion.cerrado && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 flex items-center gap-1">
                            <Lock size={12} />
                            Cerrado
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {/* ✅ CORREGIDO: conversacion.id en vez de consolidacion.id */}
                        <span>Consolidación: {conversacion.id.slice(0, 8)}</span> | 
                        <span> Pedidos: {pedidoIds.length}</span> | 
                        <span> Enviado: {new Date(conversacion.enviadoAt).toLocaleDateString('es-AR')}</span>
                        {conversacion.completadoEn && (
                          <span> | Completado: {new Date(conversacion.completadoEn).toLocaleDateString('es-AR')}</span>
                        )}
                      </div>
                    </div>

                    <button className="text-pink-500 hover:text-pink-600 px-4 py-2">
                      {estaAbierta ? '▼ Ocultar' : '▶ Ver chat'}
                    </button>
                  </div>

                  {/* Mensajes */}
                  {estaAbierta && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      {mensajes.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm py-8">
                          No hay mensajes en esta conversación
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {mensajes.map((msg: any) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.autorTipo === 'vendedora' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  msg.autorTipo === 'vendedora'
                                    ? 'bg-pink-500 text-white'
                                    : 'bg-white border text-gray-800'
                                }`}
                              >
                                <p className="text-xs opacity-75 mb-1">{msg.autorNombre}</p>
                                <p className="text-sm whitespace-pre-wrap">{msg.mensaje}</p>
                                <p className="text-xs opacity-75 mt-1">
                                  {new Date(msg.createdAt).toLocaleDateString('es-AR')} - 
                                  {new Date(msg.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
