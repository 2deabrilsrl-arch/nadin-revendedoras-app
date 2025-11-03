'use client';
import { useEffect, useState } from 'react';
import { calcularPrecioVenta, formatCurrency } from '@/lib/precios';
import { Eye, EyeOff, Filter, X } from 'lucide-react';

interface Product {
  id: string;
  name: { es: string };
  variants: any[];
  images: { src: string }[];
  brand?: string;
  tags?: string[];
}

export default function CatalogoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showCosts, setShowCosts] = useState(false);
  
  // Filtros
  const [selectedSex, setSelectedSex] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetch('/api/catalogo')
      .then(r => r.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar productos:', err);
        setLoading(false);
      });
  }, []);

  // Función para detectar sexo del producto desde tags o nombre
  const detectSex = (product: Product): string => {
    const name = product.name.es.toLowerCase();
    const tags = (product.tags || []).join(' ').toLowerCase();
    const combined = `${name} ${tags}`;
    
    if (combined.includes('mujer') || combined.includes('femenino') || combined.includes('dama')) return 'Mujer';
    if (combined.includes('hombre') || combined.includes('masculino') || combined.includes('caballero')) return 'Hombre';
    if (combined.includes('niño') || combined.includes('niña') || combined.includes('infantil') || combined.includes('kids')) return 'Niños';
    if (combined.includes('unisex')) return 'Unisex';
    
    return 'Mujer'; // Por defecto
  };

  // Función para detectar categoría
  const detectCategory = (product: Product): string => {
    const name = product.name.es.toLowerCase();
    
    if (name.includes('conjunto')) return 'Conjuntos';
    if (name.includes('corpiño') || name.includes('bra') || name.includes('sostén')) return 'Corpiños';
    if (name.includes('bombacha') || name.includes('culotte')) return 'Bombachas';
    if (name.includes('tanga')) return 'Tangas';
    if (name.includes('boxer')) return 'Boxers';
    if (name.includes('medias') || name.includes('calcetines')) return 'Medias';
    if (name.includes('pijama') || name.includes('camisón')) return 'Pijamas';
    
    return 'Otros';
  };

  // Productos filtrados
  const filteredProducts = products.filter(p => {
    const sex = detectSex(p);
    const category = detectCategory(p);
    
    if (selectedSex && sex !== selectedSex) return false;
    if (selectedBrand && p.brand !== selectedBrand) return false;
    if (selectedCategory && category !== selectedCategory) return false;
    
    return true;
  });

  // Extraer opciones únicas
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
  const sexOptions = ['Mujer', 'Hombre', 'Niños', 'Unisex'];
  const categories = [...new Set(products.map(p => detectCategory(p)))].sort();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Catálogo</h2>
        <p className="text-gray-600">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header con controles */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">Catálogo</h2>
            <p className="text-sm text-gray-600">
              {showCosts ? `Tu margen: ${user?.margen || 60}%` : ''} · {filteredProducts.length} de {products.length} productos
            </p>
          </div>
          
          <button
            onClick={() => setShowCosts(!showCosts)}
            className="flex items-center gap-2 px-4 py-2 bg-nadin-pink text-white rounded-lg hover:bg-nadin-pink-dark transition-colors"
          >
            {showCosts ? <EyeOff size={20} /> : <Eye size={20} />}
            <span className="hidden md:inline">{showCosts ? 'Ocultar costos' : 'Ver costos'}</span>
            {showCosts ? <EyeOff size={20} className="md:hidden" /> : <Eye size={20} className="md:hidden" />}
          </button>
        </div>

        {/* Botones de filtro grandes y visibles */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              showFilters 
                ? 'bg-nadin-pink text-white' 
                : 'bg-white border-2 border-nadin-pink text-nadin-pink hover:bg-pink-50'
            }`}
          >
            <Filter size={20} />
            <span>Filtros</span>
            {(selectedSex || selectedBrand || selectedCategory) && (
              <span className="bg-white text-nadin-pink rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {[selectedSex, selectedBrand, selectedCategory].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Chips de filtros activos */}
          {selectedSex && (
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-lg whitespace-nowrap">
              <span className="text-sm font-medium">{selectedSex}</span>
              <button onClick={() => setSelectedSex('')} className="hover:bg-blue-200 rounded-full p-1">
                <X size={16} />
              </button>
            </div>
          )}
          
          {selectedBrand && (
            <div className="flex items-center gap-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-lg whitespace-nowrap">
              <span className="text-sm font-medium">{selectedBrand}</span>
              <button onClick={() => setSelectedBrand('')} className="hover:bg-purple-200 rounded-full p-1">
                <X size={16} />
              </button>
            </div>
          )}

          {selectedCategory && (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg whitespace-nowrap">
              <span className="text-sm font-medium">{selectedCategory}</span>
              <button onClick={() => setSelectedCategory('')} className="hover:bg-green-200 rounded-full p-1">
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4 border-2 border-nadin-pink">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Filtrar productos</h3>
            <button onClick={() => setShowFilters(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por Sexo */}
            <div>
              <label className="block text-sm font-medium mb-2">Sexo</label>
              <select
                value={selectedSex}
                onChange={(e) => setSelectedSex(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Todos</option>
                {sexOptions.map(sex => (
                  <option key={sex} value={sex}>{sex}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Marca */}
            <div>
              <label className="block text-sm font-medium mb-2">Marca</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Todas</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Categoría */}
            <div>
              <label className="block text-sm font-medium mb-2">Categoría</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Todas</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Botón limpiar filtros */}
          {(selectedSex || selectedBrand || selectedCategory) && (
            <button
              onClick={() => {
                setSelectedSex('');
                setSelectedBrand('');
                setSelectedCategory('');
              }}
              className="mt-4 text-sm text-nadin-pink hover:underline"
            >
              Limpiar todos los filtros
            </button>
          )}
        </div>
      )}

      {/* Grid de productos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((p: Product) => {
          const precioMayorista = parseFloat(p.variants[0]?.price || '0');
          const precioVenta = calcularPrecioVenta(precioMayorista, user?.margen || 60);
          const imagen = p.images && p.images.length > 0 ? p.images[0].src : '/placeholder.png';

          return (
            <div 
              key={p.id} 
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedProduct(p)}
            >
              <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                <img 
                  src={imagen}
                  alt={p.name.es}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Sin+Imagen';
                  }}
                />
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-500 mb-1">{p.brand || 'Sin marca'}</p>
                <h3 className="font-semibold text-sm mb-2 line-clamp-2 h-10">{p.name.es}</h3>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-nadin-pink">
                    {formatCurrency(precioVenta)}
                  </p>
                  
                  {showCosts && (
                    <>
                      <p className="text-xs text-gray-500">
                        Costo: {formatCurrency(precioMayorista)}
                      </p>
                      <p className="text-xs text-green-600 font-semibold">
                        Ganás: {formatCurrency(precioVenta - precioMayorista)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Filter size={64} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">No se encontraron productos con estos filtros</p>
          <button
            onClick={() => {
              setSelectedSex('');
              setSelectedBrand('');
              setSelectedCategory('');
            }}
            className="text-nadin-pink hover:underline font-semibold"
          >
            Limpiar todos los filtros
          </button>
        </div>
      )}

      {/* Modal de producto */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct}
          user={user}
          showCosts={showCosts}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

function ProductModal({ product, user, showCosts, onClose }: any) {
  const precioMayorista = parseFloat(product.variants[0]?.price || '0');
  const precioVenta = calcularPrecioVenta(precioMayorista, user?.margen || 60);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold">{product.name.es}</h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          {product.images && product.images.length > 0 && (
            <img 
              src={product.images[0].src}
              alt={product.name.es}
              className="w-full max-h-96 object-contain mb-4 bg-gray-100 rounded"
            />
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">{product.brand || 'Sin marca'}</p>
            <div className="bg-pink-50 p-4 rounded-lg mb-4">
              <p className="text-2xl font-bold text-nadin-pink mb-1">
                {formatCurrency(precioVenta)}
              </p>
              <p className="text-sm text-gray-600">Precio de venta</p>
              
              {showCosts && (
                <div className="mt-3 pt-3 border-t border-pink-200">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Costo mayorista:</span>
                    <span className="font-semibold">{formatCurrency(precioMayorista)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tu ganancia:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(precioVenta - precioMayorista)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Variantes disponibles:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {product.variants.map((variant: any) => (
                <div 
                  key={variant.id}
                  className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">
                      {variant.values?.map((v: any) => v.es).join(' - ') || 'Única talla'}
                    </p>
                    {showCosts && <p className="text-sm text-gray-600">SKU: {variant.sku || 'N/A'}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      <span className={variant.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                        {variant.stock > 0 ? `${variant.stock} disponibles` : 'Sin stock'}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            className="w-full mt-4 bg-nadin-pink text-white py-3 rounded-lg font-semibold hover:bg-nadin-pink-dark"
            onClick={() => {
              alert('Función de agregar al pedido próximamente');
              onClose();
            }}
          >
            Agregar al pedido
          </button>
        </div>
      </div>
    </div>
  );
}