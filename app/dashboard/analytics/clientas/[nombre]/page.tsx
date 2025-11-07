'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  User, Phone, Calendar, ShoppingBag, DollarSign, 
  Package, TrendingUp, Clock, Award, AlertTriangle,
  TrendingDown, Minus
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import BackToHomeButton from '@/components/BackToHomeButton';

interface ClientaDetail {
  nombre: string;
  telefono: string | null;
  metricas: {
    totalPedidos: number;
    totalCompras: number;
    totalProductos: number;
    ticketPromedio: number;
    primeraCompra: Date;
    ultimaCompra: Date;
    frecuenciaPromedio: number;
    // Nuevas métricas
    comprasUltimos30Dias: number;
    comprasUltimos90Dias: number;
    pedidosUltimos30Dias: number;
    pedidosUltimos90Dias: number;
    diasSinComprar: number;
    estado: 'activa' | 'regular' | 'inactiva' | 'riesgo';
  };
  productosFavoritos: Array<{
    nombre: string;
    brand: string;
    cantidad: number;
    totalGastado: number;
  }>;
  historialMensual: Array<{
    mes: string;
    total: number;
  }>;
  historialPedidos: Array<{
    id: string;
    fecha: Date;
    estado: string;
    totalProductos: number;
    totalVenta: number;
    productos: Array<{
      nombre: string;
      talle: string | null;
      color: string | null;
      cantidad: number;
      precio: number;
    }>;
  }>;
}

export default function ClientaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clienteNombre = decodeURIComponent(params?.nombre as string);
  
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [clienta, setClienta] = useState<ClientaDetail | null>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }
      const user = JSON.parse(userStr);
      setUserId(user.id);
      loadClientaDetail(user.id);
    } catch (error) {
      // Server-side rendering, no localStorage available
      router.push('/login');
    }
  }, []);

  const loadClientaDetail = async (uid: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/clientas?userId=${uid}&cliente=${encodeURIComponent(clienteNombre)}`
      );
      
      if (!response.ok) {
        throw new Error('Error al cargar detalle de clienta');
      }

      const data = await response.json();
      setClienta(data);
    } catch (err) {
      console.error('Error:', err);
      alert('Error al cargar detalle de clienta');
      router.push('/dashboard/analytics/clientas');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'enviado': 'bg-blue-100 text-blue-800',
      'entregado': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      activa: { bg: 'bg-green-500', text: 'text-white', label: '🟢 Activa' },
      regular: { bg: 'bg-yellow-500', text: 'text-white', label: '🟡 Regular' },
      inactiva: { bg: 'bg-orange-500', text: 'text-white', label: '🟠 Inactiva' },
      riesgo: { bg: 'bg-red-500', text: 'text-white', label: '🔴 En Riesgo' }
    };
    return badges[estado as keyof typeof badges] || badges.regular;
  };

  // Calcular tendencia
  const getTendencia = (clienta: ClientaDetail) => {
    const ticketUltimos30 = clienta.metricas.pedidosUltimos30Dias > 0
      ? clienta.metricas.comprasUltimos30Dias / clienta.metricas.pedidosUltimos30Dias
      : 0;
    
    if (ticketUltimos30 === 0) return 'bajando';
    if (ticketUltimos30 > clienta.metricas.ticketPromedio * 1.2) return 'subiendo';
    if (ticketUltimos30 < clienta.metricas.ticketPromedio * 0.8) return 'bajando';
    return 'estable';
  };

  if (loading || !clienta) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
            <p className="mt-4 text-gray-600">Cargando detalle...</p>
          </div>
        </div>
      </div>
    );
  }

  const { metricas, productosFavoritos, historialMensual, historialPedidos } = clienta;
  const estadoBadge = getEstadoBadge(metricas.estado);
  const tendencia = getTendencia(clienta);

  return (
    <div className="max-w-7xl mx-auto p-4 pb-24">
      <BackToHomeButton url="/dashboard/analytics/clientas" />

      {/* Alerta de Inactividad */}
      {(metricas.estado === 'inactiva' || metricas.estado === 'riesgo') && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={32} />
            <div>
              <h3 className="text-lg font-bold text-red-800">
                ⚠️ Clienta {metricas.estado === 'riesgo' ? 'en Riesgo' : 'Inactiva'}
              </h3>
              <p className="text-red-700">
                Hace <strong>{metricas.diasSinComprar} días</strong> que no compra. 
                {metricas.diasSinComprar > 60 && ' ¡Es momento de contactarla!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header de Clienta */}
      <div className="bg-gradient-to-r from-nadin-pink to-pink-400 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <User size={32} />
              <h1 className="text-3xl font-bold">{clienta.nombre}</h1>
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${estadoBadge.bg} ${estadoBadge.text}`}>
                {estadoBadge.label}
              </span>
            </div>
            {clienta.telefono && (
              <div className="flex items-center gap-2 text-pink-100">
                <Phone size={16} />
                {clienta.telefono}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatCurrency(metricas.totalCompras)}</div>
            <div className="text-pink-100">Total histórico</div>
          </div>
        </div>
      </div>

      {/* Métricas de Actividad */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-nadin-pink" size={20} />
            <span className="text-sm text-gray-600">Última compra</span>
          </div>
          <div className="text-xl font-bold">{formatDate(metricas.ultimaCompra)}</div>
          <div className={`text-sm mt-1 ${metricas.diasSinComprar > 30 ? 'text-red-500 font-bold' : 'text-gray-600'}`}>
            {metricas.diasSinComprar === 0 ? 'Hoy' : `Hace ${metricas.diasSinComprar} días`}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={20} className="text-blue-600" />
            <span className="text-sm text-gray-600">Frecuencia</span>
          </div>
          <div className="text-xl font-bold">
            {metricas.frecuenciaPromedio > 0 ? `${Math.round(metricas.frecuenciaPromedio)} días` : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Entre compras</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-2">
            {tendencia === 'subiendo' && <TrendingUp size={20} className="text-green-600" />}
            {tendencia === 'bajando' && <TrendingDown size={20} className="text-red-600" />}
            {tendencia === 'estable' && <Minus size={20} className="text-gray-600" />}
            <span className="text-sm text-gray-600">Tendencia</span>
          </div>
          <div className="text-xl font-bold">
            {tendencia === 'subiendo' && 'Subiendo 📈'}
            {tendencia === 'bajando' && 'Bajando 📉'}
            {tendencia === 'estable' && 'Estable →'}
          </div>
          <div className="text-sm text-gray-600">
            vs. su promedio
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-green-600" size={20} />
            <span className="text-sm text-gray-600">Últimos 30 días</span>
          </div>
          <div className="text-xl font-bold">{formatCurrency(metricas.comprasUltimos30Dias)}</div>
          <div className="text-sm text-gray-600">
            {metricas.pedidosUltimos30Dias} {metricas.pedidosUltimos30Dias === 1 ? 'pedido' : 'pedidos'}
          </div>
        </div>
      </div>

      {/* Métricas Generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="text-nadin-pink" size={20} />
            <span className="text-sm text-gray-600">Pedidos</span>
          </div>
          <div className="text-2xl font-bold">{metricas.totalPedidos}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="text-blue-600" size={20} />
            <span className="text-sm text-gray-600">Productos</span>
          </div>
          <div className="text-2xl font-bold">{metricas.totalProductos}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-green-600" size={20} />
            <span className="text-sm text-gray-600">Ticket Promedio</span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(metricas.ticketPromedio)}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="text-purple-600" size={20} />
            <span className="text-sm text-gray-600">Primera Compra</span>
          </div>
          <div className="text-lg font-bold">{formatDate(metricas.primeraCompra)}</div>
        </div>
      </div>

      {/* Comparación de Períodos */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">📊 Análisis de Períodos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-2">Últimos 30 días</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metricas.comprasUltimos30Dias)}
            </div>
            <div className="text-sm text-gray-600">
              {metricas.pedidosUltimos30Dias} {metricas.pedidosUltimos30Dias === 1 ? 'pedido' : 'pedidos'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {metricas.totalPedidos > 0 
                ? `${Math.round((metricas.pedidosUltimos30Dias / metricas.totalPedidos) * 100)}% del total`
                : '0% del total'}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-2">Últimos 90 días</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(metricas.comprasUltimos90Dias)}
            </div>
            <div className="text-sm text-gray-600">
              {metricas.pedidosUltimos90Dias} {metricas.pedidosUltimos90Dias === 1 ? 'pedido' : 'pedidos'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {metricas.totalPedidos > 0 
                ? `${Math.round((metricas.pedidosUltimos90Dias / metricas.totalPedidos) * 100)}% del total`
                : '0% del total'}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-2">Total histórico</div>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(metricas.totalCompras)}
            </div>
            <div className="text-sm text-gray-600">
              {metricas.totalPedidos} {metricas.totalPedidos === 1 ? 'pedido' : 'pedidos'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Desde {formatDate(metricas.primeraCompra)}
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Compras por Mes */}
      {historialMensual.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="text-nadin-pink" size={20} />
            Historial de Compras
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={historialMensual}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#E91E63" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Productos Favoritos */}
      {productosFavoritos.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Award className="text-nadin-pink" size={20} />
            Productos Favoritos
          </h3>
          <div className="space-y-3">
            {productosFavoritos.map((producto, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{producto.nombre}</div>
                  <div className="text-sm text-gray-600">{producto.brand}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-nadin-pink">{producto.cantidad} unidades</div>
                  <div className="text-sm text-gray-600">{formatCurrency(producto.totalGastado)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial de Pedidos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <ShoppingBag className="text-nadin-pink" size={20} />
          Historial de Pedidos ({historialPedidos.length})
        </h3>

        <div className="space-y-4">
          {historialPedidos.map((pedido) => (
            <div key={pedido.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium text-gray-900">{formatDate(pedido.fecha)}</div>
                  <div className="text-sm text-gray-600">
                    {pedido.totalProductos} {pedido.totalProductos === 1 ? 'producto' : 'productos'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(pedido.totalVenta)}
                  </div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(pedido.estado)}`}>
                    {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
                  </span>
                </div>
              </div>

              {/* Lista de productos del pedido */}
              <div className="border-t border-gray-200 pt-3 space-y-2">
                {pedido.productos.map((producto, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{producto.nombre}</span>
                      {(producto.talle || producto.color) && (
                        <span className="text-gray-500 ml-2">
                          {[producto.talle, producto.color].filter(Boolean).join(' - ')}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-gray-600">x{producto.cantidad}</span>
                      <span className="ml-3 font-medium">
                        {formatCurrency(producto.precio * producto.cantidad)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
