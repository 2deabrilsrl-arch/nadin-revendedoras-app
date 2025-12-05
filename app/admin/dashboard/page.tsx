// DASHBOARD VENDEDORA - CARDS CLICKEABLES
// Ubicación: app/admin/dashboard/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, DollarSign, Truck, ArrowRight } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    armado: 0,
    pago: 0,
    entrega: 0
  });

  useEffect(() => {
    cargarEstadisticas();
    const interval = setInterval(cargarEstadisticas, 30000);
    return () => clearInterval(interval);
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const [resArmado, resPago, resEntrega] = await Promise.all([
        fetch('/api/admin/consolidaciones?pendientesArmado=true'),
        fetch('/api/admin/consolidaciones?pendientesPago=true'),
        fetch('/api/admin/consolidaciones?pendientesEntrega=true')
      ]);

      const [dataArmado, dataPago, dataEntrega] = await Promise.all([
        resArmado.json(),
        resPago.json(),
        resEntrega.json()
      ]);

      setEstadisticas({
        armado: dataArmado.consolidaciones?.length || 0,
        pago: dataPago.consolidaciones?.length || 0,
        entrega: dataEntrega.consolidaciones?.length || 0
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Pendientes de Armado',
      count: estadisticas.armado,
      icon: Package,
      color: 'from-yellow-400 to-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      href: '/admin/pendientes-armado'
    },
    {
      title: 'Pendientes de Pago',
      count: estadisticas.pago,
      icon: DollarSign,
      color: 'from-orange-400 to-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      href: '/admin/pendientes-pago'
    },
    {
      title: 'Pendientes de Entrega',
      count: estadisticas.entrega,
      icon: Truck,
      color: 'from-blue-400 to-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      href: '/admin/pendientes-entrega'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Vendedora</h1>
        <p className="text-gray-600 mt-2">Resumen de consolidaciones pendientes</p>
      </div>

      {/* Cards Clickeables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          
          return (
            <button
              key={card.href}
              onClick={() => router.push(card.href)}
              className={`${card.bgColor} border-2 ${card.borderColor} rounded-xl p-6 hover:shadow-lg transition-all transform hover:scale-105 text-left group`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${card.color}`}>
                  <Icon size={32} className="text-white" />
                </div>
                <ArrowRight size={24} className={`${card.textColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>

              <div className={`text-4xl font-bold ${card.textColor} mb-2`}>
                {card.count}
              </div>

              <div className="text-gray-700 font-medium">
                {card.title}
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <span>Ver pendientes</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Información adicional */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/admin/pendientes-armado')}
            className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all"
          >
            <div className="flex items-center gap-3">
              <Package size={24} className="text-pink-500" />
              <span className="font-medium">Armar Pedidos</span>
            </div>
            <ArrowRight size={20} className="text-gray-400" />
          </button>

          <button
            onClick={() => router.push('/admin/conversaciones')}
            className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all"
          >
            <div className="flex items-center gap-3">
              <Package size={24} className="text-pink-500" />
              <span className="font-medium">Ver Conversaciones</span>
            </div>
            <ArrowRight size={20} className="text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
