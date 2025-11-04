'use client';
import { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
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
}

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  userMargen: number;
  onAddToCart?: (item: CartItem) => void;
}

export interface CartItem {
  productId: number;
  variantId: number;
  sku: string;
  brand: string;
  name: string;
  talle: string;
  color: string;
  qty: number;
  mayorista: number;
  venta: number;
  image: string;
}

export default function ProductModal({ product, isOpen, onClose, userMargen, onAddToCart }: ProductModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [talles, setTalles] = useState<string[]>([]);
  const [colores, setColores] = useState<string[]>([]);
  const [selectedTalle, setSelectedTalle] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    if (product && product.variants) {
      // Extraer talles y colores únicos
      const uniqueTalles = [...new Set(product.variants.map(v => v.talle).filter(Boolean))];
      const uniqueColores = [...new Set(product.variants.map(v => v.color).filter(Boolean))];
      
      setTalles(uniqueTalles);
      setColores(uniqueColores);
      
      // Reset selecciones
      setSelectedTalle('');
      setSelectedColor('');
      setSelectedVariant(null);
      setQuantity(1);
    }
  }, [product]);

  useEffect(() => {
    // Cuando se seleccionan talle y color, buscar la variante correspondiente
    if (product && selectedTalle && selectedColor) {
      const variant = product.variants.find(
        v => v.talle === selectedTalle && v.color === selectedColor
      );
      setSelectedVariant(variant || null);
    }
  }, [selectedTalle, selectedColor, product]);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    if (!selectedVariant) {
      alert('Por favor seleccioná talle y color');
      return;
    }

    if (quantity > selectedVariant.stock) {
      alert(`Stock insuficiente. Solo hay ${selectedVariant.stock} unidades disponibles`);
      return;
    }

    const cartItem: CartItem = {
      productId: product.id,
      variantId: selectedVariant.id,
      sku: selectedVariant.sku,
      brand: product.brand,
      name: product.name,
      talle: selectedVariant.talle,
      color: selectedVariant.color,
      qty: quantity,
      mayorista: selectedVariant.price,
      venta: calcularPrecioVenta(selectedVariant.price, userMargen),
      image: product.image
    };

    if (onAddToCart) {
      onAddToCart(cartItem);
    }

    // Cerrar modal
    onClose();
  };

  const precioVenta = selectedVariant 
    ? calcularPrecioVenta(selectedVariant.price, userMargen)
    : 0;

  const totalVenta = precioVenta * quantity;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">{product.name}</h2>
            <p className="text-sm text-nadin-pink font-medium">{product.brand}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Image */}
          <div className="mb-6">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden max-w-md mx-auto">
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
          </div>

          {/* Selección de Talle */}
          {talles.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Talle *
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {talles.map((talle) => (
                  <button
                    key={talle}
                    onClick={() => setSelectedTalle(talle)}
                    className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                      selectedTalle === talle
                        ? 'border-nadin-pink bg-nadin-pink text-white'
                        : 'border-gray-300 hover:border-nadin-pink'
                    }`}
                  >
                    {talle}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selección de Color */}
          {colores.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Color *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {colores.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                      selectedColor === color
                        ? 'border-nadin-pink bg-nadin-pink text-white'
                        : 'border-gray-300 hover:border-nadin-pink'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info de Stock */}
          {selectedVariant && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Stock disponible</p>
                  <p className="text-lg font-bold text-gray-800">{selectedVariant.stock} unidades</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">SKU</p>
                  <p className="text-sm font-mono font-semibold">{selectedVariant.sku}</p>
                </div>
              </div>
            </div>
          )}

          {/* Cantidad */}
          {selectedVariant && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cantidad
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="p-2 rounded-lg border-2 border-gray-300 hover:border-nadin-pink disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus size={20} />
                </button>
                <input
                  type="number"
                  min="1"
                  max={selectedVariant.stock}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuantity(Math.max(1, Math.min(selectedVariant.stock, val)));
                  }}
                  className="w-20 text-center text-xl font-bold border-2 border-gray-300 rounded-lg py-2"
                />
                <button
                  onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                  disabled={quantity >= selectedVariant.stock}
                  className="p-2 rounded-lg border-2 border-gray-300 hover:border-nadin-pink disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Resumen de Precios */}
          {selectedVariant && (
            <div className="mb-6 p-4 bg-gradient-to-br from-nadin-pink to-pink-400 rounded-lg text-white">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm opacity-90">Precio unitario</p>
                  <p className="text-2xl font-bold">{formatCurrency(precioVenta)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90">Total</p>
                  <p className="text-3xl font-bold">{formatCurrency(totalVenta)}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white border-opacity-30">
                <div className="flex justify-between text-sm">
                  <span>Costo mayorista:</span>
                  <span className="font-semibold">{formatCurrency(selectedVariant.price * quantity)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Tu ganancia:</span>
                  <span className="font-semibold">{formatCurrency((precioVenta - selectedVariant.price) * quantity)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant}
            className="flex-1 px-6 py-3 bg-nadin-pink text-white rounded-lg font-semibold hover:bg-nadin-pink-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart size={20} />
            Agregar al Pedido
          </button>
        </div>
      </div>
    </div>
  );
}
