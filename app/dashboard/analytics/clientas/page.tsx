'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Search, ArrowUpDown, Phone, Calendar, ShoppingBag, 
  DollarSign, TrendingUp, TrendingDown, Minus, AlertTriangle,
  Clock
} from 'lucide-react';
import BackToHomeButton from '@/components/BackToHomeButton';

interface Clienta {
  nombre: string;
  telefono: string | null;
  totalCompras: number;
  cantidadPedidos: number;
  primeraCompra: Date;
  ultimaCompra: Date;
  ticketPromedio: number;
  productosComprados: number;
  pedidosPendientes: number;
  pedidosEntregados: number;
  // Nuevas métricas
  comprasUltimos30Dias: number;
  comprasUltimos90Dias: number;
  pedidosUltimos30Dias: number;
  pedidosUltimos90Dias: number;
  diasSinComprar: number;
  estado: 'activa' | 'regular' | 'inactiva' | 'riesgo';
  tendencia: 'subiendo' | 'estable' | 'bajando';
}

export default function ClientasPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [clientas, setClientas] = useState<Clienta[]>([]);
  const [filteredClientas, setFilteredClientas] = useState<Clienta[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'nombre' | 'totalCompras' | 'cantidadPedidos' | 'ultimaCompra' | 'diasSinComprar'>('totalCompras');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'activa' | 'regular' | 'inactiva' | 'riesgo'>('todas');

  useEffect(() => {
    const userStr = (globalThis as any).localStorage?.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userStr);
    setUserId(user.id);
    loadClientas(user.id);
  }, []);

  useEffect(() => {
    filterAndSortClientas();
  }, [clientas, searchTerm, sortBy, sortOrder, filtroEstado]);

  const loadClientas = async (uid: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clientas?userId=${uid}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar clientas');
      }

      const data = await response.json() as { clientas: Clienta[] };
      setClientas(data.clientas);
    } catch (err) {
      console.error('Error:', err);
      (globalThis as any).alert?.('Error al cargar clientas');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortClientas = () => {
    let filtered = [...clientas];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.telefono?.includes(searchTerm)
      );
    }

    // Filtrar por estado
    if (filtroEstado !== 'todas') {
      filtered = filtered.filter(c => c.estado === filtroEstado);
    }

    // Ordenar
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'nombre':
          comparison = a.nombre.localeCompare(b.nombre);
          break;
        case 'totalCompras':
          comparison = a.totalCompras - b.totalCompras;
          break;
        case 'cantidadPedidos':
          comparison = a.cantidadPedidos - b.cantidadPedidos;
          break;
        case 'ultimaCompra':
          comparison = new Date(a.ultimaCompra).getTime() - new Date(b.ultimaCompra).getTime();
          break;
        case 'diasSinComprar':
          comparison = a.diasSinComprar - b.diasSinComprar;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredClientas(filtered);
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
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

  const getEstadoBadge = (estado: string) => {
    const badges = {
      activa: { bg: 'bg-green-100', text: 'text-green-800', label: '🟢 Activa', icon: '✓' },
      regular: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '🟡 Regular', icon: '⚠' },
      inactiva: { bg: 'bg-orange-100', text: 'text-orange-800', label: '🟠 Inactiva', icon: '!' },
      riesgo: { bg: 'bg-red-100', text: 'text-red-800', label: '🔴 En Riesgo', icon: '⚠️' }
    };
    return badges[estado as keyof typeof badges] || badges.regular;
  };

  const getTendenciaIcon = (tendencia: string) => {
    if (tendencia === 'subiendo') return <TrendingUp size={16} className="text-green-600" />;
    if (tendencia === 'bajando') return <TrendingDown size={16} className="text-red-600" />;
    return <Minus size={16} className="text-gray-600" />;
  };

  const getTendenciaText = (tendencia: string) => {
    if (tendencia === 'subiendo') return 'Comprando más';
    if (tendencia === 'bajando') return 'Comprando menos';
    return 'Estable';
  };

  // Clientas que requieren atención (inactivas o en riesgo)
  const clientasConAtencion = clientas.filter(c => 
    c.estado === 'inactiva' || c.estado === 'riesgo'
  ).slice(0, 5);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
            <p className="mt-4 text-gray-600">Cargando clientas...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calcular stats por estado
  const statsEstado = {
    activas: clientas.filter(c => c.estado === 'activa').length,
    regulares: clientas.filter(c => c.estado === 'regular').length,
    inactivas: clientas.filter(c => c.estado === 'inactiva').length,
    riesgo: clientas.filter(c => c.estado === 'riesgo').length
  };

  return (
    <div className="max-w-7xl mx-auto p-4 pb-24">
      <BackToHomeButton />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">👥 Mis Clientas</h1>
        <p className="text-gray-600">
          {filteredClientas.length} {filteredClientas.length === 1 ? 'clienta' : 'clientas'}
          {filtroEstado !== 'todas' && ` (${filtroEstado}s)`}
        </p>
      </div>

      {/* Clientas que Requieren Atención */}
      {clientasConAtencion.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-red-600" size={24} />
            <h2 className="text-xl font-bold text-red-800">
              ⚠️ Clientas que Requieren Atención ({clientasConAtencion.length})
            </h2>
          </div>
          <div className="space-y-2">
            {clientasConAtencion.map((clienta, index) => (
              <div 
                key={index}
                onClick={() => router.push(`/dashboard/analytics/clientas/${encodeURIComponent(clienta.nombre)}`)}
                className="bg-white p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">{clienta.nombre}</div>
                    <div className="text-sm text-red-600">
                      ⚠️ Hace {clienta.diasSinComprar} días sin comprar
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {formatCurrency(clienta.totalCompras)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {clienta.cantidadPedidos} pedidos
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats por Estado */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-2xl font-bold text-gray-900">{clientas.length}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <button
          onClick={() => setFiltroEstado('activa')}
          className={`bg-white rounded-lg shadow-md p-4 text-left hover:shadow-lg transition-shadow ${
            filtroEstado === 'activa' ? 'ring-2 ring-green-500' : ''
          }`}
        >
          <div className="text-2xl font-bold text-green-600">{statsEstado.activas}</div>
          <div className="text-sm text-gray-600">🟢 Activas</div>
        </button>
        <button
          onClick={() => setFiltroEstado('regular')}
          className={`bg-white rounded-lg shadow-md p-4 text-left hover:shadow-lg transition-shadow ${
            filtroEstado === 'regular' ? 'ring-2 ring-yellow-500' : ''
          }`}
        >
          <div className="text-2xl font-bold text-yellow-600">{statsEstado.regulares}</div>
          <div className="text-sm text-gray-600">🟡 Regulares</div>
        </button>
        <button
          onClick={() => setFiltroEstado('inactiva')}
          className={`bg-white rounded-lg shadow-md p-4 text-left hover:shadow-lg transition-shadow ${
            filtroEstado === 'inactiva' ? 'ring-2 ring-orange-500' : ''
          }`}
        >
          <div className="text-2xl font-bold text-orange-600">{statsEstado.inactivas}</div>
          <div className="text-sm text-gray-600">🟠 Inactivas</div>
        </button>
        <button
          onClick={() => setFiltroEstado('riesgo')}
          className={`bg-white rounded-lg shadow-md p-4 text-left hover:shadow-lg transition-shadow ${
            filtroEstado === 'riesgo' ? 'ring-2 ring-red-500' : ''
          }`}
        >
          <div className="text-2xl font-bold text-red-600">{statsEstado.riesgo}</div>
          <div className="text-sm text-gray-600">🔴 En Riesgo</div>
        </button>
      </div>

      {/* Búsqueda y Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {filtroEstado !== 'todas' && (
              <button
                onClick={() => setFiltroEstado('todas')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Ver todas
              </button>
            )}
            <button
              onClick={() => toggleSort('totalCompras')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                sortBy === 'totalCompras' 
                  ? 'bg-nadin-pink text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ventas <ArrowUpDown size={16} />
            </button>
            <button
              onClick={() => toggleSort('diasSinComprar')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                sortBy === 'diasSinComprar' 
                  ? 'bg-nadin-pink text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Actividad <ArrowUpDown size={16} />
            </button>
            <button
              onClick={() => toggleSort('ultimaCompra')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                sortBy === 'ultimaCompra' 
                  ? 'bg-nadin-pink text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Reciente <ArrowUpDown size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Clientas */}
      {filteredClientas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">
            {searchTerm || filtroEstado !== 'todas' 
              ? 'No se encontraron clientas con estos filtros' 
              : 'Aún no tenés clientas'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClientas.map((clienta, index) => {
            const estadoBadge = getEstadoBadge(clienta.estado);

            return (
              <div
                key={index}
                onClick={() => router.push(`/dashboard/analytics/clientas/${encodeURIComponent(clienta.nombre)}`)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {clienta.nombre}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoBadge.bg} ${estadoBadge.text}`}>
                        {estadoBadge.label}
                      </span>
                    </div>
                    {clienta.telefono && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Phone size={14} />
                        {clienta.telefono}
                      </div>
                    )}
                    {clienta.diasSinComprar > 30 && (
                      <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                        <Clock size={14} />
                        ⚠️ Hace {clienta.diasSinComprar} días sin comprar
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(clienta.totalCompras)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Total histórico
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={16} className="text-nadin-pink" />
                    <div>
                      <div className="font-semibold">{clienta.cantidadPedidos}</div>
                      <div className="text-xs text-gray-600">Pedidos</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-purple-600" />
                    <div>
                      <div className="font-semibold">{formatCurrency(clienta.ticketPromedio)}</div>
                      <div className="text-xs text-gray-600">Promedio</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-blue-600" />
                    <div>
                      <div className="font-semibold">{formatDate(clienta.ultimaCompra)}</div>
                      <div className="text-xs text-gray-600">Última compra</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getTendenciaIcon(clienta.tendencia)}
                    <div>
                      <div className="font-semibold">{getTendenciaText(clienta.tendencia)}</div>
                      <div className="text-xs text-gray-600">Tendencia</div>
                    </div>
                  </div>
                </div>

                {/* Compras recientes */}
                <div className="border-t border-gray-200 pt-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Últimos 30 días:</span>
                      <span className="ml-2 font-bold text-green-600">
                        {formatCurrency(clienta.comprasUltimos30Dias)}
                      </span>
                      <span className="text-gray-500 ml-1">
                        ({clienta.pedidosUltimos30Dias} pedidos)
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Últimos 90 días:</span>
                      <span className="ml-2 font-bold text-blue-600">
                        {formatCurrency(clienta.comprasUltimos90Dias)}
                      </span>
                      <span className="text-gray-500 ml-1">
                        ({clienta.pedidosUltimos90Dias} pedidos)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
