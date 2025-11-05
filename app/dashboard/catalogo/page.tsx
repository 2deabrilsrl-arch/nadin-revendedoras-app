'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Search, Package } from 'lucide-react';
import { calcularPrecioVenta, formatCurrency } from '@/lib/precios';
import ProductModal, { CartItem } from '@/components/ProductModal';
import { useCart } from '@/components/CartContext';
import BackToHomeButton from '@/components/BackToHomeButton';

type ViewMode = 'initial' | 'brands' | 'categories' | 'subcategories' | 'producttypes' | 'products';

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  image: string;
  variants: any[];
}

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
  
  const { addToCart } = useCart();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
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
      const data: Product[] = await res.json();
      
      const brandsArray: string[] = Array.from(new Set(
        data
          .map(p => p.brand)
          .filter(b => b && b !== 'Sin marca')
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
      const data: Product[] = await res.json();
      
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
      const data: Product[] = await res.json();
      
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
      const data: Product[] = await res.json();
      
      const typesSet = new Set<string>();
      data.forEach(p => {
        if (p.category && p.category.includes(subcategory)) {
          const parts = p.category.split(' > ');
          const prodType = parts[2]?.trim();
          if (prodType) {
            typesSet.add(prodType);
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

      const res = await fetch(`/api/catalogo?${params.toString()}`);
      const data = await res.json();
      
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: CartItem) => {
    addToCart(item);
    alert('✅ Producto agregado al pedido');
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
    setViewMode('initial');
  };

  // Vista inicial
  if (viewMode === 'initial') {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <BackToHomeButton />
        <h2 className="text-2xl font-bold mb-6 text-center">¿Qué querés mostrar?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              setViewMode('brands');
              loadBrands();
            }}
            className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="text-6xl mb-4">🏷️</div>
            <h3 className="text-xl font-bold mb-2">Por Marca</h3>
            <p className="text-gray-600 text-sm">Navega por marcas específicas</p>
          </button>

          <button
            onClick={() => {
              setViewMode('categories');
              loadCategories();
            }}
            className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-xl font-bold mb-2">Por Categoría</h3>
            <p className="text-gray-600 text-sm">Explora por tipo de producto</p>
          </button>

          <button
            onClick={() => {
              setViewMode('products');
              loadProducts();
            }}
            className="bg-gradient-to-br from-nadin-pink to-pink-400 text-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold mb-2">Ver Todo</h3>
            <p className="text-sm">Ver catálogo completo</p>
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
          Volver
        </button>

        <h2 className="text-2xl font-bold mb-6">Seleccioná una marca</h2>

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
                <div className="text-3xl mb-2">🏷️</div>
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
          Volver
        </button>

        <h2 className="text-2xl font-bold mb-6">Seleccioná una categoría</h2>

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
                <div className="text-3xl mb-2">
                  {cat.includes('MUJER') ? '👚' : cat.includes('HOMBRE') ? '👔' : '👶'}
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

  // Vista de productos
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

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

      <div className="mb-4 text-sm text-gray-600">
        Mostrando {products.length} productos
        {selectedBrand && ` de ${selectedBrand}`}
        {selectedCategory && ` en ${selectedCategory}`}
        {selectedSubcategory && ` → ${selectedSubcategory}`}
        {selectedProductType && ` → ${selectedProductType}`}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
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
                      Stock: {product.variants.reduce((sum: number, v: any) => sum + v.stock, 0)} unidades
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
