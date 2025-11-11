'use client';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/precios';
import { Package, Calendar, User, Phone, FileText, ChevronDown, ChevronUp, CheckCircle, Clock, Send, Truck, DollarSign, XCircle } from 'lucide-react';
import BackToHomeButton from '@/components/BackToHomeButton';
import CancelarPedidoButton from '@/components/CancelarPedidoButton';

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

interface Pedido {
  id: string;
  cliente: string;
  telefono: string;
  nota: string;
  estado: string;
  orderStatus: string;
  paidToNadin: boolean;
  paidByClient: boolean;
  montoRealPagado: number | null;
  createdAt: string;
  lineas: PedidoLinea[];
}

// Configuración de estados
const ORDER_STATUSES = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  sent_to_nadin: { label: 'Enviado a Nadin', color: 'bg-blue-100 text-blue-800', icon: Send },
  received_nadin: { label: 'Recibido en Nadin', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  sent_to_client: { label: 'Enviado al Cliente', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Entregado', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle }
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPedido, setExpandedPedido] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [editingMontoReal, setEditingMontoReal] = useState<string | null>(null);
  const [tempMontoReal, setTempMontoReal] = useState<string>('');

  useEffect(() => {
    const userStr = (globalThis as any).localStorage?.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserId(user.id);
      loadPedidos(user.id);
    } else {
      setError('Usuario no encontrado');
      setLoading(false);
    }
  }, []);

  const loadPedidos = async (uid: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pedidos?userId=${uid}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar pedidos');
      }

      const data = await response.json() as any;
      setPedidos(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, updates: any) => {
    try {
      setUpdatingOrder(orderId);
      
      const response = await fetch('/api/pedidos/update-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, ...updates })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar estado');
      }

      const updatedOrder = await response.json() as any;
      
      // Actualizar el pedido en el estado local
      setPedidos(prev => prev.map(p => 
        p.id === orderId 
          ? { ...p, ...updatedOrder }
          : p
      ));

      console.log('✅ Estado actualizado correctamente');
    } catch (err) {
      console.error('Error:', err);
      (globalThis as any).alert?.('Error al actualizar el estado del pedido');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleEditMontoReal = (pedidoId: string, currentMonto: number | null) => {
    setEditingMontoReal(pedidoId);
    setTempMontoReal(currentMonto?.toString() || '');
  };

  const handleSaveMontoReal = async (pedidoId: string) => {
    const montoReal = tempMontoReal.trim() === '' ? null : parseFloat(tempMontoReal);
    
    if (montoReal !== null && (isNaN(montoReal) || montoReal < 0)) {
      (globalThis as any).alert?.('Ingresá un monto válido');
      return;
    }

    await updateOrderStatus(pedidoId, { montoRealPagado: montoReal });
    setEditingMontoReal(null);
    setTempMontoReal('');
  };

  const handleCancelEditMontoReal = () => {
    setEditingMontoReal(null);
    setTempMontoReal('');
  };

  const calcularTotalPedido = (lineas: PedidoLinea[]) => {
    return lineas.reduce((sum, linea) => sum + (linea.venta * linea.qty), 0);
  };

  const calcularCostoMayorista = (lineas: PedidoLinea[]) => {
    return lineas.reduce((sum, linea) => sum + (linea.mayorista * linea.qty), 0);
  };

  const calcularGananciaPedido = (lineas: PedidoLinea[], montoRealPagado: number | null) => {
    const totalVenta = calcularTotalPedido(lineas);
    const costoBase = calcularCostoMayorista(lineas);
    
    // Si hay monto real pagado, usar ese; sino usar costo mayorista
    const costoReal = montoRealPagado !== null ? montoRealPagado : costoBase;
    
    return totalVenta - costoReal;
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => userId && loadPedidos(userId)}
            className="mt-4 bg-nadin-pink text-white px-6 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 pb-24">
      <BackToHomeButton />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Mis Pedidos</h2>
          <p className="text-sm text-gray-600">Historial de pedidos realizados</p>
        </div>
        <button
          onClick={() => userId && loadPedidos(userId)}
          className="text-nadin-pink hover:text-nadin-pink-dark font-medium text-sm"
        >
          🔄 Actualizar
        </button>
      </div>

      {pedidos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Package size={48} className="mx-auto mb-3 text-gray-400" />
          <p className="text-lg text-gray-600 mb-2">No hay pedidos aún</p>
          <p className="text-sm text-gray-500">Tus pedidos aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => {
            const estaCancelado = pedido.estado === 'cancelado';
            const costoMayorista = calcularCostoMayorista(pedido.lineas);
            const totalVenta = calcularTotalPedido(pedido.lineas);
            const gananciaReal = calcularGananciaPedido(pedido.lineas, pedido.montoRealPagado);
            
            return (
              <div 
                key={pedido.id} 
                className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow ${
                  estaCancelado ? 'opacity-60' : ''
                }`}
              >
                {/* Header del pedido con estados */}
                <div className="p-4">
                  {/* Badges de estado superiores */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {/* Badge de cancelado (si aplica) */}
                    {estaCancelado ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle size={14} />
                        CANCELADO
                      </span>
                    ) : (
                      <StatusBadge status={pedido.orderStatus || 'pending'} />
                    )}
                    
                    {/* Badge de pago a Nadin */}
                    {!estaCancelado && (
                      pedido.paidToNadin ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle size={14} />
                          Pagado a Nadin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <Clock size={14} />
                          Debe pagar a Nadin
                        </span>
                      )
                    )}

                    {/* Badge de pago del cliente */}
                    {!estaCancelado && (
                      pedido.paidByClient ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <DollarSign size={14} />
                          Cliente pagó
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <Clock size={14} />
                          Cliente debe pagar
                        </span>
                      )
                    )}
                  </div>

                  {/* Info del pedido */}
                  <div 
                    className="cursor-pointer"
                    onClick={() => setExpandedPedido(expandedPedido === pedido.id ? null : pedido.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                            estaCancelado ? 'bg-gray-400 text-white' : 'bg-nadin-pink text-white'
                          }`}>
                            <Package size={16} />
                            Pedido #{pedido.id.slice(0, 8)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatearFecha(pedido.createdAt)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User size={16} />
                            <span className="font-medium">{pedido.cliente}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone size={16} />
                            <span>{pedido.telefono}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <FileText size={16} />
                            <span>{pedido.lineas.length} producto{pedido.lineas.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right ml-4">
                        <p className={`text-2xl font-bold ${estaCancelado ? 'text-gray-400 line-through' : 'text-nadin-pink'}`}>
                          {formatCurrency(totalVenta)}
                        </p>
                        {!estaCancelado && (
                          <>
                            <p className="text-sm text-green-600 font-semibold">
                              Ganancia: {formatCurrency(gananciaReal)}
                            </p>
                            {pedido.montoRealPagado !== null && (
                              <p className="text-xs text-gray-500">
                                (Monto real pagado)
                              </p>
                            )}
                          </>
                        )}
                        <div className="mt-2">
                          {expandedPedido === pedido.id ? (
                            <ChevronUp size={20} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={20} className="text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {pedido.nota && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Nota:</strong> {pedido.nota}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Gestión de estados - Solo si NO está cancelado */}
                  {!estaCancelado && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Cambiar estado del pedido */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estado del Pedido
                          </label>
                          <select
                            value={pedido.orderStatus || 'pending'}
                            onChange={(e) => updateOrderStatus(pedido.id, { orderStatus: (e.target as any).value })}
                            disabled={updatingOrder === pedido.id}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-nadin-pink focus:border-transparent disabled:bg-gray-100 disabled:cursor-wait"
                          >
                            {Object.entries(ORDER_STATUSES).map(([key, value]) => (
                              <option key={key} value={key}>{value.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Estado de pago a Nadin */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pago a Nadin
                          </label>
                          <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={pedido.paidToNadin}
                              onChange={(e) => updateOrderStatus(pedido.id, { paidToNadin: (e.target as any).checked })}
                              disabled={updatingOrder === pedido.id}
                              className="w-4 h-4 text-nadin-pink border-gray-300 rounded focus:ring-nadin-pink disabled:cursor-wait"
                            />
                            <span className="text-sm">
                              {pedido.paidToNadin ? '✅ Pagado' : '⏳ Pendiente'}
                            </span>
                          </label>
                        </div>

                        {/* Estado de pago del cliente */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cobro al Cliente
                          </label>
                          <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={pedido.paidByClient}
                              onChange={(e) => updateOrderStatus(pedido.id, { paidByClient: (e.target as any).checked })}
                              disabled={updatingOrder === pedido.id}
                              className="w-4 h-4 text-nadin-pink border-gray-300 rounded focus:ring-nadin-pink disabled:cursor-wait"
                            />
                            <span className="text-sm">
                              {pedido.paidByClient ? '✅ Cobrado' : '⏳ Pendiente'}
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* 💰 MONTO REAL PAGADO A NADIN */}
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          💰 Monto Real Pagado a Nadin
                        </label>
                        <p className="text-xs text-gray-600 mb-3">
                          Costo mayorista: {formatCurrency(costoMayorista)} | 
                          {pedido.montoRealPagado !== null 
                            ? ` Monto real: ${formatCurrency(pedido.montoRealPagado)}`
                            : ' No especificado (usa costo mayorista)'
                          }
                        </p>

                        {editingMontoReal === pedido.id ? (
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={tempMontoReal}
                              onChange={(e) => setTempMontoReal((e.target as any).value)}
                              placeholder="Ingresá el monto real"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
                              step="0.01"
                              min="0"
                            />
                            <button
                              onClick={() => handleSaveMontoReal(pedido.id)}
                              disabled={updatingOrder === pedido.id}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-wait"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={handleCancelEditMontoReal}
                              disabled={updatingOrder === pedido.id}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:cursor-wait"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditMontoReal(pedido.id, pedido.montoRealPagado)}
                            disabled={updatingOrder === pedido.id}
                            className="w-full px-4 py-2 bg-nadin-pink text-white rounded-lg hover:bg-nadin-pink-dark disabled:bg-gray-400 disabled:cursor-wait"
                          >
                            {pedido.montoRealPagado !== null ? 'Editar Monto Real' : 'Agregar Monto Real'}
                          </button>
                        )}
                      </div>

                      {/* 🆕 BOTÓN DE CANCELAR */}
                      <div className="flex justify-end">
                        <CancelarPedidoButton 
                          pedidoId={pedido.id}
                          onCancel={() => loadPedidos(userId)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Mensaje si está cancelado */}
                  {estaCancelado && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 text-center">
                          ⚠️ Este pedido fue cancelado y no cuenta para estadísticas ni gamificación
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Detalle del pedido (expandible) */}
                {expandedPedido === pedido.id && (
                  <div className="border-t">
                    <div className="p-4">
                      <h4 className="font-semibold mb-3">Productos del pedido:</h4>
                      <div className="space-y-2">
                        {pedido.lineas.map((linea) => (
                          <div key={linea.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{linea.name}</p>
                              <p className="text-sm text-gray-600">
                                {linea.brand} • Talle {linea.talle} • {linea.color}
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
