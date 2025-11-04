'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, ChevronDown, Package } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  image: string;
  variants: any[];
}

interface Category {
  id: string;
  name: { es: string };
  parent?: string;
  subcategories?: Category[];
}

export default function BestSellersPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [thirdLevelCategories, setThirdLevelCategories] = useState<Category[]>([]);
  
  const [selectedMain, setSelectedMain] = useState<string>('');
  const [selectedSub, setSelectedSub] = useState<string>('');
  const [selectedThird, setSelectedThird] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMain) {
      const subs = categories.filter(c => c.parent === selectedMain);
      setSubCategories(subs);
      setSelectedSub('');
      setSelectedThird('');
      setThirdLevelCategories([]);
    } else {
      setSubCategories([]);
      setThirdLevelCategories([]);
    }
  }, [selectedMain, categories]);

  useEffect(() => {
    if (selectedSub) {
      const thirds = categories.filter(c => c.parent === selectedSub);
      setThirdLevelCategories(thirds);
      setSelectedThird('');
    } else {
      setThirdLevelCategories([]);
    }
  }, [selectedSub, categories]);

  useEffect(() => {
    applyFilters();
  }, [allProducts, selectedMain, selectedSub, selectedThird]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/catalogo/best-sellers?limit=100'),
        fetch('/api/catalogo/categories')
      ]);
      
      if (!productsRes.ok || !categoriesRes.ok) {
        throw new Error('Error al cargar datos');
      }

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      
      const products = Array.isArray(productsData) ? productsData : (productsData.products || []);
      const cats = Array.isArray(categoriesData) ? categoriesData : (categoriesData.categories || []);
      
      setAllProducts(products);
      setCategories(cats);
      
      const mains = cats.filter((c: Category) => !c.parent);
      setMainCategories(mains);
      
      setFilteredProducts(products.slice(0, 10));
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar datos. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allProducts];

    if (selectedThird) {
      const thirdCat = categories.find(c => c.id === selectedThird);
      if (thirdCat) {
        filtered = filtered.filter(p => 
          p.category.toLowerCase().includes(thirdCat.name.es.toLowerCase())
        );
      }
    } else if (selectedSub) {
      const subCat = categories.find(c => c.id === selectedSub);
      if (subCat) {
        filtered = filtered.filter(p => 
          p.category.toLowerCase().includes(subCat.name.es.toLowerCase())
        );
      }
    } else if (selectedMain) {
      const mainCat = categories.find(c => c.id === selectedMain);
      if (mainCat) {
        filtered = filtered.filter(p => 
          p.category.toLowerCase().includes(mainCat.name.es.toLowerCase())
        );
      }
    }

    setFilteredProducts(filtered.slice(0, 10));
  };

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
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="text-nadin-pink" size={28} />
          <h2 className="text-2xl font-bold">🔥 Más Vendidos</h2>
        </div>
        <p className="text-gray-600 text-sm">
          Los productos con mejor rendimiento según Tiendanube
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <h3 className="font-bold text-gray-800 mb-4">Filtrar por categoría:</h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          {/* Categoría Principal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría Principal
            </label>
            <div className="relative">
              <select
                value={selectedMain}
                onChange={(e) => setSelectedMain(e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-nadin-pink focus:border-transparent bg-white"
              >
                <option value="">Top 10 General</option>
                {mainCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name.es}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            </div>
          </div>

          {/* Subcategoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategoría
            </label>
            <div className="relative">
              <select
                value={selectedSub}
                onChange={(e) => setSelectedSub(e.target.value)}
                disabled={!selectedMain || subCategories.length === 0}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-nadin-pink focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Todas</option>
                {subCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name.es}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            </div>
          </div>

          {/* Tipo de Producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Producto
            </label>
            <div className="relative">
              <select
                value={selectedThird}
                onChange={(e) => setSelectedThird(e.target.value)}
                disabled={!selectedSub || thirdLevelCategories.length === 0}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-nadin-pink focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Todos</option>
                {thirdLevelCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name.es}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            </div>
          </div>
        </div>

        {/* Filtros activos */}
        {(selectedMain || selectedSub || selectedThird) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Mostrando:</span>
            {selectedMain && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {mainCategories.find(c => c.id === selectedMain)?.name.es}
              </span>
            )}
            {selectedSub && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                {subCategories.find(c => c.id === selectedSub)?.name.es}
              </span>
            )}
            {selectedThird && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-nadin-pink text-white">
                {thirdLevelCategories.find(c => c.id === selectedThird)?.name.es}
              </span>
            )}
            <button
              onClick={() => {
                setSelectedMain('');
                setSelectedSub('');
                setSelectedThird('');
              }}
              className="text-sm text-nadin-pink hover:underline"
            >
              Limpiar
            </button>
          </div>
        )}
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
                  <div className="flex-shrink-0 w-12 flex items-center justify-center">
                    <div className={`
                      text-2xl font-bold
                      ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-600' : 'text-gray-600'}
                    `}>
                      {getMedalEmoji(index + 1)}
                    </div>
                  </div>

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

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
                    <h3 className="font-semibold text-base mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {product.variants && product.variants.length > 0 && (
                        <span>Stock: {product.variants.reduce((sum: number, v: any) => sum + v.stock, 0)} unidades</span>
                      )}
                    </p>
                  </div>

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
            <p className="mb-2">No hay productos en esta categoría</p>
            <button
              onClick={() => {
                setSelectedMain('');
                setSelectedSub('');
                setSelectedThird('');
              }}
              className="text-nadin-pink hover:underline text-sm"
            >
              Ver todos los productos
            </button>
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
              
              <p className="text-gray-600 mb-4">{selectedProduct.brand}</p>
              
              {selectedProduct.image && (
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-64 object-cover rounded-lg mb-4" />
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
