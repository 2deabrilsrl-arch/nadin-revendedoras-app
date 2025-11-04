'use client';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Search, X, ArrowLeft, Package } from 'lucide-react';
import { calcularPrecioVenta, formatCurrency } from '@/lib/precios';
import ProductModal, { CartItem } from '@/components/ProductModal';
import { useCart } from '@/components/CartContext';

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

type ViewMode = 'initial' | 'by-brand' | 'by-category' | 'products' | 'all-products';

export default function CatalogoPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('initial');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [userMargen, setUserMargen] = useState(60);
  const [showCosts, setShowCosts] = useState(false);

  // Filtros de navegación
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');

  // Listas únicas
  const [brands, setBrands] = useState<string[]>([]);
  const [mainCategories, setMainCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);

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
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      extractUniqueValues();
    }
  }, [products]);

  const extractUniqueValues = () => {
    const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
    setBrands(uniqueBrands);

    const categoriesSet = new Set<string>();
    products.forEach(p => {
      if (p.category) {
        const parts = p.category.split(' > ');
        if (parts[0] && parts[0] !== 'MARCAS') {
          categoriesSet.add(parts[0].trim());
        }
      }
    });
    setMainCategories([...categoriesSet].sort());
  };

  const loadAllProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/catalogo');
      
      if (!res.ok) throw new Error('Error al cargar productos');

      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError('Error al cargar el catálogo');
    } finally {
      setLoading(false);
    }
  };

  const loadProductsByBrand = async (brand: string) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/catalogo?brand=${encodeURIComponent(brand)}`);
      
      if (!res.ok) throw new Error('Error al cargar productos');

      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
      setViewMode('products');
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const loadProductsByCategory = async (mainCat: string, subcat?: string, prodType?: string) => {
    try {
      setLoading(true);
      setError('');
      
      let url = `/api/catalogo?category=${encodeURIComponent(mainCat)}`;
      if (subcat) url += `&subcategory=${encodeURIComponent(subcat)}`;
      if (prodType) url += `&productType=${encodeURIComponent(prodType)}`;
      
      const res = await fetch(url);
      
      if (!res.ok) throw new Error('Error al cargar productos');

      const data = await res.json();
      const loadedProducts = Array.isArray(data) ? data : data.products || [];
      setProducts(loadedProducts);
      
      if (!subcat) {
        const subcatsSet = new Set<string>();
        loadedProducts.forEach((p: Product) => {
          if (p.category) {
            const parts = p.category.split(' > ');
            if (parts[1]) {
              subcatsSet.add(parts[1].trim());
            }
          }
        });
        setSubcategories([...subcatsSet].sort());
      }
      
      if (subcat && !prodType) {
        const typesSet = new Set<string>();
        loadedProducts.forEach((p: Product) => {
          if (p.category) {
            const parts = p.category.split(' > ');
            if (parts[2]) {
              typesSet.add(parts[2].trim());
            }
          }
        });
        setProductTypes([...typesSet].sort());
      }
      
      if (prodType || (subcat && loadedProducts.length > 0)) {
        setViewMode('products');
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToInitial = () => {
    setViewMode('initial');
    setSelectedBrand('');
    setSelectedMainCategory('');
    setSelectedSubcategory('');
    setSelectedProductType('');
    setProducts([]);
    setSearch('');
  };

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    loadProductsByBrand(brand);
  };

  const handleMainCategorySelect = (category: string) => {
    setSelectedMainCategory(category);
    loadProductsByCategory(category);
    setViewMode('by-category');
  };

  const handleSubcategorySelect = (subcat: string) => {
    setSelectedSubcategory(subcat);
    loadProductsByCategory(selectedMainCategory, subcat);
  };

  const handleProductTypeSelect = (type: string) => {
    setSelectedProductType(type);
    loadProductsByCategory(selectedMainCategory, selectedSubcategory, type);
  };

  const handleShowAll = () => {
    setViewMode('all-products');
    loadAllProducts();
  };

  // Handler para agregar al carrito
  const handleAddToCart = (item: CartItem) => {
    addToCart(item);
    alert('✅ Producto agregado al pedido');
  };

  const filteredProducts = products.filter(p => {
    if (!search) return true;
    
    const searchLower = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchLower) ||
      p.brand.toLowerCase().includes(searchLower) ||
      p.variants.some(v => v.sku?.toLowerCase().includes(searchLower))
    );
  });

  if (viewMode === 'initial') {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-6 text-center">¿Qué querés mostrar?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => {
              setViewMode('by-brand');
              loadAllProducts();
            }}
            className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
          >
            <div className="text-6xl mb-4 text-center group-hover:scale-110 transition-transform">🏷️</div>
            <h3 className="font-bold text-xl mb-2 text-center">Por Marca</h3>
            <p className="text-gray-600 text-sm text-center">
              Navegá por marcas específicas
            </p>
          </button>

          <button
            onClick={() => {
              setViewMode('by-category');
              loadAllProducts();
            }}
            className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
          >
            <div className="text-6xl mb-4 text-center group-hover:scale-110 transition-transform">📂</div>
            <h3 className="font-bold text-xl mb-2 text-center">Por Categoría</h3>
            <p className="text-gray-600 text-sm text-center">
              Explorá por tipo de producto
            </p>
          </button>

          <button
            onClick={handleShowAll}
            className="bg-gradient-to-br from-nadin-pink to-pink-400 text-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
          >
            <div className="text-6xl mb-4 text-center group-hover:scale-110 transition-transform">🌟</div>
            <h3 className="font-bold text-xl mb-2 text-center">Ver Todo</h3>
            <p className="text-white text-opacity-90 text-sm text-center">
              Ver catálogo completo
            </p>
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === 'by-brand' && !selectedBrand) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <button
          onClick={handleBackToInitial}
          className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark mb-4"
        >
          <ArrowLeft size={20} />
          Volver
        </button>

        <h2 className="text-2xl font-bold mb-6">Seleccioná una marca</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => handleBrandSelect(brand)}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 text-center"
              >
                <div className="font-bold text-lg text-nadin-pink">{brand}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'by-category' && !selectedMainCategory) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <button
          onClick={handleBackToInitial}
          className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark mb-4"
        >
          <ArrowLeft size={20} />
          Volver
        </button>

        <h2 className="text-2xl font-bold mb-6">Seleccioná una categoría</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {mainCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleMainCategorySelect(cat)}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="text-5xl mb-3 text-center">
                  {cat === 'MUJER' && '👩'}
                  {cat === 'HOMBRE' && '👨'}
                  {cat === 'NIÑOS' && '👶'}
                  {!['MUJER', 'HOMBRE', 'NIÑOS'].includes(cat) && '📦'}
                </div>
                <div className="font-bold text-xl text-center">{cat}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'by-category' && selectedMainCategory && !selectedSubcategory) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <button
          onClick={() => {
            setSelectedMainCategory('');
            setSubcategories([]);
          }}
          className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark mb-4"
        >
          <ArrowLeft size={20} />
          Volver a categorías
        </button>

        <h2 className="text-2xl font-bold mb-2">{selectedMainCategory}</h2>
        <p className="text-gray-600 mb-6">Seleccioná una subcategoría</p>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {subcategories.map((subcat) => (
              <button
                key={subcat}
                onClick={() => handleSubcategorySelect(subcat)}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 text-center"
              >
                <div className="font-bold text-lg">{subcat}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'by-category' && selectedSubcategory && !selectedProductType && productTypes.length > 0) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <button
          onClick={() => {
            setSelectedSubcategory('');
            setProductTypes([]);
          }}
          className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark mb-4"
        >
          <ArrowLeft size={20} />
          Volver a subcategorías
        </button>

        <h2 className="text-2xl font-bold mb-2">{selectedMainCategory} &gt; {selectedSubcategory}</h2>
        <p className="text-gray-600 mb-6">Seleccioná un tipo de producto</p>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleProductTypeSelect(type)}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 text-center"
              >
                <div className="font-bold text-lg">{type}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
            <p className="mt-4 text-gray-600">Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleBackToInitial}
          className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark"
        >
          <ArrowLeft size={20} />
          Volver
        </button>
        
        {selectedBrand && (
          <span className="text-sm text-gray-600">Marca: <strong>{selectedBrand}</strong></span>
        )}
        {selectedMainCategory && (
          <span className="text-sm text-gray-600">
            {selectedMainCategory}
            {selectedSubcategory && ` > ${selectedSubcategory}`}
            {selectedProductType && ` > ${selectedProductType}`}
          </span>
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Productos</h2>
        <button
          onClick={() => setShowCosts(!showCosts)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
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

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, marca o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedProduct(product);
                setIsModalOpen(true);
              }}
            >
              <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                {product.image && product.image !== '/placeholder.png' ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package size={48} />
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
                    
                    <div className="border-t pt-2 space-y-1">
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
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Package size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-lg">No se encontraron productos</p>
        </div>
      )}

      {/* Modal de selección de producto */}
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
