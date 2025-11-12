'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, ShoppingBag, DollarSign, TrendingUp, 
  Award, Package, Calendar, AlertCircle, CheckCircle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import BackToHomeButton from '@/components/BackToHomeButton';

interface Analytics {
  metricas: {
    totalPedidos: number;
    totalVentas: number;
    totalGanancia: number;
    totalClientas: number;
    ticketPromedio: number;
  };
  topClientas: Array<{
    nombre: string;
    totalCompras: number;
    cantidadPedidos: number;
    ultimaCompra: Date;
  }>;
  ventasMensuales: Array<{
    mes: string;
    total: number;
  }>;
  topProductos: Array<{
    nombre: string;
    brand: string;
    cantidadVendida: number;
    totalVentas: number;
  }>;
  pedidosPorEstado: Record<string, number>;
  periodo: string;
}

interface Consolidacion {
  id: string;
  totalMayorista: number;
  totalVenta: number;
  ganancia: number;
  descuentoTotal: number;
  costoReal?: number;
  gananciaNeta?: number;
  enviadoAt: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [consolidaciones, setConsolidaciones] = useState<Consolidacion[]>([]);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    const userStr = (globalThis as any).localStorage?.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userStr);
    setUserId(user.id);
    loadData(user.id, period);
  }, [period]);

  const loadData = async (uid: string, selectedPeriod: string) => {
    try {
      setLoading(true);
      
      // Cargar analytics existentes
      const analyticsRes = await fetch(`/api/analytics?userId=${uid}&period=${selectedPeriod}`);
      if (!analyticsRes.ok) throw new Error('Error al cargar analytics');
      const analyticsData = await analyticsRes.json() as Analytics;
      setAnalytics(analyticsData);

      // Cargar consolidaciones para ganancias reales
      const consRes = await fetch(`/api/consolidar?userId=${uid}`);
      if (consRes.ok) {
        const consData = await consRes.json();
        setConsolidaciones(consData);
      }
    } catch (err) {
      console.error('Error:', err);
      (globalThis as any).alert?.('Error al cargar analytics');
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

  // 💰 Calcular ganancias reales vs estimadas
  const consolidacionesConPago = consolidaciones.filter(c => c.costoReal !== null && c.costoReal !== undefined);
  const consolidacionesSinPago = consolidaciones.filter(c => c.costoReal === null || c.costoReal === undefined);
  
  const gananciaNetaReal = consolidacionesConPago.reduce((sum, c) => sum + (c.gananciaNeta || 0), 0);
  const gananciaEstimada = consolidacionesSinPago.reduce((sum, c) => sum + c.ganancia, 0);

  if (loading || !analytics) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
            <p className="mt-4 text-gray-600">Cargando analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  const { metricas, topClientas, ventasMensuales, topProductos, pedidosPorEstado } = analytics;

  return (
    <div className="max-w-7xl mx-auto p-4 pb-24">
      <BackToHomeButton />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">📊 Analytics</h1>
          <p className="text-gray-600">Análisis de tus ventas y clientas</p>
        </div>

        {/* Selector de período */}
        <select
          value={period}
          onChange={(e) => setPeriod((e.target as any).value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
        >
          <option value="all">Todo el tiempo</option>
          <option value="month">Este mes</option>
          <option value="year">Este año</option>
        </select>
      </div>

      {/* 🆕 Alerta de consolidaciones sin pago */}
      {consolidacionesSinPago.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
            <div className="flex-1">
              <p className="font-semibold text-yellow-800 mb-1">
                ⚠️ Tenés {consolidacionesSinPago.length} consolidación(es) sin pago registrado
              </p>
              <p className="text-sm text-yellow-700 mb-2">
                Las ganancias mostradas pueden no reflejar tu ganancia real. Registrá el monto que pagaste a Nadin.
              </p>
              <a 
                href="/consolidaciones"
                className="text-sm font-semibold text-yellow-800 underline hover:text-yellow-900"
              >
                → Ir a registrar pagos
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-nadin-pink" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {metricas.totalClientas}
          </div>
          <div className="text-sm text-gray-600">Clientas</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <ShoppingBag className="text-blue-600" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {metricas.totalPedidos}
          </div>
          <div className="text-sm text-gray-600">Pedidos</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="text-green-600" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(metricas.totalVentas)}
          </div>
          <div className="text-sm text-gray-600">Total Ventas</div>
        </div>

        {/* 🆕 Card de Ganancia con diferenciación */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-purple-600" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(metricas.totalGanancia)}
          </div>
          <div className="text-sm text-gray-600">Ganancia Total</div>
          {consolidaciones.length > 0 && (
            <div className="mt-2 pt-2 border-t text-xs">
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle size={12} />
                <span>Real: {formatCurrency(gananciaNetaReal)}</span>
              </div>
              {gananciaEstimada > 0 && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <AlertCircle size={12} />
                  <span>Est: {formatCurrency(gananciaEstimada)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Package className="text-orange-600" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(metricas.ticketPromedio)}
          </div>
          <div className="text-sm text-gray-600">Ticket Promedio</div>
        </div>
      </div>

      {/* Gráfico de Ventas Mensuales */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Calendar className="text-nadin-pink" size={20} />
          Ventas por Mes (últimos 6 meses)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={ventasMensuales}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="mes" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `Mes: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="#E91E63" 
              strokeWidth={2}
              name="Ventas"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Clientas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Award className="text-nadin-pink" size={20} />
              Top 10 Clientas
            </h3>
            <a 
              href="/dashboard/analytics/clientas"
              className="text-sm text-nadin-pink hover:underline"
            >
              Ver todas →
            </a>
          </div>

          <div className="space-y-3">
            {topClientas.map((clienta, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => router.push(`/dashboard/analytics/clientas/${encodeURIComponent(clienta.nombre)}`)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-600' :
                    'bg-nadin-pink'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{clienta.nombre}</div>
                    <div className="text-xs text-gray-500">
                      {clienta.cantidadPedidos} pedidos
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    {formatCurrency(clienta.totalCompras)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(clienta.ultimaCompra)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Productos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Package className="text-nadin-pink" size={20} />
            Productos Más Vendidos
          </h3>

          <div className="space-y-3">
            {topProductos.map((producto, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{producto.nombre}</div>
                    <div className="text-xs text-gray-500">{producto.brand}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-nadin-pink">
                      {producto.cantidadVendida} unidades
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatCurrency(producto.totalVentas)}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-nadin-pink h-2 rounded-full"
                    style={{ 
                      width: `${(producto.cantidadVendida / topProductos[0].cantidadVendida) * 100}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Estados de Pedidos */}
      {Object.keys(pedidosPorEstado).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ShoppingBag className="text-nadin-pink" size={20} />
            Pedidos por Estado
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(pedidosPorEstado).map(([estado, cantidad]) => (
              <div key={estado} className="p-4 bg-gray-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-nadin-pink">{cantidad}</div>
                <div className="text-sm text-gray-600 capitalize">{estado}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🆕 Info sobre ganancias */}
      {consolidaciones.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Acerca de las ganancias</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>
              <strong>Ganancia Real:</strong> Calculada con el monto que pagaste a Nadin (incluye descuentos, comisiones, etc.)
            </li>
            <li>
              <strong>Ganancia Estimada:</strong> Basada en precios mayoristas del catálogo (puede diferir del monto real)
            </li>
            {consolidacionesSinPago.length > 0 && (
              <li className="text-yellow-700">
                <strong>⚠️ Importante:</strong> Registrá el pago real en tus consolidaciones para estadísticas precisas
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
