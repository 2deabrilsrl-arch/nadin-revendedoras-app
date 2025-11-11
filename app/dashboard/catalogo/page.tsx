'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Search, Package, Tag, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { calcularPrecioVenta, formatCurrency } from '@/lib/precios';
import ProductModal, { CartItem } from '@/components/ProductModal';
import ProductCard from '@/components/ProductCard';
import { useCart } from '@/components/CartContext';
import BackToHomeButton from '@/components/BackToHomeButton';

type ViewMode = 'initial' | 'brands' | 'categories' | 'subcategories' | 'producttypes' | 'products';

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  image: string;
  images?: string[];
  variants: any[];
}

// Función para obtener el ícono correcto según la categoría
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toUpperCase();
  
  if (name.includes('BLANCO')) {
    return <div className="text-5xl">🛏️</div>;
  } else if (name.includes('HOMBRE')) {
    return <div className="text-5xl">👨</div>;
  } else if (name.includes('MUJER')) {
    return <div className="text-5xl">👩</div>;
  } else if (name.includes('NIÑO') || name.includes('NIÑA')) {
    return <div className="text-5xl">👶</div>;
  } else {
    return <Tag size={48} className="text-gray-500" />;
  }
};

export default function CatalogoPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('initial');
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);

  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [userMargen, setUserMargen] = useState(60);
  const [showCosts, setShowCosts] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ NUEVOS ESTADOS PARA FILTROS
  const [showFilters, setShowFilters] = useState(false);
  const [availableTalles, setAvailableTalles] = useState<string[]>([]);
  const [availableColores, setAvailableColores] = useState<string[]>([]);
  const [selectedTalle, setSelectedTalle] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [loadingFilters, setLoadingFilters] = useState(false);

  const { addToCart } = useCart();

  useEffect(() => {
    const userStr = (globalThis as any).localStorage?.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserMargen(user.margen || 60);
    }
  }, []);

  // Cargar marcas
  const loadBrands = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/catalogo');
      const data: Product[] = await res.json() as any;

      const brandsArray: string[] = Array.from(new Set(
        data
          .map(p => p.brand)
          .filter((b): b is string => !!(b && b !== 'Sin marca'))
      )).sort();

      setBrands(brandsArray);
    } catch (error) {
      console.error('Error cargando marcas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar categorías principales
  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/catalogo');
      const data: Product[] = await res.json() as any;

      const catsSet = new Set<string>();
      data.forEach(p => {
        if (p.category) {
          const parts = p.category.split(' > ');
          const mainCat = parts[0]?.trim();
          if (mainCat && mainCat !== 'MARCAS') {
            catsSet.add(mainCat);
          }
        }
      });

      const catsArray: string[] = Array.from(catsSet).sort();
      setCategories(catsArray);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar subcategorías de una categoría
  const loadSubcategories = async (category: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/catalogo?category=${encodeURIComponent(category)}`);
      const data: Product[] = await res.json() as any;

      const subcatsSet = new Set<string>();
      data.forEach(p => {
        if (p.category && p.category.startsWith(category)) {
          const parts = p.category.split(' > ');
          const subcat = parts[1]?.trim();
          if (subcat) {
            subcatsSet.add(subcat);
          }
        }
      });

      const subcatsArray: string[] = Array.from(subcatsSet).sort();
      setSubcategories(subcatsArray);
    } catch (error) {
      console.error('Error cargando subcategorías:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar tipos de producto de una subcategoría
  const loadProductTypes = async (category: string, subcategory: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/catalogo?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`
      );
      const data: Product[] = await res.json() as any;

      const typesSet = new Set<string>();
      data.forEach(p => {
        if (p.category) {
          const parts = p.category.split(' > ').map(part => part.trim());
          if (parts[1] === subcategory) {
            const prodType = parts[2];
            if (prodType) {
              typesSet.add(prodType);
            }
          }
        }
      });

      const typesArray: string[] = Array.from(typesSet).sort();
      setProductTypes(typesArray);
    } catch (error) {
      console.error('Error cargando tipos:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Cargar opciones de filtros disponibles
  const loadFilterOptions = async () => {
    setLoadingFilters(true);
    try {
      const params = new URLSearchParams();
      if (selectedBrand) params.append('brand', selectedBrand);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedSubcategory) params.append('subcategory', selectedSubcategory);
      if (selectedProductType) params.append('productType', selectedProductType);

      const res = await fetch(`/api/filtros?${params.toString()}`);
      const data = await res.json() as any;

      setAvailableTalles(data.talles || []);
      setAvailableColores(data.colores || []);
    } catch (error) {
      console.error('Error cargando opciones de filtros:', error);
      setAvailableTalles([]);
      setAvailableColores([]);
    } finally {
      setLoadingFilters(false);
    }
  };

  // Cargar productos
  const loadProducts = async (filters: any = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.category) params.append('category', filters.category);
      if (filters.subcategory) params.append('subcategory', filters.subcategory);
      if (filters.productType) params.append('productType', filters.productType);
      if (searchTerm) params.append('search', searchTerm);
      
      // ✅ AGREGAR FILTROS DE TALLE Y COLOR
      if (selectedTalle) params.append('talle', selectedTalle);
      if (selectedColor) params.append('color', selectedColor);

      const res = await fetch(`/api/catalogo?${params.toString()}`);
      const data = await res.json() as any;

      setProducts(Array.isArray(data) ? data : []);
      
      // ✅ Cargar opciones de filtros cuando hay productos
      await loadFilterOptions();
    } catch (error) {
      console.error('Error cargando productos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: CartItem) => {
    addToCart(item);
    (globalThis as any).alert?.('✅ Producto agregado al pedido');
  };

  const goBack = () => {
    if (viewMode === 'products') {
      if (selectedProductType) {
        setSelectedProductType('');
        setViewMode('producttypes');
      } else if (selectedSubcategory) {
        setSelectedSubcategory('');
        setViewMode('subcategories');
      } else if (selectedCategory) {
        setSelectedCategory('');
        setViewMode('categories');
      } else if (selectedBrand) {
        setSelectedBrand('');
        setViewMode('brands');
      } else {
        setViewMode('initial');
      }
    } else if (viewMode === 'producttypes') {
      setViewMode('subcategories');
    } else if (viewMode === 'subcategories') {
      setViewMode('categories');
    } else if (viewMode === 'brands' || viewMode === 'categories') {
      setViewMode('initial');
    }
  };

  const resetAndGoInitial = () => {
    setSelectedBrand('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedProductType('');
    setSearchTerm('');
    setProducts([]);
    setSelectedTalle('');
    setSelectedColor('');
    setShowFilters(false);
    setViewMode('initial');
  };

  // ✅ NUEVA FUNCIÓN: Limpiar filtros de talle y color
  const clearFilters = () => {
    setSelectedTalle('');
    setSelectedColor('');
    loadProducts({
      brand: selectedBrand,
      category: selectedCategory,
      subcategory: selectedSubcategory,
      productType: selectedProductType
    });
  };

  // ✅ NUEVA FUNCIÓN: Aplicar filtros
  const applyFilters = () => {
    loadProducts({
      brand: selectedBrand,
      category: selectedCategory,
      subcategory: selectedSubcategory,
      productType: selectedProductType
    });
  };

  // Vista inicial
  if (viewMode === 'initial') {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <BackToHomeButton />
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-nadin-pink mb-2">Catálogo Completo</h1>
          <p className="text-gray-600">Elegí cómo querés navegar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => {
              setViewMode('brands');
              loadBrands();
            }}
            className="bg-gradient-to-br from-nadin-pink to-pink-400 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <Tag size={64} className="mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Por Marca</h2>
            <p className="text-pink-100">Explorá productos de marcas específicas</p>
          </button>

          <button
            onClick={() => {
              setViewMode('categories');
              loadCategories();
            }}
            className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <Package size={64} className="mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Por Categoría</h2>
            <p className="text-purple-100">Navegá por tipo de producto</p>
          </button>
        </div>
      </div>
    );
  }

  // Vista de marcas
  if (viewMode === 'brands') {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <button
          onClick={resetAndGoInitial}
          className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark mb-4"
        >
          <ArrowLeft size={20} />
          Volver al inicio
        </button>

        <h2 className="text-2xl font-bold mb-6">Seleccioná una Marca</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => {
                  setSelectedBrand(brand);
                  setViewMode('products');
                  loadProducts({ brand });
                }}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 text-center"
              >
                <Tag size={32} className="mx-auto mb-2 text-nadin-pink" />
                <p className="font-semibold">{brand}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Vista de categorías
  if (viewMode === 'categories') {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <button
          onClick={resetAndGoInitial}
          className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark mb-4"
        >
          <ArrowLeft size={20} />
          Volver al inicio
        </button>

        <h2 className="text-2xl font-bold mb-6">Seleccioná una Categoría</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setViewMode('subcategories');
                  loadSubcategories(cat);
                }}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 text-center"
              >
                <div className="mb-3 flex justify-center">
                  {getCategoryIcon(cat)}
                </div>
                <p className="font-semibold">{cat}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Vista de subcategorías
  if (viewMode === 'subcategories') {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark mb-4"
        >
          <ArrowLeft size={20} />
          Volver a categorías
        </button>

        <h2 className="text-2xl font-bold mb-2">{selectedCategory}</h2>
        <p className="text-gray-600 mb-6">Seleccioná una subcategoría</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {subcategories.map((subcat) => (
                <button
                  key={subcat}
                  onClick={() => {
                    setSelectedSubcategory(subcat);
                    setViewMode('producttypes');
                    loadProductTypes(selectedCategory, subcat);
                  }}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 text-center"
                >
                  <p className="font-semibold">{subcat}</p>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setViewMode('products');
                loadProducts({ category: selectedCategory });
              }}
              className="w-full bg-nadin-pink text-white p-4 rounded-lg font-semibold hover:bg-nadin-pink-dark"
            >
              Ver Todos los productos de {selectedCategory}
            </button>
          </>
        )}
      </div>
    );
  }

  // Vista de tipos de producto
  if (viewMode === 'producttypes') {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark mb-4"
        >
          <ArrowLeft size={20} />
          Volver a subcategorías
        </button>

        <h2 className="text-2xl font-bold mb-2">{selectedCategory} → {selectedSubcategory}</h2>
        <p className="text-gray-600 mb-6">Seleccioná un tipo de producto</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
          </div>
        ) : productTypes.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {productTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedProductType(type);
                    setViewMode('products');
                    loadProducts({
                      category: selectedCategory,
                      subcategory: selectedSubcategory,
                      productType: type
                    });
                  }}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 text-center"
                >
                  <p className="font-semibold">{type}</p>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setViewMode('products');
                loadProducts({
                  category: selectedCategory,
                  subcategory: selectedSubcategory
                });
              }}
              className="w-full bg-nadin-pink text-white p-4 rounded-lg font-semibold hover:bg-nadin-pink-dark"
            >
              Ver Todos los productos de {selectedSubcategory}
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              setViewMode('products');
              loadProducts({
                category: selectedCategory,
                subcategory: selectedSubcategory
              });
            }}
            className="w-full bg-nadin-pink text-white p-4 rounded-lg font-semibold hover:bg-nadin-pink-dark"
          >
            Ver Productos de {selectedSubcategory}
          </button>
        )}
      </div>
    );
  }

  // Vista de productos CON FILTROS
  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark"
        >
          <ArrowLeft size={20} />
          Volver
        </button>

        <button
          onClick={() => setShowCosts(!showCosts)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          {showCosts ? <EyeOff size={20} /> : <Eye size={20} />}
          <span className="hidden sm:inline">{showCosts ? 'Ocultar' : 'Ver'} Costos</span>
        </button>
      </div>

      {/* ✅ PANEL DE FILTROS COLAPSABLE */}
      <div className="mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between bg-white border-2 border-gray-200 rounded-lg px-4 py-3 hover:border-nadin-pink transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-nadin-pink" />
            <span className="font-semibold">
              Filtros
              {(selectedTalle || selectedColor) && (
                <span className="ml-2 text-sm text-nadin-pink">
                  ({[selectedTalle, selectedColor].filter(Boolean).length} activos)
                </span>
              )}
            </span>
          </div>
          {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showFilters && (
          <div className="mt-2 bg-white border-2 border-gray-200 rounded-lg p-4">
            {loadingFilters ? (
              <div className="text-center py-4 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nadin-pink mx-auto mb-2"></div>
                Cargando opciones...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Filtro de Talle */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Talle
                    </label>
                    <select
                      value={selectedTalle}
                      onChange={(e) => setSelectedTalle((e.target as HTMLSelectElement).value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
                    >
                      <option value="">Todos los talles</option>
                      {availableTalles.map((talle) => (
                        <option key={talle} value={talle}>
                          {talle}
                        </option>
                      ))}
                    </select>
                    {availableTalles.length === 0 && (
                      <p className="text-xs text-gray-400 mt-1">No hay talles disponibles</p>
                    )}
                  </div>

                  {/* Filtro de Color */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Color
                    </label>
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor((e.target as HTMLSelectElement).value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
                    >
                      <option value="">Todos los colores</option>
                      {availableColores.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                    {availableColores.length === 0 && (
                      <p className="text-xs text-gray-400 mt-1">No hay colores disponibles</p>
                    )}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                  <button
                    onClick={applyFilters}
                    className="flex-1 bg-nadin-pink text-white px-4 py-2 rounded-lg font-semibold hover:bg-nadin-pink-dark transition-colors"
                  >
                    Aplicar Filtros
                  </button>
                  {(selectedTalle || selectedColor) && (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                loadProducts({
                  brand: selectedBrand,
                  category: selectedCategory,
                  subcategory: selectedSubcategory,
                  productType: selectedProductType
                });
              }
            }}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
          />
        </div>
      </div>

      {/* Info de productos */}
      <div className="mb-4 text-sm text-gray-600">
        Mostrando {products.length} productos
        {selectedBrand && ` de ${selectedBrand}`}
        {selectedCategory && ` en ${selectedCategory}`}
        {selectedSubcategory && ` → ${selectedSubcategory}`}
        {selectedProductType && ` → ${selectedProductType}`}
        {selectedTalle && ` | Talle: ${selectedTalle}`}
        {selectedColor && ` | Color: ${selectedColor}`}
      </div>

      {/* Grid de productos */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => {
                setSelectedProduct(product);
                setIsModalOpen(true);
              }}
              userMargen={userMargen}
              showCosts={showCosts}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Package size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-lg">No se encontraron productos</p>
          {(selectedTalle || selectedColor) && (
            <button
              onClick={clearFilters}
              className="mt-4 text-nadin-pink hover:underline"
            >
              Limpiar filtros y ver todos
            </button>
          )}
        </div>
      )}

      {/* Modal de producto */}
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
