'use client';
import { useEffect, useState } from 'react';
import { calcularPrecioVenta, formatCurrency } from '@/lib/precios';
import { TrendingUp, Award } from 'lucide-react';

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

interface RankingSection {
  title: string;
  subtitle?: string;
  products: Product[];
  emoji?: string;
}

export default function BestSellersPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [rankings, setRankings] = useState<RankingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userMargen, setUserMargen] = useState(60);

  useEffect(() => {
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
      
      const res = await fetch('/api/catalogo/best-sellers?limit=100');
      
      if (!res.ok) {
        throw new Error('Error al cargar productos más vendidos');
      }

      const data = await res.json();
      const products = Array.isArray(data) ? data : (data.products || []);
      
      setAllProducts(products);
      processRankings(products);
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
    if (lower.includes('medias')) return 'Medias';
    if (lower.includes('bodies') || lower.includes('body')) return 'Bodies';
    
    return category;
  };

  const processRankings = (products: Product[]) => {
    const newRankings: RankingSection[] = [];

    // TOP 10 GENERAL
    newRankings.push({
      title: '🏆 Top 10 General',
      subtitle: 'Los productos más vendidos de toda la tienda',
      products: products.slice(0, 10),
      emoji: '🏆'
    });

    // Clasificar productos por género
    const productsBySex: Record<string, Product[]> = {
      'Mujer': [],
      'Hombre': [],
      'Niños': []
    };

    products.forEach(product => {
      const sex = inferSex(product.category, product.name);
      if (productsBySex[sex]) {
        productsBySex[sex].push(product);
      }
    });

    // TOP 5 POR GÉNERO
    Object.entries(productsBySex).forEach(([sex, sexProducts]) => {
      if (sexProducts.length > 0) {
        const emoji = sex === 'Mujer' ? '👗' : sex === 'Hombre' ? '👔' : '👶';
        
        newRankings.push({
          title: `${emoji} Top 5 ${sex}`,
          subtitle: `Los más vendidos en ${sex.toLowerCase()}`,
          products: sexProducts.slice(0, 5),
          emoji
        });

        // TOP 5 POR SUBCATEGORÍA DENTRO DEL GÉNERO
        const subcategories: Record<string, Product[]> = {};
        
        sexProducts.forEach(product => {
          const subcat = getSubcategory(product.category);
          if (!subcategories[subcat]) {
            subcategories[subcat] = [];
          }
          subcategories[subcat].push(product);
        });

        // Ordenar subcategorías por cantidad de productos y tomar las top 3
        const topSubcategories = Object.entries(subcategories)
          .sort(([, a], [, b]) => b.length - a.length)
          .slice(0, 3);

        topSubcategories.forEach(([subcat, subcatProducts]) => {
          if (subcatProducts.length >= 3) {
            newRankings.push({
              title: `${sex} - ${subcat}`,
              subtitle: `Top 5 en ${subcat.toLowerCase()}`,
              products: subcatProducts.slice(0, 5)
            });
          }
        });
      }
    });

    setRankings(newRankings);
  };

  const ProductCard = ({ product, rank }: { product: Product; rank: number }) => {
    const getMedalEmoji = (position: number) => {
      if (position === 1) return '🥇';
      if (position === 2) return '🥈';
      if (position === 3) return '🥉';
      return `${position}º`;
    };

    return (
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow relative">
        {/* Badge de ranking */}
        <div className="absolute top-2 left-2 z-10">
          <div className={`
            px-3 py-1 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md
            ${rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : rank === 3 ? 'bg-orange-600' : 'bg-nadin-pink'}
          `}>
            {getMedalEmoji(rank)}
          </div>
        </div>

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
                <p className="text-xs text-green-600 font-semibold">
                  Ganancia: {formatCurrency(calcularPrecioVenta(product.variants[0].price, userMargen) - product.variants[0].price)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
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
    <div className="max-w-7xl mx-auto p-4 pb-20">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="text-nadin-pink" size={32} />
          <h2 className="text-3xl font-bold">Más Vendidos</h2>
        </div>
        <p className="text-gray-600">
          Productos ordenados por popularidad según datos de Tiendanube
        </p>
        
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            💡 <strong>Tip:</strong> Estos productos tienen alta demanda. Ideal para priorizar en tu inventario.
          </p>
        </div>
      </div>

      {/* Rankings */}
      {rankings.map((ranking, idx) => (
        <div key={idx} className="mb-12">
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              {ranking.emoji && <span>{ranking.emoji}</span>}
              {ranking.title}
            </h3>
            {ranking.subtitle && (
              <p className="text-gray-600 text-sm mt-1">{ranking.subtitle}</p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {ranking.products.map((product, index) => (
              <ProductCard key={product.id} product={product} rank={index + 1} />
            ))}
          </div>
        </div>
      ))}

      {allProducts.length === 0 && !loading && (
        <div className="text-center py-12">
          <Award className="mx-auto text-gray-300 mb-4" size={64} />
          <p className="text-gray-500 mb-2">No hay datos de productos más vendidos</p>
          <p className="text-sm text-gray-400">
            Los rankings aparecerán automáticamente con datos de Tiendanube
          </p>
        </div>
      )}
    </div>
  );
}
