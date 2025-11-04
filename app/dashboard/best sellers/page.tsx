'use client';
import { useEffect, useState } from 'react';
import { calcularPrecioVenta, formatCurrency } from '@/lib/precios';
import { TrendingUp, Filter } from 'lucide-react';

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

type FilterType = 'general' | 'mujer' | 'hombre' | 'ninos' | 'mujer-ropa-interior' | 'mujer-pijamas' | 'hombre-ropa-interior' | 'ninos-pijamas';

export default function BestSellersPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userMargen, setUserMargen] = useState(60);
  const [activeFilter, setActiveFilter] = useState<FilterType>('general');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserMargen(user.margen || 60);
    }

    loadBestSellers();
  }, []);

  useEffect(() => {
    applyFilter(activeFilter);
  }, [allProducts, activeFilter]);

  const loadBestSellers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch('/api/catalogo/best-sellers?limit=100');
      
      if (!res.ok) {
        throw new Error('Error al cargar productos más vendidos');
      }

      const data = await res.json();
      const products = Array.isArray(data) ? data : (data.products || []);
      
      setAllProducts(products);
    } catch (err) {
      console.error('Error cargando más vendidos:', err);
      setError('Error al cargar los productos más vendidos. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const inferSex = (category: string, name: string): string => {
    const text = `${category} ${name}`.toLowerCase();
    
    if (text.includes('mujer') || text.includes('dama') || text.includes('femenin')) {
      return 'Mujer';
    }
    if (text.includes('hombre') || text.includes('masculin') || text.includes('caballero')) {
      return 'Hombre';
    }
    if (text.includes('niñ') || text.includes('kid') || text.includes('infant') || text.includes('bebe') || text.includes('bebé')) {
      return 'Niños';
    }
    
    return 'General';
  };

  const getSubcategory = (category: string): string => {
    const lower = category.toLowerCase();
    
    if (lower.includes('ropa interior')) return 'Ropa Interior';
    if (lower.includes('pijama')) return 'Pijamas';
    if (lower.includes('bata')) return 'Batas';
    if (lower.includes('corset') || lower.includes('corsé')) return 'Corsetería';
    
    return '';
  };

  const applyFilter = (filter: FilterType) => {
    let filtered = [...allProducts];

    switch (filter) {
      case 'general':
        filtered = filtered.slice(0, 10);
        break;
      
      case 'mujer':
        filtered = filtered.filter(p => inferSex(p.category, p.name) === 'Mujer').slice(0, 10);
        break;
      
      case 'hombre':
        filtered = filtered.filter(p => inferSex(p.category, p.name) === 'Hombre').slice(0, 10);
        break;
      
      case 'ninos':
        filtered = filtered.filter(p => inferSex(p.category, p.name) === 'Niños').slice(0, 10);
        break;
      
      case 'mujer-ropa-interior':
        filtered = filtered.filter(p => 
          inferSex(p.category, p.name) === 'Mujer' && 
          getSubcategory(p.category) === 'Ropa Interior'
        ).slice(0, 10);
        break;
      
      case 'mujer-pijamas':
        filtered = filtered.filter(p => 
          inferSex(p.category, p.name) === 'Mujer' && 
          getSubcategory(p.category) === 'Pijamas'
        ).slice(0, 10);
        break;
      
      case 'hombre-ropa-interior':
        filtered = filtered.filter(p => 
          inferSex(p.category, p.name) === 'Hombre' && 
          getSubcategory(p.category) === 'Ropa Interior'
        ).slice(0, 10);
        break;
      
      case 'ninos-pijamas':
        filtered = filtered.filter(p => 
          inferSex(p.category, p.name) === 'Niños' && 
          getSubcategory(p.category) === 'Pijamas'
        ).slice(0, 10);
        break;
    }

    setFilteredProducts(filtered);
  };

  const filters = [
    { id: 'general' as FilterType, label: '🏆 Top 10 General', emoji: '🏆' },
    { id: 'mujer' as FilterType, label: '👗 Top 10 Mujer', emoji: '👗' },
    { id: 'hombre' as FilterType, label: '👔 Top 10 Hombre', emoji: '👔' },
    { id: 'ninos' as FilterType, label: '👶 Top 10 Niños', emoji: '👶' },
    { id: 'mujer-ropa-interior' as FilterType, label: 'Mujer - Ropa Interior' },
    { id: 'mujer-pijamas' as FilterType, label: 'Mujer - Pijamas' },
    { id: 'hombre-ropa-interior' as FilterType, label: 'Hombre - Ropa Interior' },
    { id: 'ninos-pijamas' as FilterType, label: 'Niños - Pijamas' },
  ];

  const getMedalEmoji = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `${position}`;
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
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="text-nadin-pink" size={28} />
          <h2 className="text-2xl font-bold">Más Vendidos</h2>
        </div>
        <p className="text-gray-600 text-sm">
          Productos ordenados por popularidad según Tiendanube
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={20} className="text-nadin-pink" />
          <h3 className="font-bold text-gray-800">Selecciona categoría:</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeFilter === filter.id
                  ? 'bg-nadin-pink text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de productos */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredProducts.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredProducts.map((product, index) => (
              <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex gap-4">
                  {/* Ranking */}
                  <div className="flex-shrink-0 w-12 flex items-center justify-center">
                    <div className={`
                      text-2xl font-bold
                      ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-600' : 'text-gray-600'}
                    `}>
                      {getMedalEmoji(index + 1)}
                    </div>
                  </div>

                  {/* Imagen */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden">
                      {product.image && product.image !== '/placeholder.png' ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          Sin imagen
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
                    <h3 className="font-semibold text-sm sm:text-base mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    {product.variants && product.variants.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">
                          Stock: {product.variants.reduce((sum, v) => sum + v.stock, 0)} unidades
                        </p>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="text-gray-700">
                            Mayorista: <span className="font-bold">{formatCurrency(product.variants[0].price)}</span>
                          </span>
                          <span className="text-nadin-pink">
                            Tu precio: <span className="font-bold">{formatCurrency(calcularPrecioVenta(product.variants[0].price, userMargen))}</span>
                          </span>
                          <span className="text-green-600 font-semibold">
                            Ganancia: {formatCurrency(calcularPrecioVenta(product.variants[0].price, userMargen) - product.variants[0].price)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            No hay productos en esta categoría
          </div>
        )}
      </div>
    </div>
  );
}
