// PAGINA: LISTA DE PEDIDOS PENDIENTES
// Ubicacion: app/admin/armar-pedidos/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ArmarPedidosPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/pedidos?estado=pendiente,armado');
      const data = await res.json();
      setPedidos(data as any);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'armado':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'enviado':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Clock size={20} className="text-yellow-600" />;
      case 'armado':
        return <CheckCircle size={20} className="text-green-600" />;
      default:
        return <Package size={20} className="text-gray-600" />;
    }
  };

  const getTiempoTranscurrido = (fecha: string) => {
    const ahora = new Date().getTime();
    const creado = new Date(fecha).getTime();
    const diff = ahora - creado;

    const horas = Math.floor(diff / (1000 * 60 * 60));
    const dias = Math.floor(horas / 24);

    if (dias > 0) return `Hace ${dias} dia${dias > 1 ? 's' : ''}`;
    if (horas > 0) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    return 'Hace menos de 1 hora';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
      </div>
    );
  }

  const pedidosPendientes = pedidos.filter((p: any) => p.estado === 'pendiente');
  const pedidosArmados = pedidos.filter((p: any) => p.estado === 'armado');

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Armar Pedidos
        </h1>
        <p className="text-gray-600">
          Gestiona los pedidos pendientes de armado
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Pendientes</p>
              <p className="text-3xl font-bold text-yellow-900">
                {pedidosPendientes.length}
              </p>
            </div>
            <Clock size={40} className="text-yellow-400" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Armados Hoy</p>
              <p className="text-3xl font-bold text-green-900">
                {pedidosArmados.length}
              </p>
            </div>
            <CheckCircle size={40} className="text-green-400" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Productos</p>
              <p className="text-3xl font-bold text-blue-900">
                {pedidos.reduce((sum: number, p: any) => sum + (p.productos?.length || 0), 0)}
              </p>
            </div>
            <Package size={40} className="text-blue-400" />
          </div>
        </div>
      </div>

      {/* Pedidos Pendientes */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={24} className="text-yellow-600" />
          Pedidos Pendientes ({pedidosPendientes.length})
        </h2>

        {pedidosPendientes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <p className="text-gray-600 font-medium">
              Genial! No hay pedidos pendientes de armar
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidosPendientes.map((pedido: any) => (
              <div
                key={pedido.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        Pedido #{pedido.id}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(pedido.estado)}`}>
                        {pedido.estado}
                      </span>
                    </div>
                    <p className="text-gray-700 font-medium">
                      {pedido.usuario?.nombre || 'Revendedora'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {pedido.usuario?.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">
                      {getTiempoTranscurrido(pedido.createdAt)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(pedido.createdAt).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-500">Productos</p>
                      <p className="text-lg font-bold text-gray-900">
                        {pedido.productos?.length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-lg font-bold text-green-600">
                        ${pedido.totalVenta?.toLocaleString('es-AR') || '0'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/admin/armar-pedidos/${pedido.id}`)}
                    className="flex items-center gap-2 bg-nadin-pink hover:bg-nadin-pink-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Armar Pedido
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pedidos Armados Hoy */}
      {pedidosArmados.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle size={24} className="text-green-600" />
            Armados Hoy ({pedidosArmados.length})
          </h2>

          <div className="space-y-3">
            {pedidosArmados.map((pedido: any) => (
              <div
                key={pedido.id}
                className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <CheckCircle size={24} className="text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      Pedido #{pedido.id} - {pedido.usuario?.nombre}
                    </p>
                    <p className="text-sm text-gray-600">
                      {pedido.productos?.length || 0} productos | 
                      Armado {getTiempoTranscurrido(pedido.armadoEn || pedido.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/admin/armar-pedidos/${pedido.id}`)}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Ver Detalles
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
