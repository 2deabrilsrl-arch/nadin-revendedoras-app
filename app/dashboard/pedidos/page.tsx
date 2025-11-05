'use client';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/precios';
import { Package, Calendar, User, Phone, FileText, ChevronDown, ChevronUp } from 'lucide-react';

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
  createdAt: string;
  lineas: PedidoLinea[];
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPedido, setExpandedPedido] = useState<string | null>(null);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
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

      const data = await response.json();
      setPedidos(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const calcularTotalPedido = (lineas: PedidoLinea[]) => {
    return lineas.reduce((sum, linea) => sum + (linea.venta * linea.qty), 0);
  };

  const calcularGananciaPedido = (lineas: PedidoLinea[]) => {
    const totalVenta = lineas.reduce((sum, linea) => sum + (linea.venta * linea.qty), 0);
    const totalMayorista = lineas.reduce((sum, linea) => sum + (linea.mayorista * linea.qty), 0);
    return totalVenta - totalMayorista;
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
    <div className="max-w-6xl mx-auto p-4">
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
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              {/* Header del pedido */}
              <div 
                className="p-4 cursor-pointer"
                onClick={() => setExpandedPedido(expandedPedido === pedido.id ? null : pedido.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center gap-2 bg-nadin-pink text-white px-3 py-1 rounded-full text-sm font-medium">
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
                    <p className="text-2xl font-bold text-nadin-pink">
                      {formatCurrency(calcularTotalPedido(pedido.lineas))}
                    </p>
                    <p className="text-sm text-green-600">
                      Ganancia: {formatCurrency(calcularGananciaPedido(pedido.lineas))}
                    </p>
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
          ))}
        </div>
      )}
    </div>
  );
}
