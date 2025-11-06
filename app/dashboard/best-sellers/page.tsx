'use client';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, X, TrendingUp, Crown, Award, Medal, Star } from 'lucide-react';
import { calcularPrecioVenta, formatCurrency } from '@/lib/precios';
import ProductModal, { CartItem } from '@/components/ProductModal';
import { useCart } from '@/components/CartContext';
import BackToHomeButton from '@/components/BackToHomeButton';
import ShareWhatsAppButton from '@/components/ShareWhatsAppButton';

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
  images?: string[];
  variants: Variant[];
}

// Componente para el badge de ranking
const RankingBadge = ({ position }: { position: number }) => {
  if (position === 1) {
    return (
      <div className="absolute top-2 left-2 z-10">
        <div className="flex items-center gap-1 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 text-white px-3 py-1.5 rounded-full shadow-lg border-2 border-yellow-200">
          <Crown size={16} className="fill-yellow-100" />
          <span className="text-sm font-bold">1°</span>
        </div>
      </div>
    );
  }
  
  if (position === 2) {
    return (
      <div className="absolute top-2 left-2 z-10">
        <div className="flex items-center gap-1 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 text-white px-3 py-1.5 rounded-full shadow-lg border-2 border-gray-200">
          <Award size={16} className="fill-gray-100" />
          <span className="text-sm font-bold">2°</span>
        </div>
      </div>
    );
  }
  
  if (position === 3) {
    return (
      <div className="absolute top-2 left-2 z-10">
        <div className="flex items-center gap-1 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700 text-white px-3 py-1.5 rounded-full shadow-lg border-2 border-orange-200">
          <Medal size={16} className="fill-orange-100" />
          <span className="text-sm font-bold">3°</span>
        </div>
      </div>
    );
  }
  
  // Del 4 en adelante - Rosa de Nadin
  return (
    <div className="absolute top-2 left-2 z-10">
      <div className="flex items-center gap-1 bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600 text-white px-2.5 py-1 rounded-full shadow-md border-2 border-pink-200">
        <Star size={14} className="fill-pink-100" />
        <span className="text-xs font-bold">{position}°</span>
      </div>
    </div>
  );
};

export default function BestSellersPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userMargen, setUserMargen] = useState(60);
  const [showCosts, setShowCosts] = useState(false);

  // Estados de filtros
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');

  // Estados para el modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hook del carrito
  const { addToCart } = useCart();

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
      
      console.log('🔥 Cargando productos más vendidos de Tiendanube...');
      const res = await fetch('/api/best-sellers');
      
      if (!res.ok) throw new Error('Error al cargar productos');

      const data = await res.json();
      setAllProducts(Array.isArray(data) ? data : []);
      
      console.log('✅ Productos más vendidos cargados:', data.length);
    } catch (err) {
      console.error('Error cargando más vendidos:', err);
      setError('Error al cargar los productos más vendidos');
    } finally {
      setLoading(false);
    }
  };

  // Extraer opciones de filtros
  const getFilterOptions = () => {
    const brands = [...new Set(
      allProducts
        .map(p => p.brand)
        .filter((b): b is string => !!b && b !== 'Sin marca')
    )].sort();

    const mainCats = [...new Set(
      allProducts
        .map(p => {
          if (p.category && p.category !== 'Sin categoría') {
            const parts = p.category.split(' > ');
            const cat = parts[0]?.trim();
            return cat && cat !== 'MARCAS' ? cat : null;
          }
          return null;
        })
        .filter((c): c is string => c !== null)
    )].sort();

    let subcats: string[] = [];
    if (selectedMainCategory) {
      subcats = [...new Set(
        allProducts
          .filter(p => {
            if (!p.category) return false;
            const parts = p.category.split(' > ').map(part => part.trim());
            return parts[0] === selectedMainCategory;
          })
          .map(p => {
            const parts = p.category.split(' > ');
            return parts[1]?.trim();
          })
          .filter((s): s is string => !!s)
      )].sort();
    }

    let productTypes: string[] = [];
    if (selectedMainCategory && selectedSubcategory) {
      productTypes = [...new Set(
        allProducts
          .filter(p => {
            if (!p.category) return false;
            const parts = p.category.split(' > ').map(part => part.trim());
            return parts[0] === selectedMainCategory && parts[1] === selectedSubcategory;
          })
          .map(p => {
            const parts = p.category.split(' > ');
            return parts[2]?.trim();
          })
          .filter((t): t is string => !!t)
      )].sort();
    }

    return { brands, mainCats, subcats, productTypes };
  };

  const { brands, mainCats, subcats, productTypes } = getFilterOptions();

  // Filtrar productos con lógica jerárquica
  const filteredProducts = allProducts.filter(p => {
    if (selectedBrand && p.brand !== selectedBrand) return false;

    if (selectedMainCategory) {
      if (!p.category) return false;
      const categoryParts = p.category.split(' > ').map(part => part.trim());
      if (categoryParts[0] !== selectedMainCategory) return false;

      if (selectedSubcategory) {
        if (categoryParts[1] !== selectedSubcategory) return false;
        if (selectedProductType) {
          if (categoryParts[2] !== selectedProductType) return false;
        }
      }
    }

    return true;
  });

  // Determinar cuántos productos mostrar según filtros activos
  const getMaxProducts = () => {
    // Si hay tipo de producto o subcategoría: 5 (o todos si hay menos)
    if (selectedProductType || selectedSubcategory) {
      return Math.min(filteredProducts.length, 5);
    }
    // Si hay marca o categoría: 10 (o todos si hay menos)
    if (selectedBrand || selectedMainCategory) {
      return Math.min(filteredProducts.length, 10);
    }
    // Sin filtros (catálogo completo): 10
    return Math.min(filteredProducts.length, 10);
  };

  const maxProductsToShow = getMaxProducts();
  const topProducts = filteredProducts.slice(0, maxProductsToShow);

  const handleAddToCart = (item: CartItem) => {
    addToCart(item);
    alert('✅ Producto agregado al pedido');
  };

  const clearFilters = () => {
    setSelectedBrand('');
    setSelectedMainCategory('');
    setSelectedSubcategory('');
    setSelectedProductType('');
  };

  const handleMainCategoryChange = (value: string) => {
    setSelectedMainCategory(value);
    setSelectedSubcategory('');
    setSelectedProductType('');
  };

  const handleSubcategoryChange = (value: string) => {
    setSelectedSubcategory(value);
    setSelectedProductType('');
  };

  const hasActiveFilters = selectedBrand || selectedMainCategory || selectedSubcategory || selectedProductType;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
            <p className="mt-4 text-gray-600">Cargando productos más vendidos desde Tiendanube...</p>
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
    <div className="max-w-7xl mx-auto p-4 pb-24">
      <BackToHomeButton />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp size={32} className="text-nadin-pink" />
          <h1 className="text-3xl font-bold text-gray-800">
            TOP {maxProductsToShow} Más Vendidos
          </h1>
        </div>
        
        <button
          onClick={() => setShowCosts(!showCosts)}
          className="flex items-center gap-2 bg-nadin-pink text-white px-4 py-2 rounded-lg hover:bg-nadin-pink-dark transition-colors"
        >
          {showCosts ? (
            <>
              <EyeOff size={20} />
              <span className="hidden sm:inline">Ocultar Costos</span>
            </>
          ) : (
            <>
              <Eye size={20} />
              <span className="hidden sm:inline">Ver Costos</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Filtros</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Marca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marca
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            >
              <option value="">Todas las marcas</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* Categoría Principal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={selectedMainCategory}
              onChange={(e) => handleMainCategoryChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            >
              <option value="">Todas las categorías</option>
              {mainCats.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Subcategoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategoría
            </label>
            <select
              value={selectedSubcategory}
              onChange={(e) => handleSubcategoryChange(e.target.value)}
              disabled={!selectedMainCategory || subcats.length === 0}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedMainCategory 
                  ? (subcats.length > 0 ? 'Todas las subcategorías' : 'No hay subcategorías')
                  : 'Selecciona categoría primero'}
              </option>
              {subcats.map(subcat => (
                <option key={subcat} value={subcat}>{subcat}</option>
              ))}
            </select>
          </div>

          {/* Tipo de Producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Producto
            </label>
            <select
              value={selectedProductType}
              onChange={(e) => setSelectedProductType(e.target.value)}
              disabled={!selectedSubcategory || productTypes.length === 0}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedSubcategory
                  ? (productTypes.length > 0 ? 'Todos los tipos' : 'No hay tipos')
                  : 'Selecciona subcategoría primero'}
              </option>
              {productTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="mt-4 flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark font-medium text-sm"
          >
            <X size={16} />
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {filteredProducts.length > maxProductsToShow ? (
            <>Mostrando TOP {maxProductsToShow} de {filteredProducts.length} productos filtrados</>
          ) : (
            <>Mostrando {topProducts.length} productos</>
          )}
        </div>
        <button
          onClick={loadBestSellers}
          className="text-sm text-nadin-pink hover:text-nadin-pink-dark"
        >
          🔄 Actualizar desde Tiendanube
        </button>
      </div>

      {topProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {topProducts.map((product, index) => (
            <div 
              key={product.id} 
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow relative cursor-pointer"
              onClick={() => {
                setSelectedProduct(product);
                setIsModalOpen(true);
              }}
            >
              <RankingBadge position={index + 1} />
              
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
                <p className="text-xs text-nadin-pink font-medium mb-1">{product.brand}</p>
                <h3 className="font-semibold text-sm mb-2 line-clamp-2 min-h-[40px]">
                  {product.name}
                </h3>
                
                {product.variants && product.variants.length > 0 && (
                  <>
                    <p className="text-xs text-gray-600 mb-2">
                      Stock: {product.variants.reduce((sum, v) => sum + v.stock, 0)} unidades
                    </p>
                    
                    <div className="border-t pt-2 space-y-1 mb-3">
                      <p className="text-lg font-bold text-nadin-pink">
                        {formatCurrency(calcularPrecioVenta(product.variants[0].price, userMargen))}
                      </p>
                      
                      {showCosts && (
                        <>
                          <p className="text-xs text-gray-600">
                            Costo: <span className="font-semibold">{formatCurrency(product.variants[0].price)}</span>
                          </p>
                          <p className="text-xs text-green-600">
                            Ganancia: <span className="font-semibold">
                              {formatCurrency(
                                calcularPrecioVenta(product.variants[0].price, userMargen) - product.variants[0].price
                              )}
                            </span>
                          </p>
                        </>
                      )}
                    </div>

                    <ShareWhatsAppButton
                      product={product}
                      precioVenta={calcularPrecioVenta(product.variants[0].price, userMargen)}
                      className="w-full py-2 px-3"
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <TrendingUp size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-lg mb-2">No se encontraron productos</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-nadin-pink hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        userMargen={userMargen}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
