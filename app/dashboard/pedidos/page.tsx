// PÁGINA: Lista de Pedidos con Botón Cancelar
// Ubicación: app/dashboard/pedidos/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Eye, 
  Trash2, 
  MessageCircle, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

export default function MisPedidosPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [consolidaciones, setConsolidaciones] = useState<any[]>([]); // ✅ NUEVO
  const [pedidosSinConsolidar, setPedidosSinConsolidar] = useState<any[]>([]); // ✅ NUEVO
  const [expandedConsolidacion, setExpandedConsolidacion] = useState<string | null>(null); // ✅ NUEVO
  const [documentosPorConsolidacion, setDocumentosPorConsolidacion] = useState<Record<string, number>>({}); // ✅ NUEVO: Cache de cantidad de documentos
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);

  useEffect(() => {
    const userData = (globalThis as any).localStorage?.getItem('user');
    if (userData) {
      const u = JSON.parse(userData);
      setUser(u);
      cargarPedidos(u.id);
      
      // Polling cada 10 segundos para actualizar estados
      const interval = setInterval(() => {
        cargarPedidos(u.id);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, []);

  const cargarPedidos = async (userId: string) => {
    try {
      setLoading(true);
      
      // ✅ NUEVO: Cargar CONSOLIDACIONES
      const resConsolidaciones = await fetch(`/api/consolidaciones?userId=${userId}`);
      const dataConsolidaciones = await resConsolidaciones.json() as any;
      
      // ✅ NUEVO: Cargar PEDIDOS
      const resPedidos = await fetch(`/api/pedidos?userId=${userId}`);
      const dataPedidos = await resPedidos.json() as any;
      
      if (Array.isArray(dataPedidos)) {
        setPedidos(dataPedidos);
        
        // ✅ NUEVO: Separar pedidos SIN consolidar
        const sinConsolidar = dataPedidos.filter((p: any) => 
          !p.consolidacionId && p.estado !== 'cancelado'
        );
        setPedidosSinConsolidar(sinConsolidar);
        
        // ✅ NUEVO: Agrupar pedidos POR consolidación
        if (dataConsolidaciones.consolidaciones && Array.isArray(dataConsolidaciones.consolidaciones)) {
          const consolidacionesConPedidos = dataConsolidaciones.consolidaciones.map((cons: any) => {
            const pedidoIds = JSON.parse(cons.pedidoIds || '[]');
            const pedidosDeConsolidacion = dataPedidos.filter((p: any) => 
              pedidoIds.includes(p.id)
            );
            
            return {
              ...cons,
              pedidos: pedidosDeConsolidacion
            };
          });
          
          // Ordenar por fecha más reciente
          consolidacionesConPedidos.sort((a: any, b: any) => 
            new Date(b.enviadoAt || b.createdAt).getTime() - new Date(a.enviadoAt || a.createdAt).getTime()
          );
          
          setConsolidaciones(consolidacionesConPedidos);
          
          console.log('✅ Cargadas:', consolidacionesConPedidos.length, 'consolidaciones');
          console.log('✅ Pedidos sin consolidar:', sinConsolidar.length);
        }
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelarPedido = async (pedidoId: string, cliente: string) => {
    const confirmar = (globalThis as any).confirm?.(
      `¿Estás segura de que querés cancelar el pedido de ${cliente}?\n\n` +
      'Esta acción NO se puede deshacer y el pedido se eliminará completamente.'
    );

    if (!confirmar) return;

    setCancelando(pedidoId);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`, {
        method: 'DELETE'
      });

      const data = await res.json() as any;

      if (res.ok && data.success) {
        ((globalThis as any).alert)?.('✅ Pedido cancelado exitosamente');
        cargarPedidos(user.id);
      } else {
        throw new Error(data.error || 'Error al cancelar pedido');
      }
    } catch (error) {
      console.error('Error cancelando pedido:', error);
      ((globalThis as any).alert)?.('❌ Error al cancelar el pedido. Intentá de nuevo.');
    } finally {
      setCancelando(null);
    }
  };

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: <Clock size={16} />,
          texto: 'Pendiente'
        };
      case 'enviado':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: <Package size={16} />,
          texto: 'Enviado a Nadin'
        };
      case 'armado':
        return {
          color: 'bg-green-100 text-green-800 border-green-300',
          icon: <CheckCircle size={16} />,
          texto: 'Armado'
        };
      case 'completado':
        return {
          color: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: <CheckCircle size={16} />,
          texto: 'Completado'
        };
      case 'cancelado':
        return {
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: <XCircle size={16} />,
          texto: 'Cancelado'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: <Package size={16} />,
          texto: estado
        };
    }
  };

  const puedeCancelar = (estado: string) => {
    return ['pendiente', 'enviado'].includes(estado);
  };

  // ✅ NUEVO: Obtener estado de una consolidación basado en sus pedidos
  const getEstadoConsolidacion = (consolidacion: any) => {
    if (!consolidacion.pedidos || consolidacion.pedidos.length === 0) {
      return 'enviado';
    }
    
    // Tomar el estado del primer pedido (todos deberían tener el mismo)
    return consolidacion.pedidos[0].estado || consolidacion.estado || 'enviado';
  };

  // ✅ NUEVO: Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // ✅ NUEVO: Ir a ver remitos del primer pedido de la consolidación
  const verRemitos = (consolidacion: any) => {
    if (consolidacion.pedidos && consolidacion.pedidos.length > 0) {
      const primerPedido = consolidacion.pedidos[0];
      router.push(`/dashboard/pedidos/${primerPedido.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Package size={32} className="text-pink-500" />
          Mis Pedidos
        </h1>
        <p className="text-gray-600 mt-2">
          Administrá y seguí el estado de tus pedidos
        </p>
      </div>

      {pedidos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="mx-auto text-gray-300 mb-4" size={64} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No tenés pedidos todavía
          </h2>
          <p className="text-gray-600 mb-6">
            Empezá a crear pedidos desde el catálogo
          </p>
          <button
            onClick={() => router.push('/dashboard/catalogo')}
            className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600"
          >
            Ir al Catálogo
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ✅ SECCIÓN 1: PEDIDOS SIN CONSOLIDAR */}
          {pedidosSinConsolidar.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={24} className="text-yellow-500" />
                Pedidos Individuales
                <span className="text-sm font-normal text-gray-600">
                  ({pedidosSinConsolidar.length})
                </span>
              </h2>

              <div className="space-y-4">
                {pedidosSinConsolidar.map((pedido) => {
                  const estadoConfig = getEstadoConfig(pedido.estado);
                  const cancelable = puedeCancelar(pedido.estado);
                  const estaCancelando = cancelando === pedido.id;

                  return (
                    <div
                      key={pedido.id}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">
                                {pedido.cliente}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 flex items-center gap-2 ${estadoConfig.color}`}>
                                {estadoConfig.icon}
                                {estadoConfig.texto}
                              </span>
                            </div>

                            <p className="text-sm text-gray-600">
                              📅 {new Date(pedido.createdAt).toLocaleDateString('es-AR')}
                            </p>

                            {pedido.telefono && (
                              <p className="text-sm text-gray-600">
                                📞 {pedido.telefono}
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-gray-600">ID</p>
                            <p className="font-mono text-sm text-gray-900">
                              #{pedido.id.substring(0, 8)}
                            </p>
                          </div>
                        </div>

                        {pedido.lineas && pedido.lineas.length > 0 && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-2">
                              📦 {pedido.lineas.length} producto(s)
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {pedido.lineas.slice(0, 3).map((linea: any) => (
                                <span
                                  key={linea.id}
                                  className="text-xs bg-white px-2 py-1 rounded border border-gray-200"
                                >
                                  {linea.qty}x {linea.name}
                                </span>
                              ))}
                              {pedido.lineas.length > 3 && (
                                <span className="text-xs text-gray-600 px-2 py-1">
                                  +{pedido.lineas.length - 3} más
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => router.push(`/dashboard/pedidos/${pedido.id}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                          >
                            <Eye size={18} />
                            Ver Detalle
                          </button>

                          {cancelable && (
                            <button
                              onClick={() => cancelarPedido(pedido.id, pedido.cliente)}
                              disabled={estaCancelando}
                              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors ml-auto"
                            >
                              <Trash2 size={18} />
                              {estaCancelando ? 'Cancelando...' : 'Cancelar'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ✅ SECCIÓN 2: CONSOLIDACIONES */}
          {consolidaciones.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={24} className="text-pink-500" />
                Consolidaciones
                <span className="text-sm font-normal text-gray-600">
                  ({consolidaciones.length})
                </span>
              </h2>

              <div className="space-y-4">
                {consolidaciones.map((consolidacion) => {
                  const estaExpandida = expandedConsolidacion === consolidacion.id;
                  const totalPedidos = consolidacion.pedidos?.length || 0;
                  const totalProductos = consolidacion.pedidos?.reduce((sum: number, p: any) => 
                    sum + (p.lineas?.length || 0), 0
                  ) || 0;
                  const estadoConsolidacion = getEstadoConsolidacion(consolidacion);
                  const estadoConfig = getEstadoConfig(estadoConsolidacion);

                  return (
                    <div
                      key={consolidacion.id}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                    >
                      {/* Header de consolidación */}
                      <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold">
                                Consolidación #{consolidacion.id.slice(-8)}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 flex items-center gap-2 bg-white ${estadoConfig.color.replace('bg-', 'bg-opacity-90 ')}`}>
                                {estadoConfig.icon}
                                {estadoConfig.texto}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                              <div>
                                <div className="text-pink-100 text-sm">Pedidos</div>
                                <div className="text-2xl font-bold">{totalPedidos}</div>
                              </div>
                              <div>
                                <div className="text-pink-100 text-sm">Productos</div>
                                <div className="text-2xl font-bold">{totalProductos}</div>
                              </div>
                              <div>
                                <div className="text-pink-100 text-sm">Total</div>
                                <div className="text-2xl font-bold">
                                  {formatCurrency(consolidacion.totalVenta || 0)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Botones principales */}
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setExpandedConsolidacion(estaExpandida ? null : consolidacion.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <Package size={18} />
                            {estaExpandida ? 'Ocultar' : 'Ver'} Pedidos
                          </button>

                          <button
                            onClick={() => router.push(`/dashboard/chat?id=${consolidacion.id}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            <MessageCircle size={18} />
                            Chat con Nadin
                          </button>

                          {/* ✅ NUEVO: Botón Ver Remitos (solo si está armado) */}
                          {(estadoConsolidacion === 'armado' || estadoConsolidacion === 'pagado' || estadoConsolidacion === 'completado' || estadoConsolidacion === 'despachado') && (
                            <button
                              onClick={() => verRemitos(consolidacion)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                              <FileText size={18} />
                              Ver Remitos
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Detalle de pedidos expandido */}
                      {estaExpandida && consolidacion.pedidos && consolidacion.pedidos.length > 0 && (
                        <div className="p-6 bg-gray-50">
                          <h4 className="font-semibold text-gray-900 mb-4">
                            Detalle de Pedidos:
                          </h4>
                          <div className="space-y-3">
                            {consolidacion.pedidos.map((pedido: any) => (
                              <div key={pedido.id} className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h5 className="font-semibold text-gray-900">{pedido.cliente}</h5>
                                    {pedido.telefono && (
                                      <p className="text-sm text-gray-600">📞 {pedido.telefono}</p>
                                    )}
                                  </div>
                                  <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                    #{pedido.id.substring(0, 8)}
                                  </span>
                                </div>

                                {pedido.lineas && pedido.lineas.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {pedido.lineas.map((linea: any) => (
                                      <span
                                        key={linea.id}
                                        className="text-xs bg-pink-50 text-pink-700 px-2 py-1 rounded"
                                      >
                                        {linea.qty}x {linea.name}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <button
                                  onClick={() => router.push(`/dashboard/pedidos/${pedido.id}`)}
                                  className="mt-3 text-sm text-pink-600 hover:text-pink-700 font-medium"
                                >
                                  Ver detalle →
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-blue-500 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">
              Sobre tus pedidos
            </h3>
            <p className="text-sm text-blue-700">
              Los <strong>pedidos individuales</strong> son aquellos que aún no consolidaste.
              Las <strong>consolidaciones</strong> agrupan varios pedidos que enviaste juntos a Nadin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
