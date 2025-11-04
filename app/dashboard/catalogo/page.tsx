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
}

export default function CatalogoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [userMargen, setUserMargen] = useState(60);

  useEffect(() => {
    // Obtener margen del usuario
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserMargen(user.margen || 60);
    }

    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/catalogo');
      
      if (!res.ok) {
        throw new Error('Error al cargar productos');
      }

      const data = await res.json();
      
      // Verificar que sea un array
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        console.error('Formato de datos incorrecto:', data);
        setError('Error: formato de datos incorrecto');
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError('Error al cargar el catálogo. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase()) ||
    p.variants.some(v => v.sku?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
            <p className="mt-4 text-gray-600">Cargando catálogo...</p>
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
            onClick={loadProducts}
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
        <h2 className="text-2xl font-bold mb-4">Productos</h2>
        
        <div className="flex gap-3 items-center mb-4">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            onClick={loadProducts}
            className="bg-nadin-pink text-white px-4 py-2 rounded-lg"
          >
            🔄
          </button>
        </div>

        <div className="text-sm text-gray-600">
          Mostrando {filteredProducts.length} de {products.length} productos
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
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
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No se encontraron productos
        </div>
      )}
    </div>
  );
}
