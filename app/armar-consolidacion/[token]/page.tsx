// PÁGINA: Armar Consolidación - COMPLETO CON GESTIÓN DE STOCK
// Ubicación: app/armar-consolidacion/[token]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Package, 
  CheckCircle, 
  Send, 
  ArrowLeft,
  MessageCircle,
  AlertTriangle,
  X,
  AlertCircle,
  Minus,
  Plus
} from 'lucide-react';

interface ProductoArmado {
  lineaId: string;
  cantidadPedida: number;
  cantidadDisponible: number;
  estado: 'completo' | 'parcial' | 'sin-stock';
}

export default function ArmarConsolidacionPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [consolidacion, setConsolidacion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [marcandoArmado, setMarcandoArmado] = useState(false);
  
  // ✅ Estado mejorado: cantidad disponible por producto
  const [productosArmados, setProductosArmados] = useState<Record<string, ProductoArmado>>({});
  
  // Chat
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);
  const [mensajesSinLeer, setMensajesSinLeer] = useState(0);

  // Modal resumen
  const [showResumen, setShowResumen] = useState(false);

  useEffect(() => {
    cargarConsolidacion();
    cargarMensajes();

    const interval = setInterval(cargarMensajes, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const cargarConsolidacion = async () => {
    try {
      const res = await fetch(`/api/armar-consolidacion/${token}`);
      const data = await res.json();

      if (data.consolidacion) {
        setConsolidacion(data.consolidacion);
        
        // ✅ Inicializar estado de productos con cantidad pedida
        const productosInicial: Record<string, ProductoArmado> = {};
        
        data.consolidacion.pedidos?.forEach((pedido: any) => {
          pedido.items?.forEach((item: any) => {
            productosInicial[item.id] = {
              lineaId: item.id,
              cantidadPedida: item.cantidad,
              cantidadDisponible: item.cantidad, // Por defecto, todo disponible
              estado: 'completo'
            };
          });
        });
        
        setProductosArmados(productosInicial);
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
      const data = await res.json();

      if (data.mensajes) {
        setMensajes(data.mensajes);
        
        const sinLeer = data.mensajes.filter(
          (m: any) => !m.leido && m.autorTipo === 'revendedora'
        ).length;
        setMensajesSinLeer(sinLeer);
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const marcarMensajesComoLeidos = async () => {
    try {
      await fetch(`/api/armar-consolidacion/${token}/mensajes`, {
        method: 'PATCH'
      });
      setMensajesSinLeer(0);
    } catch (error) {
      console.error('Error marcando mensajes:', error);
    }
  };

  // ✅ Actualizar cantidad disponible
  const actualizarCantidad = (lineaId: string, cantidad: number) => {
    setProductosArmados(prev => {
      const producto = prev[lineaId];
      if (!producto) return prev;

      const cantidadFinal = Math.max(0, cantidad);
      let estado: 'completo' | 'parcial' | 'sin-stock' = 'completo';
      
      if (cantidadFinal === 0) {
        estado = 'sin-stock';
      } else if (cantidadFinal < producto.cantidadPedida) {
        estado = 'parcial';
      }

      return {
        ...prev,
        [lineaId]: {
          ...producto,
          cantidadDisponible: cantidadFinal,
          estado
        }
      };
    });
  };

  // ✅ Marcar como sin stock
  const marcarSinStock = (lineaId: string) => {
    actualizarCantidad(lineaId, 0);
  };

  // ✅ Calcular resumen de cambios
  const calcularResumen = () => {
    const completos: any[] = [];
    const parciales: any[] = [];
    const sinStock: any[] = [];

    consolidacion?.pedidos?.forEach((pedido: any) => {
      pedido.items?.forEach((item: any) => {
        const producto = productosArmados[item.id];
        if (!producto) return;

        const info = {
          nombre: item.producto.name,
          marca: item.producto.brand,
          talle: item.producto.talle,
          color: item.producto.color,
          cantidadPedida: producto.cantidadPedida,
          cantidadDisponible: producto.cantidadDisponible
        };

        if (producto.estado === 'completo') {
          completos.push(info);
        } else if (producto.estado === 'parcial') {
          parciales.push(info);
        } else {
          sinStock.push(info);
        }
      });
    });

    return { completos, parciales, sinStock };
  };

  const handleFinalizarArmado = async () => {
    const resumen = calcularResumen();
    
    // Mostrar modal de confirmación con resumen
    setShowResumen(true);
  };

  const confirmarFinalizarArmado = async () => {
    setMarcandoArmado(true);

    try {
      const resumen = calcularResumen();

      // Enviar datos de armado a la API
      const res = await fetch(`/api/armar-consolidacion/${token}/marcar-armado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productosArmados: Object.values(productosArmados),
          resumen: resumen,
          armadoCompleto: true
        })
      });

      if (!res.ok) throw new Error('Error al marcar armado');

      alert('✅ Armado completado y notificación enviada a la revendedora');
      
      // Recargar consolidación
      await cargarConsolidacion();
      setShowResumen(false);

    } catch (error) {
      console.error('Error finalizando armado:', error);
      alert('Error al finalizar el armado. Intentá de nuevo.');
    } finally {
      setMarcandoArmado(false);
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return;

    setEnviandoMensaje(true);

    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const autorTipo = userData.rol === 'vendedora' ? 'vendedora' : 'revendedora';
      const autorNombre = userData.rol === 'vendedora' ? 'Nadin' : userData.name;

      const res = await fetch(`/api/armar-consolidacion/${token}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: nuevoMensaje,
          autorTipo,
          autorNombre
        })
      });

      if (!res.ok) throw new Error('Error enviando mensaje');

      setNuevoMensaje('');
      await cargarMensajes();

    } catch (error) {
      console.error('Error enviando mensaje:', error);
      alert('Error al enviar el mensaje');
    } finally {
      setEnviandoMensaje(false);
    }
  };

  const handleVolver = () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (userData.rol === 'vendedora') {
      router.push('/admin/pendientes-armado');
    } else {
      router.push('/dashboard');
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
            onClick={handleVolver}
            className="mt-6 bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  const estaCompletado = consolidacion.armadoEn && consolidacion.pagado;
  const resumenActual = calcularResumen();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Botón Volver */}
        <button
          onClick={handleVolver}
          className="mb-6 flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Volver</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Consolidación #{consolidacion.id.slice(-8)}
              </h1>
              <p className="text-gray-600">
                Cliente: <span className="font-medium">{consolidacion.user?.name}</span>
              </p>
              <p className="text-gray-600">
                Total: <span className="font-medium text-pink-600">${consolidacion.total?.toFixed(2)}</span>
              </p>
            </div>

            {consolidacion.armadoEn && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full text-sm font-semibold">
                <CheckCircle size={18} />
                <span>✅ Armado Completado</span>
              </div>
            )}
          </div>
        </div>

        {/* Resumen rápido de cambios */}
        {(resumenActual.parciales.length > 0 || resumenActual.sinStock.length > 0) && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={24} className="text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-yellow-800">Hay cambios en el pedido</p>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  {resumenActual.parciales.length > 0 && (
                    <li>• {resumenActual.parciales.length} producto(s) con stock parcial</li>
                  )}
                  {resumenActual.sinStock.length > 0 && (
                    <li>• {resumenActual.sinStock.length} producto(s) sin stock</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Lista de productos */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package size={20} />
              Productos a Armar
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {consolidacion.pedidos?.map((pedido: any) => (
              <div key={pedido.id}>
                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Package size={18} />
                  Pedido #{pedido.id.slice(-8)} - {pedido.cliente}
                </h3>
                
                <div className="space-y-3">
                  {pedido.items?.map((item: any) => {
                    const producto = productosArmados[item.id];
                    if (!producto) return null;

                    const estadoColor = 
                      producto.estado === 'completo' ? 'border-green-500 bg-green-50' :
                      producto.estado === 'parcial' ? 'border-yellow-500 bg-yellow-50' :
                      'border-red-500 bg-red-50';

                    return (
                      <div
                        key={item.id}
                        className={`border-2 rounded-lg p-4 transition-all ${estadoColor}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Info del producto */}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {item.producto.name}
                            </h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              {item.producto.brand && <p>Marca: {item.producto.brand}</p>}
                              {item.producto.talle && <p>Talle: {item.producto.talle}</p>}
                              {item.producto.color && <p>Color: {item.producto.color}</p>}
                              <p className="font-medium">
                                Precio unitario: ${item.precioUnitario.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {/* Gestión de cantidad */}
                          <div className="flex flex-col items-end gap-3">
                            {/* Estado visual */}
                            <div className="text-right">
                              {producto.estado === 'completo' && (
                                <span className="text-green-700 font-semibold flex items-center gap-1">
                                  <CheckCircle size={16} />
                                  Completo
                                </span>
                              )}
                              {producto.estado === 'parcial' && (
                                <span className="text-yellow-700 font-semibold flex items-center gap-1">
                                  <AlertTriangle size={16} />
                                  Parcial
                                </span>
                              )}
                              {producto.estado === 'sin-stock' && (
                                <span className="text-red-700 font-semibold flex items-center gap-1">
                                  <X size={16} />
                                  Sin Stock
                                </span>
                              )}
                            </div>

                            {/* Contador de cantidad */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => actualizarCantidad(item.id, producto.cantidadDisponible - 1)}
                                disabled={!!consolidacion.armadoEn || producto.cantidadDisponible === 0}
                                className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Minus size={16} />
                              </button>

                              <div className="text-center min-w-[120px]">
                                <input
                                  type="number"
                                  value={producto.cantidadDisponible}
                                  onChange={(e) => actualizarCantidad(item.id, parseInt((e.target as any).value) || 0)}
                                  disabled={!!consolidacion.armadoEn}
                                  className="w-20 text-center text-2xl font-bold border-2 rounded-lg py-1 disabled:bg-gray-100"
                                  min="0"
                                  max={producto.cantidadPedida}
                                />
                                <p className="text-xs text-gray-600 mt-1">
                                  de {producto.cantidadPedida}
                                </p>
                              </div>

                              <button
                                onClick={() => actualizarCantidad(item.id, producto.cantidadDisponible + 1)}
                                disabled={!!consolidacion.armadoEn || producto.cantidadDisponible >= producto.cantidadPedida}
                                className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus size={16} />
                              </button>
                            </div>

                            {/* Botón Sin Stock */}
                            {!consolidacion.armadoEn && producto.estado !== 'sin-stock' && (
                              <button
                                onClick={() => marcarSinStock(item.id)}
                                className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                              >
                                Marcar Sin Stock
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Botón finalizar armado */}
          {!consolidacion.armadoEn && (
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handleFinalizarArmado}
                disabled={marcandoArmado}
                className="w-full bg-pink-500 text-white py-4 rounded-lg font-semibold hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-lg"
              >
                <Send size={24} />
                Finalizar Armado y Notificar
              </button>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle size={20} />
              Mensajes
            </h2>
            {mensajesSinLeer > 0 && (
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                {mensajesSinLeer} sin leer
              </div>
            )}
          </div>

          <div 
            className="p-6 space-y-4 max-h-96 overflow-y-auto"
            onClick={marcarMensajesComoLeidos}
          >
            {mensajes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay mensajes aún</p>
            ) : (
              mensajes.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.autorTipo === 'vendedora' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-lg ${
                      msg.autorTipo === 'vendedora'
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">{msg.autorNombre}</p>
                    <p>{msg.mensaje}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {!estaCompletado && (
            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje((e.target as any).value)}
                  onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
                  placeholder="Escribir mensaje..."
                  disabled={enviandoMensaje}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
                <button
                  onClick={enviarMensaje}
                  disabled={enviandoMensaje || !nuevoMensaje.trim()}
                  className="bg-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {enviandoMensaje ? '...' : 'Enviar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Resumen */}
      {showResumen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold">Resumen del Armado</h2>
              <p className="text-gray-600 mt-2">
                Revisá los cambios antes de finalizar
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Productos completos */}
              {resumenActual.completos.length > 0 && (
                <div>
                  <h3 className="font-semibold text-green-700 flex items-center gap-2 mb-3">
                    <CheckCircle size={20} />
                    Productos Completos ({resumenActual.completos.length})
                  </h3>
                  <div className="space-y-2">
                    {resumenActual.completos.map((p, i) => (
                      <div key={i} className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                        <p className="font-medium">{p.nombre}</p>
                        <p className="text-gray-600">Cantidad: {p.cantidadDisponible}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Productos parciales */}
              {resumenActual.parciales.length > 0 && (
                <div>
                  <h3 className="font-semibold text-yellow-700 flex items-center gap-2 mb-3">
                    <AlertTriangle size={20} />
                    Productos Parciales ({resumenActual.parciales.length})
                  </h3>
                  <div className="space-y-2">
                    {resumenActual.parciales.map((p, i) => (
                      <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                        <p className="font-medium">{p.nombre}</p>
                        <p className="text-gray-600">
                          Disponible: {p.cantidadDisponible} de {p.cantidadPedida} 
                          <span className="text-yellow-700 font-semibold">
                            {' '}(-{p.cantidadPedida - p.cantidadDisponible})
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Productos sin stock */}
              {resumenActual.sinStock.length > 0 && (
                <div>
                  <h3 className="font-semibold text-red-700 flex items-center gap-2 mb-3">
                    <X size={20} />
                    Sin Stock ({resumenActual.sinStock.length})
                  </h3>
                  <div className="space-y-2">
                    {resumenActual.sinStock.map((p, i) => (
                      <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                        <p className="font-medium">{p.nombre}</p>
                        <p className="text-red-700">Producto no disponible</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowResumen(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Volver a Editar
              </button>
              <button
                onClick={confirmarFinalizarArmado}
                disabled={marcandoArmado}
                className="flex-1 px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:bg-gray-300 font-semibold"
              >
                {marcandoArmado ? 'Finalizando...' : 'Confirmar y Notificar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
