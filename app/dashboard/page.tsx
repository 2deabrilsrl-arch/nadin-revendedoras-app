'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, TrendingUp, ShoppingCart, Award, DollarSign, Users } from 'lucide-react';

export default function DashboardHome() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    pedidosPendientes: 0,
    ventasDelMes: 0,
    gananciaDelMes: 0
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Cargar estadísticas rápidas
    // TODO: Implementar API para stats del dashboard
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Bienvenida */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">¡Hola, {user?.name || 'Revendedora'}! 👋</h1>
        <p className="text-gray-600">Bienvenida a tu panel de ventas</p>
      </div>

      {/* Tarjetas de estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-nadin-pink to-nadin-pink-dark text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <Package size={32} />
            <span className="text-3xl font-bold">{stats.pedidosPendientes}</span>
          </div>
          <p className="text-sm opacity-90">Pedidos pendientes</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <DollarSign size={32} />
            <span className="text-3xl font-bold">${stats.ventasDelMes.toLocaleString('es-AR')}</span>
          </div>
          <p className="text-sm opacity-90">Ventas del mes</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp size={32} />
            <span className="text-3xl font-bold">${stats.gananciaDelMes.toLocaleString('es-AR')}</span>
          </div>
          <p className="text-sm opacity-90">Ganancia del mes</p>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/dashboard/catalogo"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-transparent hover:border-nadin-pink"
          >
            <Package size={32} className="text-nadin-pink mb-3" />
            <h3 className="font-bold text-lg mb-1">Catálogo</h3>
            <p className="text-sm text-gray-600">Ver productos</p>
          </Link>

          <Link 
            href="/dashboard/best-sellers"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-transparent hover:border-nadin-pink"
          >
            <Award size={32} className="text-yellow-500 mb-3" />
            <h3 className="font-bold text-lg mb-1">Más Vendidos</h3>
            <p className="text-sm text-gray-600">Los favoritos</p>
          </Link>

          <Link 
            href="/dashboard/pedidos"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-transparent hover:border-nadin-pink"
          >
            <ShoppingCart size={32} className="text-blue-500 mb-3" />
            <h3 className="font-bold text-lg mb-1">Mis Pedidos</h3>
            <p className="text-sm text-gray-600">Gestionar</p>
          </Link>

          <Link 
            href="/dashboard/analytics"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-transparent hover:border-nadin-pink"
          >
            <TrendingUp size={32} className="text-green-500 mb-3" />
            <h3 className="font-bold text-lg mb-1">Análisis</h3>
            <p className="text-sm text-gray-600">Ver reportes</p>
          </Link>
        </div>
      </div>

      {/* Tips y consejos */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          💡 Consejo del día
        </h3>
        <p className="text-gray-700">
          <strong>¡Revisá los Más Vendidos!</strong> Estos productos tienen alta rotación. 
          Mostráselos primero a tus clientas para aumentar tus ventas. 🚀
        </p>
      </div>
    </div>
  );
}