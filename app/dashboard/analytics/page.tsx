// ANALYTICS PAGE - COMPLETA CON GAMIFICACIÓN
// Ubicación: app/dashboard/analytics/page.tsx
// VERSIÓN: Completa con todas las secciones restauradas

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, ShoppingBag, DollarSign, TrendingUp, 
  Award, Package, Calendar, AlertCircle, CheckCircle,
  Trophy, Star
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
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
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [consolidaciones, setConsolidaciones] = useState<Consolidacion[]>([]);
  const [period, setPeriod] = useState('all');
  
  // ✅ Estados para gamificación
  const [userLevel, setUserLevel] = useState<any>(null);
  const [loadingGamification, setLoadingGamification] = useState(false);

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
        const consData = await consRes.json() as Consolidacion[];
        setConsolidaciones(consData);
      }
      
      // ✅ Cargar gamificación
      try {
        setLoadingGamification(true);
        const gamRes = await fetch(`/api/user-level?userId=${uid}`);
        if (gamRes.ok) {
          const gamData = await gamRes.json() as any;
          console.log('✅ Gamificación cargada:', gamData);
          setUserLevel(gamData.userLevel);
        } else {
          console.log('⚠️ No se pudo cargar gamificación');
        }
      } catch (gamError) {
        console.error('Error cargando gamificación:', gamError);
      } finally {
        setLoadingGamification(false);
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatMes = (mes: string) => {
    const [year, month] = mes.split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${meses[parseInt(month) - 1]} ${year}`;
  };

  // 💰 Calcular ganancias reales vs estimadas
  // ✅ ULTRA-CORREGIDO: Filtrar por gananciaNeta, no por costoReal
  // Consolidaciones que tienen gananciaNeta (nuevas, con descuento aplicado)
  const consolidacionesConGananciaNeta = consolidaciones.filter(c => 
    c.gananciaNeta !== null && c.gananciaNeta !== undefined
  );
  
  // Consolidaciones sin gananciaNeta (viejas, usar ganancia estimada)
  const consolidacionesSinGananciaNeta = consolidaciones.filter(c => 
    c.gananciaNeta === null || c.gananciaNeta === undefined
  );
  
  const gananciaNetaReal = consolidacionesConGananciaNeta.reduce((sum, c) => sum + c.gananciaNeta, 0);
  const gananciaEstimada = consolidacionesSinGananciaNeta.reduce((sum, c) => sum + c.ganancia, 0);

  // Consolidaciones sin pago registrado
  const consolidacionesSinPago = consolidaciones.filter(c => 
    !c.pagadoEn && c.estado !== 'cancelado'
  );

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

  // ✅ CORRECCIÓN: Calcular ganancia total real DESPUÉS de definir metricas
  // Si hay consolidaciones, usar gananciaNetaReal + gananciaEstimada
  // Si no hay consolidaciones, usar ganancia del API
  const gananciaTotalReal = gananciaNetaReal + gananciaEstimada;
  const gananciaFinal = (gananciaNetaReal > 0 || gananciaEstimada > 0) 
    ? gananciaTotalReal 
    : metricas.totalGanancia;

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

      {/* ✅ Sección de Gamificación */}
      {userLevel && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Award size={32} />
              <div>
                <h2 className="text-2xl font-bold">
                  {userLevel.nivelNombre || 'Principiante'}
                </h2>
                <p className="text-purple-100 text-sm">
                  {userLevel.siguienteNivel ? 
                    `Faltan ${userLevel.siguienteNivel.ventasFaltantes} ventas para ${userLevel.siguienteNivel.nombre}` : 
                    '¡Nivel máximo alcanzado!'
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{userLevel.totalSales || 0}</div>
              <div className="text-sm text-purple-100">Ventas Completadas</div>
            </div>
          </div>

          {/* Barra de progreso */}
          {userLevel.siguienteNivel && (
            <div className="mb-4">
              <div className="bg-white bg-opacity-30 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(userLevel.progreso || 0, 100)}%` }}
                />
              </div>
              <div className="text-sm text-purple-100 mt-1">
                {userLevel.totalSales || 0} / {userLevel.siguienteNivel.ventasRequeridas} ventas
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{userLevel.totalSales || 0}</div>
              <div className="text-xs text-purple-100">Ventas Completadas</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{userLevel.currentXP || 0}</div>
              <div className="text-xs text-purple-100">Puntos XP</div>
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
            {formatCurrency(gananciaFinal)}
          </div>
          <div className="text-sm text-gray-600">Ganancia Total</div>
          {consolidaciones.length > 0 && (
            <div className="mt-2 pt-2 border-t text-xs">
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle size={12} />
                <span>Real: {formatCurrency(gananciaNetaReal)}</span>
              </div>
              {gananciaEstimada > 0 && (
                <div className="flex items-center gap-1 text-gray-500">
                  <AlertCircle size={12} />
                  <span>Estimada: {formatCurrency(gananciaEstimada)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Package className="text-indigo-600" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(metricas.ticketPromedio)}
          </div>
          <div className="text-sm text-gray-600">Ticket Promedio</div>
        </div>
      </div>

      {/* Gráfico de Ventas Mensuales */}
      {ventasMensuales && ventasMensuales.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="text-nadin-pink" size={20} />
            Ventas Mensuales
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ventasMensuales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mes" 
                  tickFormatter={formatMes}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={formatMes}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  name="Ventas"
                  stroke="#ec4899" 
                  strokeWidth={3}
                  dot={{ fill: '#ec4899', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Clientas y Top Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Clientas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Trophy className="text-nadin-pink" size={20} />
            Top 10 Clientas
          </h3>

          {topClientas && topClientas.length > 0 ? (
            <div className="space-y-3">
              {topClientas.map((clienta, index) => (
                <div 
                  key={index}
                  onClick={() => router.push(`/dashboard/analytics/clientas/${encodeURIComponent(clienta.nombre)}`)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-nadin-pink hover:bg-opacity-10 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' :
                      'bg-nadin-pink'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium group-hover:text-nadin-pink transition-colors">
                        {clienta.nombre}
                      </div>
                      <div className="text-xs text-gray-500">
                        {clienta.cantidadPedidos} {clienta.cantidadPedidos === 1 ? 'pedido' : 'pedidos'}
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
          ) : (
            <div className="text-center text-gray-500 py-8">
              No hay datos de clientas
            </div>
          )}

          {topClientas && topClientas.length > 0 && (
            <button
              onClick={() => router.push('/dashboard/analytics/clientas')}
              className="w-full mt-4 py-2 text-nadin-pink font-semibold hover:bg-nadin-pink hover:bg-opacity-10 rounded-lg transition-colors"
            >
              Ver todas las clientas →
            </button>
          )}
        </div>

        {/* Top Productos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Package className="text-nadin-pink" size={20} />
            Productos Más Vendidos
          </h3>

          {topProductos && topProductos.length > 0 ? (
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
                      className="bg-nadin-pink h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(producto.cantidadVendida / topProductos[0].cantidadVendida) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No hay datos de productos
            </div>
          )}
        </div>
      </div>

      {/* Estados de Pedidos */}
      {pedidosPorEstado && Object.keys(pedidosPorEstado).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Calendar className="text-nadin-pink" size={20} />
            Pedidos por Estado
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(pedidosPorEstado).map(([estado, cantidad]) => {
              const estadosConfig: Record<string, { label: string; color: string; icon: any }> = {
                'pendiente': { label: 'Pendientes', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: AlertCircle },
                'enviado': { label: 'Enviados', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Package },
                'armado': { label: 'Armados', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: Package },
                'pagado': { label: 'Pagados', color: 'bg-green-100 text-green-700 border-green-300', icon: DollarSign },
                'entregado': { label: 'Entregados', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: CheckCircle },
                'cancelado': { label: 'Cancelados', color: 'bg-red-100 text-red-700 border-red-300', icon: AlertCircle }
              };

              const config = estadosConfig[estado] || { 
                label: estado, 
                color: 'bg-gray-100 text-gray-700 border-gray-300',
                icon: Package
              };
              
              const IconComponent = config.icon;

              return (
                <div key={estado} className={`border-2 rounded-lg p-4 ${config.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <IconComponent size={20} />
                    <span className="text-xs font-medium">{config.label}</span>
                  </div>
                  <div className="text-3xl font-bold">{cantidad}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => router.push('/dashboard/analytics/clientas')}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left group"
        >
          <Users className="text-nadin-pink mb-3 group-hover:scale-110 transition-transform" size={32} />
          <h3 className="font-bold text-lg mb-2 group-hover:text-nadin-pink transition-colors">
            Ver Todas las Clientas
          </h3>
          <p className="text-sm text-gray-600">
            Análisis detallado de cada clienta y su historial de compras
          </p>
        </button>

        <button
          onClick={() => router.push('/dashboard/pedidos')}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left group"
        >
          <ShoppingBag className="text-blue-600 mb-3 group-hover:scale-110 transition-transform" size={32} />
          <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors">
            Gestionar Pedidos
          </h3>
          <p className="text-sm text-gray-600">
            Ver y administrar todos tus pedidos activos
          </p>
        </button>

        <button
          onClick={() => router.push('/consolidaciones')}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left group"
        >
          <Package className="text-purple-600 mb-3 group-hover:scale-110 transition-transform" size={32} />
          <h3 className="font-bold text-lg mb-2 group-hover:text-purple-600 transition-colors">
            Consolidaciones
          </h3>
          <p className="text-sm text-gray-600">
            Revisar ganancias reales y registrar pagos
          </p>
        </button>
      </div>
    </div>
  );
}
