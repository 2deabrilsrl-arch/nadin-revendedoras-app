// PAGINA: REVENDEDORA VE ESTADO DE ARMADO
// Ubicacion: app/dashboard/pedidos/[id]/armado/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MessageCircle, Send, RefreshCw, Package, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VerEstadoArmadoPage({ params }: any) {
  const router = useRouter();
  const [pedido, setPedido] = useState<any>(null);
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);
  const [user, setUser] = useState<any>(null);
  const mensajesEndRef = useRef<any>(null);

  useEffect(() => {
    const userData = (globalThis as any).localStorage?.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    cargarDatos();
    
    // Actualizar cada 5 segundos
    const interval = setInterval(cargarDatos, 5000);
    return () => clearInterval(interval);
  }, [params.id]);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const scrollToBottom = () => {
    (mensajesEndRef.current as any)?.scrollIntoView?.({ behavior: 'smooth' });
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar pedido
      const resPedido = await fetch(`/api/admin/pedidos/${params.id}`);
      const dataPedido = await resPedido.json();
      setPedido(dataPedido as any);

      // Cargar mensajes
      const resMensajes = await fetch(`/api/pedidos/${params.id}/mensajes`);
      const dataMensajes = await resMensajes.json();
      setMensajes(dataMensajes as any);

      // Marcar como leidos
      await fetch(`/api/pedidos/${params.id}/mensajes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autorTipo: 'revendedora' })
      });

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !user) return;

    setEnviandoMensaje(true);
    try {
      await fetch(`/api/pedidos/${params.id}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autorId: user.id,
          autorNombre: user.name,
          autorTipo: 'revendedora',
          mensaje: nuevoMensaje
        })
      });

      setNuevoMensaje('');
      await cargarDatos();
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      (globalThis as any).alert('Error al enviar mensaje');
    } finally {
      setEnviandoMensaje(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
      case 'enviado':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'armado':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente de armado';
      case 'enviado':
        return 'En proceso de armado';
      case 'armado':
        return 'Armado completado';
      default:
        return estado;
    }
  };

  if (loading && !pedido) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
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

  const mensajesNoLeidos = mensajes.filter((m: any) => !m.leido && m.autorTipo === 'vendedora').length;
  const productosArmados = pedido.productosArmados || 0;
  const productosFaltantes = pedido.productosFaltantes || 0;
  const productosOriginales = pedido.productosOriginales || pedido.lineas?.length || 0;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark mb-4"
        >
          <ArrowLeft size={20} />
          Volver
        </button>

        <div className={`border-2 rounded-lg p-6 ${getEstadoColor(pedido.estado)}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Pedido #{pedido.id.substring(0, 8)}
              </h1>
              <p className="text-lg font-medium">
                Cliente: {pedido.cliente}
              </p>
              {pedido.telefono && (
                <p className="text-sm">Tel: {pedido.telefono}</p>
              )}
            </div>
            <span className="text-xl font-bold">
              {getEstadoTexto(pedido.estado)}
            </span>
          </div>

          {/* Resumen de armado */}
          {pedido.estado === 'armado' && (
            <div className="bg-white bg-opacity-50 rounded-lg p-4 grid grid-cols-3 gap-4">
              <div className="text-center">
                <CheckCircle className="mx-auto mb-2 text-green-600" size={32} />
                <p className="text-sm text-gray-600">Armados</p>
                <p className="text-2xl font-bold text-green-700">{productosArmados}</p>
              </div>
              <div className="text-center">
                <XCircle className="mx-auto mb-2 text-red-600" size={32} />
                <p className="text-sm text-gray-600">Faltantes</p>
                <p className="text-2xl font-bold text-red-700">{productosFaltantes}</p>
              </div>
              <div className="text-center">
                <Package className="mx-auto mb-2 text-gray-600" size={32} />
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-700">{productosOriginales}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PRODUCTOS */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Package size={24} />
              Productos
            </h2>
            <button
              onClick={cargarDatos}
              className="text-gray-500 hover:text-gray-700"
              title="Actualizar"
            >
              <RefreshCw size={20} />
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pedido.lineas?.map((producto: any) => (
              <div
                key={producto.id}
                className="border rounded-lg p-3"
              >
                <p className="font-semibold">{producto.name}</p>
                <p className="text-sm text-gray-600">
                  {[producto.talle, producto.color].filter(Boolean).join(' - ')}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-500">
                    Cantidad: {producto.qty}
                  </span>
                  {producto.nota && (
                    <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                      {producto.nota}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHAT */}
        <div className="bg-white rounded-lg shadow">
          <div className="bg-nadin-pink text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <h2 className="font-bold">Chat con Nadin</h2>
              {mensajesNoLeidos > 0 && (
                <span className="bg-white text-nadin-pink text-xs font-bold px-2 py-1 rounded-full">
                  {mensajesNoLeidos}
                </span>
              )}
            </div>
          </div>

          {/* Mensajes */}
          <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {mensajes.length === 0 ? (
              <div className="text-center text-gray-500 text-sm mt-8">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
                <p>No hay mensajes todavia</p>
                <p className="text-xs mt-2">
                  Cuando Nadin este armando tu pedido podran comunicarse aqui
                </p>
              </div>
            ) : (
              mensajes.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.autorTipo === 'revendedora' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.autorTipo === 'revendedora'
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
                onChange={(e: any) => setNuevoMensaje((e.target as any).value)}
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
            <p className="text-xs text-gray-500 mt-2">
              Se actualiza automaticamente cada 5 segundos
            </p>
          </div>
        </div>
      </div>

      {/* Informacion adicional */}
      {pedido.armadoEn && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <strong>Armado completado:</strong>{' '}
            {new Date(pedido.armadoEn).toLocaleString('es-AR')}
          </p>
          {productosFaltantes > 0 && (
            <p className="text-sm text-red-600 mt-2">
              {productosFaltantes} producto(s) no disponible(s)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
