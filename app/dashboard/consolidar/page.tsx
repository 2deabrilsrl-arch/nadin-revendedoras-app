// PAGINA: Consolidar con Seleccion Multiple y Cancelacion
// Ubicacion: app/dashboard/consolidar/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Send, ShoppingCart, Home, Mail, X, CheckSquare, Square } from 'lucide-react';

interface Pedido {
  id: string;
  cliente: string;
  telefono: string;
  nota: string;
  createdAt: string;
  lineas: any[];
}

export default function ConsolidarPedidosPage() {
  const router = useRouter();
  const [pedidosSinConsolidar, setPedidosSinConsolidar] = useState<Pedido[]>([]);
  const [pedidosSeleccionados, setPedidosSeleccionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [cancelando, setCancelando] = useState<string | null>(null);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`/api/pedidos?userId=${userData.id}`);
      
      if (!res.ok) {
        throw new Error('Error al cargar pedidos');
      }
      
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const sinConsolidar = data.filter((p: any) => !p.consolidacionId);
        setPedidosSinConsolidar(sinConsolidar);
      } else {
        console.error('Respuesta inesperada de la API:', data);
        setPedidosSinConsolidar([]);
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      setPedidosSinConsolidar([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePedido = (pedidoId: string) => {
    setPedidosSeleccionados(prev => {
      if (prev.includes(pedidoId)) {
        return prev.filter(id => id !== pedidoId);
      } else {
        return [...prev, pedidoId];
      }
    });
  };

  const handleToggleTodos = () => {
    if (pedidosSeleccionados.length === pedidosSinConsolidar.length) {
      // Deseleccionar todos
      setPedidosSeleccionados([]);
    } else {
      // Seleccionar todos
      setPedidosSeleccionados(pedidosSinConsolidar.map(p => p.id));
    }
  };

  const handleCancelarPedido = async (pedidoId: string) => {
    const confirmar = confirm('Seguro que queres cancelar este pedido?');
    if (!confirmar) return;

    setCancelando(pedidoId);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'cancelado', orderStatus: 'cancelado' })
      });

      if (!res.ok) throw new Error('Error al cancelar pedido');

      alert('Pedido cancelado exitosamente');
      
      // Quitar de seleccionados si estaba
      setPedidosSeleccionados(prev => prev.filter(id => id !== pedidoId));
      
      // Recargar pedidos
      await cargarPedidos();
    } catch (error) {
      console.error('Error cancelando pedido:', error);
      alert('Error al cancelar el pedido');
    } finally {
      setCancelando(null);
    }
  };

  const handleConsolidar = async () => {
    if (pedidosSeleccionados.length === 0) {
      alert('Selecciona al menos un pedido para consolidar');
      return;
    }

    const confirmar = confirm(
      `Vas a consolidar ${pedidosSeleccionados.length} pedido(s).\n\n` +
      'Se enviara un email a Nadin con tu pedido.\n\n' +
      'Continuar?'
    );

    if (!confirmar) return;

    setEnviando(true);

    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      const res = await fetch('/api/consolidaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          pedidoIds: pedidosSeleccionados
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al consolidar');
      }

      const data = await res.json();

      alert(
        'Pedidos consolidados exitosamente!\n\n' +
        'Se envio un email a Nadin con tu pedido.'
      );

      // Limpiar seleccion
      setPedidosSeleccionados([]);

      // Mostrar opciones
      const accion = confirm(
        'Que queres hacer ahora?\n\n' +
        'OK = Crear otro pedido\n' +
        'Cancelar = Volver al inicio'
      );

      if (accion) {
        router.push('/dashboard/catalogo');
      } else {
        router.push('/dashboard');
      }

    } catch (error) {
      console.error('Error consolidando:', error);
      alert('Error al consolidar pedidos: ' + ((error as any).message || 'Error desconocido'));
    } finally {
      setEnviando(false);
    }
  };

  const calcularTotal = (pedidos: Pedido[]) => {
    return pedidos.reduce((sum, pedido) => {
      const total = pedido.lineas?.reduce((pSum: number, l: any) => pSum + (l.venta * l.qty), 0) || 0;
      return sum + total;
    }, 0);
  };

  const handleVolverInicio = () => {
    router.push('/dashboard');
  };

  const handleCrearOtroPedido = () => {
    router.push('/dashboard/catalogo');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  const pedidosSeleccionadosData = pedidosSinConsolidar.filter(p => pedidosSeleccionados.includes(p.id));
  const totalSeleccionado = calcularTotal(pedidosSeleccionadosData);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="text-pink-500" />
              Consolidar Pedidos
            </h1>
            <p className="text-gray-600 mt-1">
              {pedidosSinConsolidar.length > 0
                ? `${pedidosSinConsolidar.length} pedido(s) disponible(s) | ${pedidosSeleccionados.length} seleccionado(s)`
                : 'No tenes pedidos pendientes para consolidar'}
            </p>
          </div>

          <button
            onClick={handleVolverInicio}
            className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium transition-colors"
          >
            <Home size={20} />
            <span>Volver al Inicio</span>
          </button>
        </div>
      </div>

      {/* Informacion */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Mail size={18} />
          Que es consolidar?
        </h3>
        <p className="text-sm text-blue-800">
          Al consolidar, agrupas varios pedidos en uno solo. Esto te permite:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-blue-700">
          <li>✅ Pagar todo junto</li>
          <li>✅ Recibir todo en un solo envio</li>
          <li>✅ Ahorrar en costos de envio</li>
        </ul>
      </div>

      {/* Lista de pedidos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Pedidos para consolidar
            </h2>
            
            {pedidosSinConsolidar.length > 0 && (
              <button
                onClick={handleToggleTodos}
                className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors"
              >
                {pedidosSeleccionados.length === pedidosSinConsolidar.length ? (
                  <>
                    <CheckSquare size={18} />
                    Deseleccionar todos
                  </>
                ) : (
                  <>
                    <Square size={18} />
                    Seleccionar todos
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {pedidosSinConsolidar.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-4">No hay pedidos para consolidar</p>
            <button
              onClick={handleCrearOtroPedido}
              className="bg-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors inline-flex items-center gap-2"
            >
              <ShoppingCart size={20} />
              Crear Pedido
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-3">
            {pedidosSinConsolidar.map((pedido) => {
              const totalVenta = pedido.lineas?.reduce((sum: number, l: any) => sum + (l.venta * l.qty), 0) || 0;
              const estaSeleccionado = pedidosSeleccionados.includes(pedido.id);
              const estaCancelando = cancelando === pedido.id;
              
              return (
                <div
                  key={pedido.id}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    estaSeleccionado 
                      ? 'border-pink-400 bg-pink-50' 
                      : 'border-gray-200 hover:border-pink-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleTogglePedido(pedido.id)}
                      className="flex-shrink-0"
                    >
                      {estaSeleccionado ? (
                        <CheckSquare size={24} className="text-pink-600" />
                      ) : (
                        <Square size={24} className="text-gray-400 hover:text-pink-400" />
                      )}
                    </button>

                    {/* Info del pedido */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {pedido.cliente}
                          </p>
                          <p className="text-sm text-gray-600">
                            {pedido.lineas?.length || 0} producto(s)
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(pedido.createdAt).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xl font-bold text-pink-600">
                            ${totalVenta.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {pedido.nota && (
                        <p className="text-sm text-gray-500 mt-2 italic">
                          Nota: {pedido.nota}
                        </p>
                      )}
                    </div>

                    {/* Boton cancelar */}
                    <button
                      onClick={() => handleCancelarPedido(pedido.id)}
                      disabled={estaCancelando}
                      className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Cancelar pedido"
                    >
                      {estaCancelando ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                      ) : (
                        <X size={20} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumen y botones */}
      {pedidosSeleccionados.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4 p-4 bg-pink-50 rounded-lg border border-pink-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pedidos seleccionados:</p>
                <p className="text-2xl font-bold text-gray-900">{pedidosSeleccionados.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total:</p>
                <p className="text-2xl font-bold text-pink-600">${totalSeleccionado.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleCrearOtroPedido}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart size={20} />
              Crear otro pedido
            </button>

            <button
              onClick={handleConsolidar}
              disabled={enviando}
              className="flex-1 bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {enviando ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Consolidando...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Consolidar seleccionados ({pedidosSeleccionados.length})
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
