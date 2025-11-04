'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, Eye, EyeOff, Package, X } from 'lucide-react';
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
  sex?: string;
}

export default function BestSellersPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCosts, setShowCosts] = useState(false);
  const [userMargen, setUserMargen] = useState(60);
  
  // Estados de filtros simplificados
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedSex, setSelectedSex] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [topCount, setTopCount] = useState(10);

  // Opciones únicas de filtros
  const [brands, setBrands] = useState<string[]>([]);
  const [sexes, setSexes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Modal de detalle
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    // Obtener margen del usuario
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserMargen(user.margen || 60);
    }

    loadData();
  }, []);

  useEffect(() => {
    // Extraer opciones únicas cuando cambian los productos
    if (allProducts.length > 0) {
      const uniqueBrands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort() as string[];
      const uniqueSexes = [...new Set(allProducts.map(p => p.sex).filter((s): s is string => !!s))].sort();
      const uniqueCategories = [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort() as string[];
      
      setBrands(uniqueBrands);
      setSexes(uniqueSexes);
      setCategories(uniqueCategories);
    }
  }, [allProducts]);

  useEffect(() => {
    applyFilters();
  }, [allProducts, selectedBrand, selectedSex, selectedCategory, topCount]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch('/api/catalogo/best-sellers?limit=100');
      
      if (!res.ok) {
        throw new Error('Error al cargar datos');
      }

      const data = await res.json();
      const products = Array.isArray(data) ? data : (data.products || []);
      
      setAllProducts(products);
      setFilteredProducts(products.slice(0, topCount));
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar datos. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allProducts];

    // Filtro por marca
    if (selectedBrand) {
      filtered = filtered.filter(p => p.brand === selectedBrand);
    }

    // Filtro por sexo
    if (selectedSex) {
      filtered = filtered.filter(p => p.sex === selectedSex);
    }

    // Filtro por categoría
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Limitar al top N
    setFilteredProducts(filtered.slice(0, topCount));
  };

  const clearFilters = () => {
    setSelectedBrand('');
    setSelectedSex('');
    setSelectedCategory('');
  };

  const hasActiveFilters = selectedBrand || selectedSex || selectedCategory;

  const getMedalEmoji = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return position;
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  const closeProductDetail = () => {
    setShowProductDetail(false);
    setSelectedProduct(null);
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
            onClick={loadData}
            className="mt-4 bg-nadin-pink text-white px-6 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Header con botón ojo */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-nadin-pink" size={28} />
              <h2 className="text-2xl font-bold">🔥 Más Vendidos</h2>
            </div>
            <p className="text-gray-600 text-sm">
              Los productos con mejor rendimiento según Tiendanube
            </p>
          </div>

          {/* Botón Ver/Ocultar Costos */}
          <button
            onClick={() => setShowCosts(!showCosts)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {showCosts ? (
              <>
                <EyeOff size={20} />
                <span className="hidden sm:inline">Ocultar</span>
              </>
            ) : (
              <>
                <Eye size={20} />
                <span className="hidden sm:inline">Ver Costos</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filtros simplificados */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <h3 className="font-bold text-gray-800 mb-4">Filtros</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Top N */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mostrar Top
            </label>
            <select
              value={topCount}
              onChange={(e) => setTopCount(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            >
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
              <option value={100}>Top 100</option>
            </select>
          </div>

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

          {/* Género */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Género
            </label>
            <select
              value={selectedSex}
              onChange={(e) => setSelectedSex(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            >
              <option value="">Todos</option>
              {sexes.map(sex => (
                <option key={sex} value={sex}>{sex}</option>
              ))}
            </select>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            >
              <option value="">Todas</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtros activos y botón limpiar */}
        {hasActiveFilters && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">Filtrando por:</span>
            {selectedBrand && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {selectedBrand}
              </span>
            )}
            {selectedSex && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {selectedSex}
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {selectedCategory}
              </span>
            )}
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-nadin-pink hover:text-nadin-pink-dark font-medium"
            >
              <X size={14} />
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Contador */}
      <div className="mb-4 text-sm text-gray-600">
        Mostrando {filteredProducts.length} productos
        {hasActiveFilters && ` (filtrado de ${allProducts.length} totales)`}
      </div>

      {/* Lista de productos */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredProducts.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredProducts.map((product, index) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex gap-4 items-center">
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
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
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

                  {/* Info del producto */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-nadin-pink font-medium mb-1">{product.brand}</p>
                    <h3 className="font-semibold text-base mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {product.variants && product.variants.length > 0 && (
                        <span>Stock: {product.variants.reduce((sum, v) => sum + v.stock, 0)} unidades</span>
                      )}
                    </p>
                  </div>

                  {/* Precios */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="flex-shrink-0 text-right mr-4">
                      <div className="text-lg font-bold text-nadin-pink mb-1">
                        {formatCurrency(calcularPrecioVenta(product.variants[0].price, userMargen))}
                      </div>
                      {showCosts && (
                        <>
                          <div className="text-xs text-gray-600">
                            Costo: {formatCurrency(product.variants[0].price)}
                          </div>
                          <div className="text-xs text-green-600 font-semibold">
                            +{formatCurrency(calcularPrecioVenta(product.variants[0].price, userMargen) - product.variants[0].price)}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Icono flecha */}
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <Package className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="mb-2">No hay productos que coincidan con los filtros</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-nadin-pink hover:underline text-sm font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de detalle de producto */}
      {showProductDetail && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={closeProductDetail}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
                <button onClick={closeProductDetail} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-nadin-pink font-medium mb-4">{selectedProduct.brand}</p>
              
              {selectedProduct.image && selectedProduct.image !== '/placeholder.png' && (
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-64 object-cover rounded-lg mb-4" />
              )}

              {/* Precios en el modal */}
              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-2xl font-bold text-nadin-pink mb-2">
                    {formatCurrency(calcularPrecioVenta(selectedProduct.variants[0].price, userMargen))}
                  </div>
                  {showCosts && (
                    <>
                      <div className="text-sm text-gray-600">
                        Costo: {formatCurrency(selectedProduct.variants[0].price)}
                      </div>
                      <div className="text-sm text-green-600 font-semibold">
                        Ganancia: {formatCurrency(calcularPrecioVenta(selectedProduct.variants[0].price, userMargen) - selectedProduct.variants[0].price)}
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-800">
                  💡 <strong>Funcionalidad en desarrollo</strong>
                </p>
                <p className="text-sm text-blue-600 mt-2">
                  Próximamente podrás seleccionar variantes y agregar al pedido desde aquí
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
