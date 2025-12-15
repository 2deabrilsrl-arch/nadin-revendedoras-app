// COMPONENTE: Búsqueda Mejorada de Productos con Autocompletado
// Ubicación: components/ProductSearchAutocomplete.tsx
// VERSIÓN: Con autocompletado por SKU y selector de talle/color

'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Check } from 'lucide-react';

interface Variante {
  id: string;
  talle: string;
  color: string;
  stock: number;
  mayorista: number;
  venta: number;
}

interface Producto {
  id: string;
  sku: string;
  name: string;
  brand: string;
  mayorista: number;
  venta: number;
  variantes?: Variante[];
}

interface ProductSearchAutocompleteProps {
  onProductSelected: (producto: Producto, variante?: Variante) => void;
  placeholder?: string;
}

export default function ProductSearchAutocomplete({ 
  onProductSelected, 
  placeholder = "Buscar por SKU o nombre..."
}: ProductSearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Modal de selección de variante
  const [showVarianteModal, setShowVarianteModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [varianteSeleccionada, setVarianteSeleccionada] = useState<string | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cerrar resultados al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !(searchRef.current as any).contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar productos con debounce
  useEffect(() => {
    if (query.length < 2) {
      setProductos([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      buscarProductos(query);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [query]);

  const buscarProductos = async (searchQuery: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/productos/buscar?q=${encodeURIComponent(searchQuery)}&limit=20`);
      const data = await res.json() as any;
      
      if (data.success && data.productos) {
        setProductos(data.productos);
        setShowResults(true);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Error buscando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || productos.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < productos.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < productos.length) {
          handleProductoClick(productos[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleProductoClick = (producto: Producto) => {
    // Si el producto tiene variantes (talle/color), mostrar modal de selección
    if (producto.variantes && producto.variantes.length > 0) {
      setProductoSeleccionado(producto);
      setVarianteSeleccionada(null);
      setShowVarianteModal(true);
      setShowResults(false);
    } else {
      // Sin variantes, agregar directamente
      onProductSelected(producto);
      limpiarBusqueda();
    }
  };

  const handleVarianteSeleccionada = () => {
    if (!productoSeleccionado || !varianteSeleccionada) return;

    const variante = productoSeleccionado.variantes?.find(v => v.id === varianteSeleccionada);
    
    if (variante) {
      onProductSelected(productoSeleccionado, variante);
      cerrarModalVariante();
      limpiarBusqueda();
    }
  };

  const limpiarBusqueda = () => {
    setQuery('');
    setProductos([]);
    setShowResults(false);
    setSelectedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const cerrarModalVariante = () => {
    setShowVarianteModal(false);
    setProductoSeleccionado(null);
    setVarianteSeleccionada(null);
  };

  // Agrupar variantes por talle
  const agruparVariantesPorTalle = (variantes: Variante[]) => {
    const grupos: Record<string, Variante[]> = {};
    
    variantes.forEach(v => {
      if (!grupos[v.talle]) {
        grupos[v.talle] = [];
      }
      grupos[v.talle].push(v);
    });

    return grupos;
  };

  return (
    <>
      <div ref={searchRef} className="relative w-full">
        {/* Input de búsqueda */}
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            size={20} 
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery((e.target as any).value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && setShowResults(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
            autoComplete="off"
          />
          {query && (
            <button
              onClick={limpiarBusqueda}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Resultados de búsqueda */}
        {showResults && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-2xl max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
                Buscando...
              </div>
            ) : productos.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No se encontraron productos
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {productos.map((producto, index) => (
                  <button
                    key={producto.id}
                    onClick={() => handleProductoClick(producto)}
                    className={`w-full p-4 text-left hover:bg-purple-50 transition-colors ${
                      selectedIndex === index ? 'bg-purple-100' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded font-semibold text-purple-700">
                            {producto.sku}
                          </span>
                          {producto.variantes && producto.variantes.length > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {producto.variantes.length} variantes
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900">{producto.name}</h4>
                        <p className="text-sm text-gray-600">{producto.brand}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-700">
                            Mayorista: <strong>${producto.mayorista}</strong>
                          </span>
                          <span className="text-sm text-gray-700">
                            Venta: <strong>${producto.venta}</strong>
                          </span>
                        </div>
                      </div>
                      <Plus className="text-purple-500 flex-shrink-0" size={24} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de selección de variante */}
      {showVarianteModal && productoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{productoSeleccionado.name}</h3>
                <p className="text-gray-600 mt-1">{productoSeleccionado.brand} • SKU: {productoSeleccionado.sku}</p>
              </div>
              <button
                onClick={cerrarModalVariante}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6">
              <h4 className="text-lg font-semibold mb-4">Seleccioná talle y color:</h4>

              {productoSeleccionado.variantes && productoSeleccionado.variantes.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(agruparVariantesPorTalle(productoSeleccionado.variantes)).map(([talle, variantes]) => (
                    <div key={talle} className="border-2 border-gray-200 rounded-lg p-4">
                      <h5 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg">
                          Talle {talle}
                        </span>
                        <span className="text-sm text-gray-600">({variantes.length} colores)</span>
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {variantes.map((variante) => (
                          <button
                            key={variante.id}
                            onClick={() => setVarianteSeleccionada(variante.id)}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${
                              varianteSeleccionada === variante.id
                                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 mb-1">{variante.color}</div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div>Mayorista: <strong>${variante.mayorista}</strong></div>
                                  <div>Venta: <strong>${variante.venta}</strong></div>
                                  <div className={variante.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                                    Stock: <strong>{variante.stock > 0 ? `${variante.stock} unidades` : 'Sin stock'}</strong>
                                  </div>
                                </div>
                              </div>
                              {varianteSeleccionada === variante.id && (
                                <Check className="text-purple-500 flex-shrink-0" size={24} />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No hay variantes disponibles
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
              <button
                onClick={cerrarModalVariante}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleVarianteSeleccionada}
                disabled={!varianteSeleccionada}
                className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Agregar Producto
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
