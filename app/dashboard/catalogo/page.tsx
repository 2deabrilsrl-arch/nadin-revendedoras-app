'use client';
import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Eye, EyeOff, Search, Package, Tag, ChevronDown, ChevronUp, Filter, Sparkles, X } from 'lucide-react';
import { calcularPrecioVenta, formatCurrency } from '@/lib/precios';
import ProductModal, { CartItem } from '@/components/ProductModal';
import ProductCard from '@/components/ProductCard';
import { useCart } from '@/components/CartContext';
import BackToHomeButton from '@/components/BackToHomeButton';

type ViewMode = 'initial' | 'all' | 'brands' | 'categories' | 'subcategories' | 'producttypes' | 'products';

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  image: string;
  images?: string[];
  variants: any[];
}

// Componente SearchableSelect (input con dropdown filtrable)
interface SearchableSelectProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function SearchableSelect({ label, options, value, onChange, placeholder }: SearchableSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

  useEffect(() => {
    // Filtrar opciones según el término de búsqueda
    if (searchTerm.trim() === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options]);

  useEffect(() => {
    // Cerrar dropdown al hacer click afuera
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !(wrapperRef.current as any).contains(event.target as any)) {
        setIsOpen(false);
      }
    }
    (globalThis as any).document?.addEventListener('mousedown', handleClickOutside);
    return () => (globalThis as any).document?.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={value || searchTerm}
          onChange={(e) => {
            setSearchTerm((e.target as any).value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || `Buscar ${label.toLowerCase()}...`}
          className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded"
              type="button"
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-gray-100 rounded"
            type="button"
          >
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            <>
              <button
                onClick={handleClear}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 text-gray-500 text-sm"
              >
                Todos
              </button>
              {filteredOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 ${
                    value === option ? 'bg-nadin-pink/10 text-nadin-pink font-semibold' : ''
                  }`}
                >
                  {option}
                </button>
              ))}
            </>
          ) : (
            <div className="px-3 py-2 text-gray-400 text-sm">
              No se encontraron opciones
            </div>
          )}
        </div>
      )}

      {options.length > 0 && (
        <p className="text-xs text-green-600 mt-1">
          {filteredOptions.length} {filteredOptions.length === 1 ? 'opción' : 'opciones'} disponibles
        </p>
      )}
      {options.length === 0 && (
        <p className="text-xs text-gray-400 mt-1">No hay opciones disponibles</p>
      )}
    </div>
  );
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

  // Estados para filtros GLOBALES
  const [showFilters, setShowFilters] = useState(true); // Filtros abiertos por defecto
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
    
    // Cargar filtros al inicio (todos los productos)
    loadFilterOptions();
  }, []);

  // Cargar opciones de filtros disponibles
  const loadFilterOptions = async () => {
    setLoadingFilters(true);
    try {
      const params = new URLSearchParams();
      if (selectedBrand) params.append('brand', selectedBrand);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedSubcategory) params.append('subcategory', selectedSubcategory);
      if (selectedProductType) params.append('productType', selectedProductType);

      console.log('🔍 [FILTROS] Cargando opciones con params:', params.toString());
      const res = await fetch(`/api/filtros?${params.toString()}`);
      const data = await res.json() as any;

      console.log('✅ [FILTROS] Respuesta recibida:', data);
      
      setAvailableTalles(data.talles || []);
      setAvailableColores(data.colores || []);
      
      console.log('✅ [FILTROS] Talles disponibles:', data.talles?.length || 0);
      console.log('✅ [FILTROS] Colores disponibles:', data.colores?.length || 0);
    } catch (error) {
      console.error('❌ [FILTROS] Error cargando opciones:', error);
      setAvailableTalles([]);
      setAvailableColores([]);
    } finally {
      setLoadingFilters(false);
    }
  };

  // Aplicar filtros (recarga productos con talle/color seleccionados)
  const applyFilters = () => {
    if (viewMode === 'all' || viewMode === 'products') {
      loadProducts({
        brand: selectedBrand,
        category: selectedCategory,
        subcategory: selectedSubcategory,
        productType: selectedProductType
      });
    } else if (viewMode === 'brands') {
      loadBrands();
    } else if (viewMode === 'categories') {
      loadCategories();
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSelectedTalle('');
    setSelectedColor('');
    // Recargar vista actual sin filtros
    if (viewMode === 'all' || viewMode === 'products') {
      loadProducts({
        brand: selectedBrand,
        category: selectedCategory,
        subcategory: selectedSubcategory,
        productType: selectedProductType
      });
    }
  };

  // Cargar TODO el catálogo
  const loadAllProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedTalle) params.append('talle', selectedTalle);
      if (selectedColor) params.append('color', selectedColor);

      const res = await fetch(`/api/catalogo?${params.toString()}`);
      const data = await res.json() as any;

      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando todos los productos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar marcas (filtradas por talle/color si están seleccionados)
  const loadBrands = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTalle) params.append('talle', selectedTalle);
      if (selectedColor) params.append('color', selectedColor);
      
      const res = await fetch(`/api/catalogo?${params.toString()}`);
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

  // Cargar categorías principales (filtradas por talle/color si están seleccionados)
  const loadCategories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTalle) params.append('talle', selectedTalle);
      if (selectedColor) params.append('color', selectedColor);
      
      const res = await fetch(`/api/catalogo?${params.toString()}`);
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
  const loadSubcategories = async (mainCategory: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTalle) params.append('talle', selectedTalle);
      if (selectedColor) params.append('color', selectedColor);
      
      const res = await fetch(`/api/catalogo?${params.toString()}`);
      const data: Product[] = await res.json() as any;

      const subcatsSet = new Set<string>();
      data.forEach(p => {
        if (p.category && p.category.startsWith(mainCategory + ' > ')) {
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

  // Cargar tipos de producto
  const loadProductTypes = async (mainCategory: string, subcat: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTalle) params.append('talle', selectedTalle);
      if (selectedColor) params.append('color', selectedColor);
      
      const res = await fetch(`/api/catalogo?${params.toString()}`);
      const data: Product[] = await res.json() as any;

      const typesSet = new Set<string>();
      const prefix = `${mainCategory} > ${subcat} > `;
      
      data.forEach(p => {
        if (p.category && p.category.startsWith(prefix)) {
          const parts = p.category.split(' > ');
          const type = parts[2]?.trim();
          if (type) {
            typesSet.add(type);
          }
        }
      });

      const typesArray: string[] = Array.from(typesSet).sort();
      setProductTypes(typesArray);
    } catch (error) {
      console.error('Error cargando tipos de producto:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos filtrados
  const loadProducts = async (filters: {
    brand?: string;
    category?: string;
    subcategory?: string;
    productType?: string;
  }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.category) params.append('category', filters.category);
      if (filters.subcategory) params.append('subcategory', filters.subcategory);
      if (filters.productType) params.append('productType', filters.productType);
      if (selectedTalle) params.append('talle', selectedTalle);
      if (selectedColor) params.append('color', selectedColor);

      const res = await fetch(`/api/catalogo?${params.toString()}`);
      const data = await res.json() as any;

      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Resetear todo y volver al inicio
  const resetAndGoInitial = () => {
    setViewMode('initial');
    setSelectedBrand('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedProductType('');
    setSearchTerm('');
    setProducts([]);
    setBrands([]);
    setCategories([]);
    setSubcategories([]);
    setProductTypes([]);
  };

  // Volver a la vista anterior
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
        resetAndGoInitial();
      }
    } else if (viewMode === 'producttypes') {
      setViewMode('subcategories');
    } else if (viewMode === 'subcategories') {
      setViewMode('categories');
    } else if (viewMode === 'brands' || viewMode === 'categories' || viewMode === 'all') {
      resetAndGoInitial();
    }
  };

  const handleAddToCart = (item: CartItem) => {
    addToCart(item);
  };

  // Componente de filtros (panel colapsable)
  const FilterPanel = () => (
    <div className="mb-4">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-nadin-pink to-pink-400 text-white rounded-lg hover:from-nadin-pink-dark hover:to-pink-500 transition-all"
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
                {/* Filtro de Talle con búsqueda */}
                <SearchableSelect
                  label="Talle"
                  options={availableTalles}
                  value={selectedTalle}
                  onChange={setSelectedTalle}
                  placeholder="Buscar o seleccionar talle..."
                />

                {/* Filtro de Color con búsqueda */}
                <SearchableSelect
                  label="Color"
                  options={availableColores}
                  value={selectedColor}
                  onChange={setSelectedColor}
                  placeholder="Buscar o seleccionar color..."
                />
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
  );

  // Vista inicial - 3 opciones: Ver Todo, Por Marca, Por Categoría
  if (viewMode === 'initial') {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <BackToHomeButton />
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-nadin-pink mb-2">Catálogo Completo</h1>
          <p className="text-gray-600">Elegí cómo querés navegar</p>
        </div>

        {/* Filtros globales arriba */}
        <FilterPanel />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ver Todo */}
          <button
            onClick={() => {
              setViewMode('all');
              loadAllProducts();
            }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <Sparkles size={64} className="mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Ver Todo</h2>
            <p className="text-green-100">Explorá el catálogo completo</p>
          </button>

          {/* Por Marca */}
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

          {/* Por Categoría */}
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

  // Vista "Ver Todo" - Muestra todos los productos
  if (viewMode === 'all') {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark"
            >
              <ArrowLeft size={20} />
              Volver
            </button>
            <button
              onClick={resetAndGoInitial}
              className="flex items-center gap-2 px-3 py-2 bg-nadin-pink text-white rounded-lg hover:bg-nadin-pink-dark"
              title="Ir al inicio"
            >
              <Sparkles size={18} />
              Inicio
            </button>
          </div>

          <button
            onClick={() => setShowCosts(!showCosts)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            {showCosts ? <EyeOff size={20} /> : <Eye size={20} />}
            <span className="hidden sm:inline">{showCosts ? 'Ocultar' : 'Ver'} Costos</span>
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-4">Catálogo Completo</h2>

        {/* Filtros arriba */}
        <FilterPanel />

        {/* Buscador */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm((e.target as any).value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  loadAllProducts();
                }
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            />
          </div>
        </div>

        {/* Info */}
        <div className="mb-4 text-sm text-gray-600">
          Mostrando {products.length} productos
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

  // Vista de marcas
  if (viewMode === 'brands') {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={resetAndGoInitial}
            className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark"
          >
            <ArrowLeft size={20} />
            Volver al inicio
          </button>
          <button
            onClick={resetAndGoInitial}
            className="flex items-center gap-2 px-3 py-2 bg-nadin-pink text-white rounded-lg hover:bg-nadin-pink-dark"
            title="Ir al inicio"
          >
            <Sparkles size={18} />
            Inicio
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-4">Seleccioná una Marca</h2>

        {/* Filtros arriba */}
        <FilterPanel />

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
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={resetAndGoInitial}
            className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark"
          >
            <ArrowLeft size={20} />
            Volver al inicio
          </button>
          <button
            onClick={resetAndGoInitial}
            className="flex items-center gap-2 px-3 py-2 bg-nadin-pink text-white rounded-lg hover:bg-nadin-pink-dark"
            title="Ir al inicio"
          >
            <Sparkles size={18} />
            Inicio
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-4">Seleccioná una Categoría</h2>

        {/* Filtros arriba */}
        <FilterPanel />

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
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark"
          >
            <ArrowLeft size={20} />
            Volver a categorías
          </button>
          <button
            onClick={resetAndGoInitial}
            className="flex items-center gap-2 px-3 py-2 bg-nadin-pink text-white rounded-lg hover:bg-nadin-pink-dark"
            title="Ir al inicio"
          >
            <Sparkles size={18} />
            Inicio
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-2">{selectedCategory}</h2>
        <p className="text-gray-600 mb-4">Seleccioná una subcategoría</p>

        {/* Filtros arriba */}
        <FilterPanel />

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
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark"
          >
            <ArrowLeft size={20} />
            Volver a subcategorías
          </button>
          <button
            onClick={resetAndGoInitial}
            className="flex items-center gap-2 px-3 py-2 bg-nadin-pink text-white rounded-lg hover:bg-nadin-pink-dark"
            title="Ir al inicio"
          >
            <Sparkles size={18} />
            Inicio
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-2">{selectedCategory} → {selectedSubcategory}</h2>
        <p className="text-gray-600 mb-4">Seleccioná un tipo de producto</p>

        {/* Filtros arriba */}
        <FilterPanel />

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

  // Vista de productos
  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark"
          >
            <ArrowLeft size={20} />
            Volver
          </button>
          <button
            onClick={resetAndGoInitial}
            className="flex items-center gap-2 px-3 py-2 bg-nadin-pink text-white rounded-lg hover:bg-nadin-pink-dark"
            title="Ir al inicio"
          >
            <Sparkles size={18} />
            Inicio
          </button>
        </div>

        <button
          onClick={() => setShowCosts(!showCosts)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          {showCosts ? <EyeOff size={20} /> : <Eye size={20} />}
          <span className="hidden sm:inline">{showCosts ? 'Ocultar' : 'Ver'} Costos</span>
        </button>
      </div>

      {/* Filtros arriba */}
      <FilterPanel />

      {/* Buscador */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm((e.target as any).value)}
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

      {/* Info */}
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
