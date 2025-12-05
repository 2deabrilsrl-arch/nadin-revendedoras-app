// 📦 PÁGINA: ARMAR PEDIDO CON TOKEN MÁGICO + CHAT
// Ubicación: app/armar/[token]/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Check, X, AlertTriangle, Send, MessageCircle } from 'lucide-react';

export default function ArmarPedidoMagicoPage({ params }: any) {
  const [pedido, setPedido] = useState<any>(null);
  const [revendedora, setRevendedora] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [estadoProductos, setEstadoProductos] = useState<any>({});
  const [error, setError] = useState<string>('');
  
  // Chat
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const mensajesEndRef = useRef<any>(null);

  useEffect(() => {
    cargarPedido();
    // Actualizar mensajes cada 10 segundos
    const interval = setInterval(cargarMensajes, 10000);
    return () => clearInterval(interval);
  }, [params.token]);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const scrollToBottom = () => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const cargarPedido = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/armar/${params.token}`);
      const data: any = await res.json();

      if (!data.success) {
        setError(data.error || 'Token inválido');
        return;
      }

      setPedido(data.pedido);
      setRevendedora(data.revendedora);
      setMensajes(data.pedido.mensajes || []);

      // Inicializar estado de productos
      const inicial: any = {};
      data.pedido.lineas?.forEach((prod: any) => {
        inicial[prod.id] = {
          estado: data.pedido.estado === 'armado' ? 'armado' : null,
          cantidadReal: prod.qty
        };
      });
      setEstadoProductos(inicial);

    } catch (error) {
      console.error('Error cargando pedido:', error);
      setError('Error al cargar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const cargarMensajes = async () => {
    if (!pedido) return;
    
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}/mensajes`);
      const data: any = await res.json();
      setMensajes(data);
      
      // Marcar como leídos
      await fetch(`/api/pedidos/${pedido.id}/mensajes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autorTipo: 'vendedora' })
      });
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return;

    setEnviandoMensaje(true);
    try {
      await fetch(`/api/pedidos/${pedido.id}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autorId: 'nadin-vendedora',
          autorNombre: 'Nadin',
          autorTipo: 'vendedora',
          mensaje: nuevoMensaje
        })
      });

      setNuevoMensaje('');
      await cargarMensajes();
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      (globalThis as any).alert('Error al enviar mensaje');
    } finally {
      setEnviandoMensaje(false);
    }
  };

  const marcarProducto = (productoId: string, estado: 'armado' | 'faltante' | 'parcial', cantidadReal?: number) => {
    setEstadoProductos((prev: any) => ({
      ...prev,
      [productoId]: {
        estado,
        cantidadReal: cantidadReal !== undefined ? cantidadReal : prev[productoId]?.cantidadReal
      }
    }));
  };

  const finalizarArmado = async () => {
    const productosSinMarcar = pedido.lineas.filter(
      (p: any) => !estadoProductos[p.id]?.estado
    );

    if (productosSinMarcar.length > 0) {
      (globalThis as any).alert(`Faltan marcar ${productosSinMarcar.length} productos. Marcá todos antes de finalizar.`);
      return;
    }

    const confirmar = (globalThis as any).confirm(
      '¿Confirmar finalización del armado? Esto actualizará el pedido y notificará a la revendedora.'
    );

    if (!confirmar) return;

    try {
      setGuardando(true);

      const productosArmados: any[] = [];
      const productosFaltantes: any[] = [];
      const productosParciales: any[] = [];

      pedido.lineas.forEach((prod: any) => {
        const estado = estadoProductos[prod.id];

        if (estado?.estado === 'armado') {
          productosArmados.push(prod);
        } else if (estado?.estado === 'faltante') {
          productosFaltantes.push(prod);
        } else if (estado?.estado === 'parcial') {
          productosParciales.push({
            ...prod,
            cantidadOriginal: prod.qty,
            cantidadReal: estado.cantidadReal
          });
        }
      });

      const response = await fetch('/api/admin/pedidos/finalizar-armado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedidoId: pedido.id,
          productosArmados,
          productosFaltantes,
          productosParciales
        })
      });

      if (!response.ok) {
        throw new Error('Error al finalizar armado');
      }

      (globalThis as any).alert('✅ Pedido armado exitosamente!\n\nSe notificó a la revendedora.');
      
      // Recargar
      await cargarPedido();

    } catch (error) {
      console.error('Error finalizando armado:', error);
      (globalThis as any).alert('❌ Error al finalizar el armado. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const getResumen = () => {
    let armados = 0;
    let faltantes = 0;
    let parciales = 0;
    let sinMarcar = 0;

    pedido?.lineas.forEach((prod: any) => {
      const estado = estadoProductos[prod.id]?.estado;
      if (estado === 'armado') armados++;
      else if (estado === 'faltante') faltantes++;
      else if (estado === 'parcial') parciales++;
      else sinMarcar++;
    });

    return { armados, faltantes, parciales, sinMarcar };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 mt-12">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-red-800 mb-2">
            {error === 'Token expirado' ? '⏰ Link Expirado' : '❌ Error'}
          </h2>
          <p className="text-red-600 mb-4">
            {error === 'Token expirado' 
              ? 'Este link ya no es válido. Pedí uno nuevo a la revendedora.'
              : error
            }
          </p>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-center text-gray-600">Pedido no encontrado</p>
      </div>
    );
  }

  const resumen = getResumen();
  const todosMarcados = resumen.sinMarcar === 0;
  const mensajesNoLeidos = mensajes.filter((m: any) => !m.leido && m.autorTipo === 'revendedora').length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-nadin-pink to-pink-400 text-white rounded-lg p-6 shadow-lg">
            <h1 className="text-2xl font-bold mb-2">
              📦 Armando Pedido de {revendedora?.name || 'Revendedora'}
            </h1>
            <p className="text-pink-100">
              Cliente: {pedido.cliente} | Tel: {pedido.telefono || 'N/A'}
            </p>
            <p className="text-sm text-pink-100 mt-2">
              Creado: {new Date(pedido.createdAt).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMNA IZQUIERDA: Productos */}
          <div className="lg:col-span-2 space-y-4">
            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white border-2 border-green-200 rounded-lg p-3 text-center">
                <p className="text-xs text-green-700 font-medium mb-1">Armados</p>
                <p className="text-2xl font-bold text-green-900">{resumen.armados}</p>
              </div>
              <div className="bg-white border-2 border-red-200 rounded-lg p-3 text-center">
                <p className="text-xs text-red-700 font-medium mb-1">Faltantes</p>
                <p className="text-2xl font-bold text-red-900">{resumen.faltantes}</p>
              </div>
              <div className="bg-white border-2 border-yellow-200 rounded-lg p-3 text-center">
                <p className="text-xs text-yellow-700 font-medium mb-1">Parciales</p>
                <p className="text-2xl font-bold text-yellow-900">{resumen.parciales}</p>
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-700 font-medium mb-1">Sin Marcar</p>
                <p className="text-2xl font-bold text-gray-900">{resumen.sinMarcar}</p>
              </div>
            </div>

            {/* Lista de productos */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-gray-900">
                Productos ({pedido.lineas?.length || 0})
              </h2>

              {pedido.lineas?.map((producto: any) => {
                const estado = estadoProductos[producto.id];
                const esParcial = estado?.estado === 'parcial';

                return (
                  <div
                    key={producto.id}
                    className={`bg-white border-2 rounded-lg p-4 transition-all ${
                      estado?.estado === 'armado'
                        ? 'border-green-300 bg-green-50'
                        : estado?.estado === 'faltante'
                        ? 'border-red-300 bg-red-50'
                        : estado?.estado === 'parcial'
                        ? 'border-yellow-300 bg-yellow-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{producto.name}</h3>
                        <p className="text-sm text-gray-600">
                          {[producto.talle, producto.color].filter(Boolean).join(' - ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          x{producto.qty}
                        </p>
                      </div>
                    </div>

                    {esParcial && (
                      <div className="mb-3 bg-yellow-100 border border-yellow-300 rounded p-3">
                        <label className="block text-sm font-medium text-yellow-900 mb-2">
                          Cantidad real:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={producto.qty}
                          value={estado.cantidadReal}
                          onChange={(e: any) => marcarProducto(
                            producto.id,
                            'parcial',
                            parseInt(e.target.value) || 0
                          )}
                          className="w-full px-3 py-2 border border-yellow-400 rounded-lg"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => marcarProducto(producto.id, 'armado', producto.qty)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          estado?.estado === 'armado'
                            ? 'bg-green-600 text-white'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        <Check size={18} />
                        Armado
                      </button>

                      <button
                        onClick={() => marcarProducto(producto.id, 'faltante')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          estado?.estado === 'faltante'
                            ? 'bg-red-600 text-white'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        <X size={18} />
                        No Hay
                      </button>

                      <button
                        onClick={() => marcarProducto(producto.id, 'parcial', Math.floor(producto.qty / 2))}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          estado?.estado === 'parcial'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                      >
                        <AlertTriangle size={18} />
                        Parcial
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMNA DERECHA: Chat */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg sticky top-6">
              {/* Header Chat */}
              <div 
                className="bg-nadin-pink text-white p-4 rounded-t-lg cursor-pointer flex items-center justify-between"
                onClick={() => setShowChat(!showChat)}
              >
                <div className="flex items-center gap-2">
                  <MessageCircle size={20} />
                  <h3 className="font-bold">Chat con {revendedora?.name}</h3>
                  {mensajesNoLeidos > 0 && (
                    <span className="bg-white text-nadin-pink text-xs font-bold px-2 py-1 rounded-full">
                      {mensajesNoLeidos}
                    </span>
                  )}
                </div>
              </div>

              {showChat && (
                <>
                  {/* Mensajes */}
                  <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {mensajes.length === 0 ? (
                      <p className="text-center text-gray-500 text-sm mt-8">
                        No hay mensajes todavía
                      </p>
                    ) : (
                      mensajes.map((msg: any) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.autorTipo === 'vendedora' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.autorTipo === 'vendedora'
                                ? 'bg-nadin-pink text-white'
                                : 'bg-white border border-gray-200'
                            }`}
                          >
                            <p className="text-xs font-medium mb-1 opacity-75">
                              {msg.autorNombre}
                            </p>
                            <p className="text-sm">{msg.mensaje}</p>
                            <p className="text-xs mt-1 opacity-50">
                              {new Date(msg.createdAt).toLocaleTimeString('es-AR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={mensajesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={nuevoMensaje}
                        onChange={(e: any) => setNuevoMensaje(e.target.value)}
                        onKeyPress={(e: any) => {
                          if (e.key === 'Enter' && !enviandoMensaje) {
                            enviarMensaje();
                          }
                        }}
                        placeholder="Escribir mensaje..."
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-nadin-pink"
                        disabled={enviandoMensaje}
                      />
                      <button
                        onClick={enviarMensaje}
                        disabled={enviandoMensaje || !nuevoMensaje.trim()}
                        className="bg-nadin-pink text-white p-2 rounded-lg hover:bg-nadin-pink-dark disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Botón flotante */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              {todosMarcados ? '✅ Todos marcados' : `⚠️ Faltan ${resumen.sinMarcar}`}
            </p>
            {resumen.faltantes > 0 && (
              <p className="text-sm text-red-600 font-medium">
                {resumen.faltantes} sin stock
              </p>
            )}
          </div>

          <button
            onClick={finalizarArmado}
            disabled={!todosMarcados || guardando}
            className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold transition-all ${
              todosMarcados && !guardando
                ? 'bg-nadin-pink hover:bg-nadin-pink-dark text-white shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {guardando ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save size={20} />
                Finalizar Armado
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
