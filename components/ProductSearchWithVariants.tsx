'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Plus } from 'lucide-react';

interface Variante {
  id: string;
  sku: string;
  talle: string | null;
  color: string | null;
  stock: number;
  precio: number;
}

interface Producto {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  precio: number;
  variantes: Variante[];
}

interface VarianteSeleccionada {
  productoId: string;
  productoNombre: string;
  productoSku: string;
  productoBrand: string;
  varianteId: string;
  varianteSku: string;
  talle: string;
  color: string;
  stock: number;
  cantidad: number;
  precioMayorista: number;
  precioVenta: number;
}

interface Props {
  onAgregar: (variante: VarianteSeleccionada) => void;
  onCancelar: () => void;
  margen?: number; // Margen de ganancia del usuario (ej: 60 = 60%)
}

export default function ProductSearchWithVariants({ onAgregar, onCancelar, margen = 50 }: Props) {
  const [query, setQuery] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Modal state
  const [talleSeleccionado, setTalleSeleccionado] = useState('');
  const [colorSeleccionado, setColorSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [precioVenta, setPrecioVenta] = useState('');
  const [varianteActual, setVarianteActual] = useState<Variante | null>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Buscar productos cuando el usuario escribe
  useEffect(() => {
    if (query.length < 2) {
      setProductos([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/productos/buscar?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json() as any;
          setProductos(data);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('Error buscando productos:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !(searchRef.current as any).contains(event.target as any)) {
        setShowDropdown(false);
      }
    }

    (globalThis as any).document?.addEventListener('mousedown', handleClickOutside);
    return () => (globalThis as any).document?.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cuando se selecciona un producto
  const handleSelectProducto = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setShowDropdown(false);
    setShowModal(true);
    
    // Reset modal state
    setTalleSeleccionado('');
    setColorSeleccionado('');
    setCantidad(1);
    setPrecioVenta('');
    setVarianteActual(null);
  };

  // Obtener talles únicos disponibles
  const tallesDisponibles = productoSeleccionado
    ? Array.from(new Set(
        productoSeleccionado.variantes
          .filter(v => v.stock > 0 && v.talle)
          .map(v => v.talle)
      )).sort()
    : [];

  // Obtener colores únicos disponibles para el talle seleccionado
  const coloresDisponibles = productoSeleccionado && talleSeleccionado
    ? Array.from(new Set(
        productoSeleccionado.variantes
          .filter(v => v.stock > 0 && v.talle === talleSeleccionado && v.color)
          .map(v => v.color)
      )).sort()
    : [];

  // Actualizar variante actual cuando cambian talle o color
  useEffect(() => {
    if (productoSeleccionado && talleSeleccionado && colorSeleccionado) {
      const variante = productoSeleccionado.variantes.find(
        v => v.talle === talleSeleccionado && v.color === colorSeleccionado && v.stock > 0
      );
      setVarianteActual(variante || null);
      
      if (variante && !precioVenta) {
        // Calcular precio sugerido usando el margen del usuario
        // margen: 60 = 60% de ganancia sobre el mayorista
        const precioSugerido = Math.round(variante.precio * (1 + margen / 100) / 50) * 50;
        setPrecioVenta(precioSugerido.toString());
      }
    } else {
      setVarianteActual(null);
    }
  }, [productoSeleccionado, talleSeleccionado, colorSeleccionado]);

  // Agregar producto
  const handleAgregar = () => {
    if (!productoSeleccionado || !varianteActual || !precioVenta) return;

    const ventaNum = parseFloat(precioVenta);
    if (isNaN(ventaNum) || ventaNum <= 0) {
      ((globalThis as any).alert)?.('Ingresá un precio de venta válido');
      return;
    }

    if (cantidad > varianteActual.stock) {
      ((globalThis as any).alert)?.(`Stock insuficiente. Disponible: ${varianteActual.stock}`);
      return;
    }

    onAgregar({
      productoId: productoSeleccionado.id,
      productoNombre: productoSeleccionado.name,
      productoSku: productoSeleccionado.sku,
      productoBrand: productoSeleccionado.brand || '',
      varianteId: varianteActual.id,
      varianteSku: varianteActual.sku,
      talle: talleSeleccionado,
      color: colorSeleccionado,
      stock: varianteActual.stock,
      cantidad,
      precioMayorista: varianteActual.precio,
      precioVenta: ventaNum
    });

    // Reset
    setShowModal(false);
    setProductoSeleccionado(null);
    setQuery('');
  };

  const handleCerrarModal = () => {
    setShowModal(false);
    setProductoSeleccionado(null);
    setQuery('');
  };

  return (
    <>
      {/* BÚSQUEDA */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Agregar Productos
          </h3>
          <button
            onClick={onCancelar}
            className="ml-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Agregá productos que la revendedora pidió después
        </p>

        <div ref={searchRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery((e.target as any).value)}
              placeholder="Buscar por SKU, nombre o marca..."
              className="w-full pl-10 pr-10 py-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none"
              autoFocus
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setProductos([]);
                  setShowDropdown(false);
                  (inputRef.current as any)?.focus();
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* DROPDOWN DE RESULTADOS */}
          {showDropdown && (
            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-purple-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
              {loading && (
                <div className="p-4 text-center text-gray-500">
                  Buscando...
                </div>
              )}
              
              {!loading && productos.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No se encontraron productos
                </div>
              )}

              {!loading && productos.length > 0 && (
                <div className="divide-y">
                  {productos.map((producto) => {
                    const stockTotal = producto.variantes.reduce((sum, v) => sum + v.stock, 0);
                    const variantesConStock = producto.variantes.filter(v => v.stock > 0).length;
                    
                    return (
                      <button
                        key={producto.id}
                        onClick={() => handleSelectProducto(producto)}
                        className="w-full p-4 text-left hover:bg-purple-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">
                              {producto.name}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                                {producto.sku}
                              </span>
                              {producto.brand && (
                                <span className="text-purple-600">
                                  {producto.brand}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              {variantesConStock} variante{variantesConStock !== 1 ? 's' : ''} disponible{variantesConStock !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-lg font-bold text-nadin-pink">
                              ${producto.precio.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              Stock: {stockTotal}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE SELECCIÓN DE VARIANTE */}
      {showModal && productoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-lg font-bold text-gray-900 truncate">
                  {productoSeleccionado.name}
                </h3>
                <p className="text-sm text-gray-600 font-mono mt-1">
                  {productoSeleccionado.sku}
                </p>
              </div>
              <button
                onClick={handleCerrarModal}
                className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Selección de Talle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Talle *
                </label>
                <select
                  value={talleSeleccionado}
                  onChange={(e) => {
                    setTalleSeleccionado((e.target as any).value);
                    setColorSeleccionado(''); // Reset color
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Seleccionar talle</option>
                  {tallesDisponibles.map((talle) => (
                    <option key={talle} value={talle}>
                      {talle}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selección de Color */}
              {talleSeleccionado && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color *
                  </label>
                  <select
                    value={colorSeleccionado}
                    onChange={(e) => setColorSeleccionado((e.target as any).value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Seleccionar color</option>
                    {coloresDisponibles.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Info de stock */}
              {varianteActual && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Stock disponible:
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {varianteActual.stock} unidades
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium text-gray-700">
                      Precio mayorista:
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      ${varianteActual.precio.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Cantidad */}
              {varianteActual && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={varianteActual.stock}
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, parseInt((e.target as any).value) || 1))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Precio de venta */}
              {varianteActual && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio de venta a cliente *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={precioVenta}
                      onChange={(e) => setPrecioVenta((e.target as any).value)}
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  {precioVenta && varianteActual && (
                    <p className="mt-2 text-sm text-gray-600">
                      Ganancia: ${(parseFloat(precioVenta) - varianteActual.precio).toLocaleString()} 
                      ({Math.round((parseFloat(precioVenta) - varianteActual.precio) / varianteActual.precio * 100)}%)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex gap-3">
              <button
                onClick={handleCerrarModal}
                className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAgregar}
                disabled={!varianteActual || !precioVenta || cantidad <= 0}
                className="flex-1 px-4 py-3 bg-nadin-pink hover:bg-pink-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
