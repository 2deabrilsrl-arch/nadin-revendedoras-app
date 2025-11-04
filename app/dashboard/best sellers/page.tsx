'use client';
import { useEffect, useState } from 'react';
import { calcularPrecioVenta, formatCurrency } from '@/lib/precios';

interface Variant {
  id: number;
  sku: string;
  price: number;
  stock: number;
  talle: string;
  color: string;
}

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  image: string;
  variants: Variant[];
  salesCount?: number;
}

export default function BestSellersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userMargen, setUserMargen] = useState(60);

  useEffect(() => {
    // Obtener margen del usuario
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserMargen(user.margen || 60);
    }

    loadBestSellers();
  }, []);

  const loadBestSellers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Obtener todos los productos
      const res = await fetch('/api/catalogo');
      
      if (!res.ok) {
        throw new Error('Error al cargar productos');
      }

      const data = await res.json();
      
      // Verificar que sea un array
      let allProducts: Product[] = [];
      if (Array.isArray(data)) {
        allProducts = data;
      } else if (data.products && Array.isArray(data.products)) {
        allProducts = data.products;
      }

      // Ordenar por salesCount (descendente) y tomar los primeros 50
      const bestSellers = allProducts
        .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
        .slice(0, 50);

      setProducts(bestSellers);
    } catch (err) {
      console.error('Error cargando más vendidos:', err);
      setError('Error al cargar los productos más vendidos. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
            <p className="mt-4 text-gray-600">Cargando productos más vendidos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadBestSellers}
            className="mt-4 bg-nadin-pink text-white px-6 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">🔥 Más Vendidos</h2>
        <p className="text-gray-600 text-sm mb-4">
          Los productos favoritos de nuestras revendedoras
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 text-sm">
            💡 <strong>Tip:</strong> Estos productos tienen alta rotación y son los preferidos por las clientas.
          </p>
        </div>

        <div className="text-sm text-gray-600">
          Mostrando top {products.length} productos
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product, index) => (
          <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow relative">
            {/* Badge de ranking */}
            {index < 3 && (
              <div className="absolute top-2 left-2 z-10">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm
                  ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'}
                `}>
                  {index + 1}
                </div>
              </div>
            )}

            <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
              {product.image && product.image !== '/placeholder.png' ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Sin imagen
                </div>
              )}
            </div>
            
            <div className="p-3">
              <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
              <h3 className="font-semibold text-sm mb-2 line-clamp-2 min-h-[40px]">
                {product.name}
              </h3>
              
              {product.salesCount !== undefined && product.salesCount > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {product.salesCount} ventas
                  </span>
                </div>
              )}
              
              {product.variants && product.variants.length > 0 && (
                <>
                  <p className="text-xs text-gray-600 mb-2">
                    Stock: {product.variants.reduce((sum, v) => sum + v.stock, 0)} unidades
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-700">
                      Mayorista: <span className="font-bold">{formatCurrency(product.variants[0].price)}</span>
                    </p>
                    <p className="text-sm text-nadin-pink">
                      Tu precio: <span className="font-bold">{formatCurrency(calcularPrecioVenta(product.variants[0].price, userMargen))}</span>
                    </p>
                    <p className="text-xs text-green-600 font-semibold">
                      Ganancia: {formatCurrency(calcularPrecioVenta(product.variants[0].price, userMargen) - product.variants[0].price)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Aún no hay datos de ventas disponibles</p>
          <p className="text-sm text-gray-400">
            Los productos más vendidos aparecerán aquí una vez que se registren ventas
          </p>
        </div>
      )}
    </div>
  );
}
