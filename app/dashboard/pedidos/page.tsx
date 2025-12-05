'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/precios';
import { Package, Calendar, User, Phone, ChevronDown, ChevronUp, CheckCircle, Clock, Send, Truck, DollarSign, XCircle, Users, AlertCircle } from 'lucide-react';
import BackToHomeButton from '@/components/BackToHomeButton';
import { useRouter } from 'next/navigation';

interface Consolidacion {
  id: string;
  totalMayorista: number;
  totalVenta: number;
  ganancia: number;
  formaPago: string;
  tipoEnvio: string;
  transporteNombre?: string;
  estado: string;
  enviadoAt: string;
  completadoEn?: string;
  pagadoEn?: string;
  costoReal?: number;
  gananciaNeta?: number;
  pedidos: Pedido[];
}

interface Pedido {
  id: string;
  cliente: string;
  telefono: string;
  nota: string;
  estado: string;
  orderStatus: string;
  paidToNadin: boolean;
  paidByClient: boolean;
  createdAt: string;
  consolidacionId?: string;
  lineas: PedidoLinea[];
}

interface PedidoLinea {
  id: number;
  sku: string;
  brand: string;
  name: string;
  talle: string;
  color: string;
  qty: number;
  mayorista: number;
  venta: number;
}

// Configuracion de estados
const ORDER_STATUSES = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  sent_to_nadin: { label: 'Enviado a Nadin', color: 'bg-blue-100 text-blue-800', icon: Send },
  armado_iniciado: { label: 'Armando', color: 'bg-orange-100 text-orange-800', icon: Package },
  armado_completo: { label: 'Armado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  pagado: { label: 'Pagado', color: 'bg-purple-100 text-purple-800', icon: DollarSign },
  despachado: { label: 'Despachado', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  entregado: { label: 'Entregado', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle }
};

export default function PedidosPage() {
  const router = useRouter();
  const [consolidaciones, setConsolidaciones] = useState<Consolidacion[]>([]);
  const [pedidosSinConsolidar, setPedidosSinConsolidar] = useState<Pedido[]>([]); // NUEVO
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedConsolidacion, setExpandedConsolidacion] = useState<string | null>(null);
  const [expandedPedido, setExpandedPedido] = useState<string | null>(null);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const userStr = (globalThis as any).localStorage?.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserId(user.id);
      loadData(user.id);
    } else {
      setError('Usuario no encontrado');
      setLoading(false);
    }
  }, []);

  const loadData = async (uid: string) => {
    try {
      setLoading(true);
      
      // Cargar consolidaciones
      const resConsolidaciones = await fetch(`/api/consolidaciones?userId=${uid}`);
      if (!resConsolidaciones.ok) throw new Error('Error al cargar consolidaciones');
      const dataConsolidaciones = await resConsolidaciones.json();

      // Cargar todos los pedidos
      const resPedidos = await fetch(`/api/pedidos?userId=${uid}`);
      if (!resPedidos.ok) throw new Error('Error al cargar pedidos');
      const dataPedidos = await resPedidos.json();

      // NUEVO: Separar pedidos sin consolidar
      const pedidosSinConsolidarArr = dataPedidos.filter((p: any) => !p.consolidacionId);
      setPedidosSinConsolidar(pedidosSinConsolidarArr);

      // Agrupar pedidos por consolidacion
      const consolidacionesConPedidos = dataConsolidaciones.consolidaciones.map((cons: any) => {
        const pedidoIds = JSON.parse(cons.pedidoIds);
        const pedidosDeConsolidacion = dataPedidos.filter((p: any) => 
          pedidoIds.includes(p.id)
        );

        return {
          ...cons,
          pedidos: pedidosDeConsolidacion
        };
      });

      // Ordenar por fecha mas reciente
      consolidacionesConPedidos.sort((a: any, b: any) => 
        new Date(b.enviadoAt).getTime() - new Date(a.enviadoAt).getTime()
      );

      setConsolidaciones(consolidacionesConPedidos);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = ORDER_STATUSES[status as keyof typeof ORDER_STATUSES] || ORDER_STATUSES.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
            <p className="mt-4 text-gray-600">Cargando pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 pb-24">
      <BackToHomeButton />
      
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mis Pedidos</h1>
          <p className="text-gray-600">
            {pedidosSinConsolidar.length > 0 && (
              <span className="text-pink-600 font-semibold">
                {pedidosSinConsolidar.length} pedido(s) sin consolidar
              </span>
            )}
            {pedidosSinConsolidar.length > 0 && consolidaciones.length > 0 && ' | '}
            {consolidaciones.length > 0 && (
              <span>{consolidaciones.length} consolidacion(es)</span>
            )}
          </p>
        </div>
        <button
          onClick={() => loadData(userId)}
          className="flex items-center gap-2 px-4 py-2 bg-nadin-pink text-white rounded-lg hover:bg-nadin-pink-dark"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* SECCION 1: PEDIDOS SIN CONSOLIDAR - NUEVO */}
      {pedidosSinConsolidar.length > 0 && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-t-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle size={24} />
                <div>
                  <h2 className="text-xl font-bold">Pedidos sin consolidar</h2>
                  <p className="text-yellow-100 text-sm">Estos pedidos estan listos para consolidar</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/dashboard/consolidar')}
                className="bg-white text-yellow-600 px-4 py-2 rounded-lg hover:bg-yellow-50 font-semibold"
              >
                Ir a Consolidar
              </button>
            </div>
          </div>

          <div className="bg-white rounded-b-lg shadow-lg p-6 space-y-4">
            {pedidosSinConsolidar.map((pedido) => {
              const estaPedidoExpandido = expandedPedido === pedido.id;
              const totalVenta = pedido.lineas.reduce((sum, l) => sum + (l.venta * l.qty), 0);
              const costoMayorista = pedido.lineas.reduce((sum, l) => sum + (l.mayorista * l.qty), 0);
              const ganancia = totalVenta - costoMayorista;

              return (
                <div key={pedido.id} className="border-2 border-yellow-200 rounded-lg overflow-hidden hover:border-yellow-400 transition-colors">
                  <div
                    className="bg-white p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedPedido(estaPedidoExpandido ? null : pedido.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg">
                            {pedido.cliente}
                          </h3>
                          <StatusBadge status={pedido.orderStatus || 'pending'} />
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {pedido.telefono && (
                            <div className="flex items-center gap-1">
                              <Phone size={16} />
                              <span>{pedido.telefono}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar size={16} />
                            <span>{formatearFecha(pedido.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package size={16} />
                            <span>{pedido.lineas.length} productos</span>
                          </div>
                        </div>

                        {pedido.nota && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                            <strong>Nota:</strong> {pedido.nota}
                          </div>
                        )}
                      </div>

                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-nadin-pink">
                          {formatCurrency(totalVenta)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Ganancia: {formatCurrency(ganancia)}
                        </div>
                        {estaPedidoExpandido ? (
                          <ChevronUp size={20} className="ml-auto mt-2 text-gray-400" />
                        ) : (
                          <ChevronDown size={20} className="ml-auto mt-2 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Productos del pedido */}
                  {estaPedidoExpandido && (
                    <div className="bg-gray-50 p-4 border-t">
                      <h4 className="font-semibold mb-3">Productos:</h4>
                      <div className="space-y-2">
                        {pedido.lineas.map((linea) => (
                          <div key={linea.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{linea.name}</p>
                              <p className="text-sm text-gray-600">
                                {linea.brand} - Talle {linea.talle} - {linea.color}
                              </p>
                              <p className="text-xs text-gray-500 font-mono">SKU: {linea.sku}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {linea.qty} x {formatCurrency(linea.venta)}
                              </p>
                              <p className="text-sm text-gray-600">
                                = {formatCurrency(linea.venta * linea.qty)}
                              </p>
                            </div>
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

      {/* SECCION 2: CONSOLIDACIONES - YA EXISTIA */}
      {consolidaciones.length === 0 && pedidosSinConsolidar.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No tenes pedidos</h3>
          <p className="text-gray-500 mb-6">Crea tu primer pedido para comenzar</p>
          <button
            onClick={() => router.push('/dashboard/catalogo')}
            className="bg-nadin-pink text-white px-6 py-3 rounded-lg hover:bg-nadin-pink-dark font-semibold"
          >
            Ir al Catalogo
          </button>
        </div>
      ) : consolidaciones.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Consolidaciones</h2>
            <span className="text-gray-600">{consolidaciones.length} consolidacion(es)</span>
          </div>

          {consolidaciones.map((consolidacion) => {
            const estaExpandida = expandedConsolidacion === consolidacion.id;
            const totalPedidos = consolidacion.pedidos.length;
            const totalProductos = consolidacion.pedidos.reduce((sum, p) => sum + p.lineas.length, 0);

            return (
              <div key={consolidacion.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header de consolidacion */}
                <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold">
                          Consolidacion #{consolidacion.id.slice(-8)}
                        </h2>
                        <StatusBadge status={consolidacion.pedidos[0]?.orderStatus || 'pending'} />
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <div className="text-pink-100 text-sm">Pedidos</div>
                          <div className="text-2xl font-bold flex items-center gap-2">
                            <Users size={20} />
                            {totalPedidos}
                          </div>
                        </div>
                        <div>
                          <div className="text-pink-100 text-sm">Productos</div>
                          <div className="text-2xl font-bold flex items-center gap-2">
                            <Package size={20} />
                            {totalProductos}
                          </div>
                        </div>
                        <div>
                          <div className="text-pink-100 text-sm">Enviado</div>
                          <div className="text-lg font-semibold">
                            {new Date(consolidacion.enviadoAt).toLocaleDateString('es-AR')}
                          </div>
                        </div>
                        <div>
                          <div className="text-pink-100 text-sm">Estado</div>
                          <div className="text-lg font-semibold">
                            {consolidacion.pagadoEn ? '✅ Pagado' : '⏳ Pendiente'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedConsolidacion(estaExpandida ? null : consolidacion.id)}
                      className="bg-white text-pink-600 px-4 py-2 rounded-lg hover:bg-pink-50 flex items-center gap-2 font-semibold"
                    >
                      {estaExpandida ? (
                        <>
                          Ocultar <ChevronUp size={18} />
                        </>
                      ) : (
                        <>
                          Ver detalle <ChevronDown size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Resumen financiero */}
                <div className="bg-gray-50 px-6 py-4 border-b grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Venta</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(consolidacion.totalVenta)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Costo {consolidacion.costoReal ? 'Real' : 'Mayorista'}</div>
                    <div className="text-2xl font-bold text-gray-700">
                      {formatCurrency(consolidacion.costoReal || consolidacion.totalMayorista)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Ganancia {consolidacion.gananciaNeta ? 'Real' : 'Estimada'}</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(consolidacion.gananciaNeta || consolidacion.ganancia)}
                    </div>
                  </div>
                </div>

                {/* Detalle de pedidos */}
                {estaExpandida && (
                  <div className="p-6 space-y-4">
                    {consolidacion.pedidos.map((pedido) => {
                      const estaPedidoExpandido = expandedPedido === pedido.id;
                      const totalVenta = pedido.lineas.reduce((sum, l) => sum + (l.venta * l.qty), 0);
                      const costoMayorista = pedido.lineas.reduce((sum, l) => sum + (l.mayorista * l.qty), 0);
                      const ganancia = totalVenta - costoMayorista;

                      return (
                        <div key={pedido.id} className="border rounded-lg overflow-hidden">
                          <div
                            className="bg-white p-4 cursor-pointer hover:bg-gray-50"
                            onClick={() => setExpandedPedido(estaPedidoExpandido ? null : pedido.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-bold text-lg">
                                    {pedido.cliente}
                                  </h3>
                                  <StatusBadge status={pedido.orderStatus || 'pending'} />
                                </div>
                                
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                  {pedido.telefono && (
                                    <div className="flex items-center gap-1">
                                      <Phone size={16} />
                                      <span>{pedido.telefono}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Calendar size={16} />
                                    <span>{formatearFecha(pedido.createdAt)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Package size={16} />
                                    <span>{pedido.lineas.length} productos</span>
                                  </div>
                                </div>

                                {pedido.nota && (
                                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                    <strong>Nota:</strong> {pedido.nota}
                                  </div>
                                )}
                              </div>

                              <div className="text-right ml-4">
                                <div className="text-2xl font-bold text-nadin-pink">
                                  {formatCurrency(totalVenta)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Ganancia: {formatCurrency(ganancia)}
                                </div>
                                {estaPedidoExpandido ? (
                                  <ChevronUp size={20} className="ml-auto mt-2 text-gray-400" />
                                ) : (
                                  <ChevronDown size={20} className="ml-auto mt-2 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Productos del pedido */}
                          {estaPedidoExpandido && (
                            <div className="bg-gray-50 p-4 border-t">
                              <h4 className="font-semibold mb-3">Productos:</h4>
                              <div className="space-y-2">
                                {pedido.lineas.map((linea) => (
                                  <div key={linea.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                    <div className="flex-1">
                                      <p className="font-medium">{linea.name}</p>
                                      <p className="text-sm text-gray-600">
                                        {linea.brand} - Talle {linea.talle} - {linea.color}
                                      </p>
                                      <p className="text-xs text-gray-500 font-mono">SKU: {linea.sku}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold">
                                        {linea.qty} x {formatCurrency(linea.venta)}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        = {formatCurrency(linea.venta * linea.qty)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
