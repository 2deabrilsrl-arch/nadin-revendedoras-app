'use client';
import { useEffect, useState } from 'react';
import { calcularPrecioVenta, formatCurrency } from '@/lib/precios';
import { TrendingUp, Award } from 'lucide-react';

export default function BestSellersPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Obtener productos y ordenar por popularidad
    fetch('/api/catalogo')
      .then(r => r.json())
      .then(data => {
        // Filtrar productos con stock y ordenar aleatoriamente (simulación de best sellers)
        // En producción, esto debería venir de estadísticas reales de ventas
        const conStock = data.filter((p: any) => p.variants.some((v: any) => v.stock > 0));
        const random = conStock.sort(() => 0.5 - Math.random()).slice(0, 12);
        setProducts(random);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Best Sellers</h2>
        <p className="text-gray-600">Cargando productos más vendidos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Award className="text-nadin-pink" size={32} />
          <h2 className="text-2xl font-bold">Best Sellers</h2>
        </div>
        <p className="text-gray-600">Los productos más populares y mejor valorados</p>
      </div>

      {/* Banner promocional */}
      <div className="bg-gradient-to-r from-nadin-pink to-nadin-pink-dark text-white rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp size={32} />
          <div>
            <h3 className="text-xl font-bold mb-1">¡Aprovechá los más vendidos!</h3>
            <p className="text-sm opacity-90">Estos productos tienen alta rotación y excelente aceptación</p>
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p: any, index: number) => {
          const precioMayorista = parseFloat(p.variants[0]?.price || '0');
          const precioVenta = calcularPrecioVenta(precioMayorista, user?.margen || 60);
          const imagen = p.images && p.images.length > 0 ? p.images[0].src : '/placeholder.png';

          return (
            <div key={p.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow relative">
              {/* Badge de posición */}
              {index < 3 && (
                <div className="absolute top-2 left-2 z-10">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    'bg-orange-600'
                  }`}>
                    {index === 0 ? '🥇 #1' : index === 1 ? '🥈 #2' : '🥉 #3'}
                  </span>
                </div>
              )}

              <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                <img 
                  src={imagen}
                  alt={p.name.es}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Sin+Imagen';
                  }}
                />
              </div>
              
              <div className="p-3">
                <p className="text-xs text-gray-500 mb-1">{p.brand || 'Sin marca'}</p>
                <h3 className="font-semibold text-sm mb-2 line-clamp-2 h-10">{p.name.es}</h3>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-nadin-pink">
                    {formatCurrency(precioVenta)}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <TrendingUp size={12} />
                    <span>Alta demanda</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Información adicional */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="font-bold mb-2">💡 Consejo para revendedoras</h3>
        <p className="text-sm text-gray-700">
          Los Best Sellers son ideales para mostrar primero a tus clientas. Estos productos tienen comprobada aceptación 
          en el mercado y te ayudarán a cerrar más ventas. ¡Usá esta sección como tu catálogo destacado!
        </p>
      </div>
    </div>
  );
}