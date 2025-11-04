'use client';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Search, X } from 'lucide-react';
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

export default function CatalogoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [userMargen, setUserMargen] = useState(60);
  const [showCosts, setShowCosts] = useState(false); // Estado para mostrar/ocultar costos

  // Estados de filtros
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedSex, setSelectedSex] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Opciones únicas de filtros
  const [brands, setBrands] = useState<string[]>([]);
  const [sexes, setSexes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    // Obtener margen del usuario
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserMargen(user.margen || 60);
    }

    loadProducts();
  }, []);

  useEffect(() => {
    // Extraer opciones únicas cuando cambian los productos
    if (products.length > 0) {
      const uniqueBrands = [...new Set(products.map(p => p.brand).filter((b): b is string => !!b))].sort();
      const uniqueSexes = [...new Set(products.map(p => p.sex).filter((s): s is string => !!s))].sort();
      const uniqueCategories = [...new Set(products.map(p => p.category).filter((c): c is string => !!c))].sort();
      
      setBrands(uniqueBrands);
      setSexes(uniqueSexes);
      setCategories(uniqueCategories);
    }
  }, [products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/catalogo');
      
      if (!res.ok) {
        throw new Error('Error al cargar productos');
      }

      const data = await res.json();
      
      // Verificar que sea un array
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        console.error('Formato de datos incorrecto:', data);
        setError('Error: formato de datos incorrecto');
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError('Error al cargar el catálogo. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos
  const filteredProducts = products.filter(p => {
    // Búsqueda por texto
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.variants.some(v => v.sku?.toLowerCase().includes(search.toLowerCase()));

    // Filtro por marca
    const matchesBrand = !selectedBrand || p.brand === selectedBrand;

    // Filtro por sexo
    const matchesSex = !selectedSex || p.sex === selectedSex;

    // Filtro por categoría
    const matchesCategory = !selectedCategory || p.category === selectedCategory;

    return matchesSearch && matchesBrand && matchesSex && matchesCategory;
  });

  // Limpiar todos los filtros
  const clearFilters = () => {
    setSelectedBrand('');
    setSelectedSex('');
    setSelectedCategory('');
    setSearch('');
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = selectedBrand || selectedSex || selectedCategory || search;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
            <p className="mt-4 text-gray-600">Cargando catálogo...</p>
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
            onClick={loadProducts}
            className="mt-4 bg-nadin-pink text-white px-6 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header con título y botón ojo */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Productos</h2>
        
        {/* Botón Ver/Ocultar Costos */}
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

      {/* Buscador */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, marca o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
          />
        </div>
      </div>

      {/* Filtros en cascada */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Filtros</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por Marca */}
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

          {/* Filtro por Sexo */}
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

          {/* Filtro por Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Botón Limpiar Filtros */}
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

      {/* Contador de resultados */}
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Mostrando {filteredProducts.length} de {products.length} productos
        </div>
        <button
          onClick={loadProducts}
          className="text-sm text-nadin-pink hover:text-nadin-pink-dark"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
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
                  
                  <div className="border-t pt-2 space-y-1">
                    {/* Siempre mostrar el precio con margen */}
                    <p className="text-lg font-bold text-nadin-pink">
                      {formatCurrency(calcularPrecioVenta(product.variants[0].price, userMargen))}
                    </p>
                    
                    {/* Mostrar costos solo si showCosts es true */}
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

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
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
    </div>
  );
}
