'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, X, Plus, Minus, Percent, DollarSign } from 'lucide-react';
import { useCart } from './CartContext';
import { formatCurrency } from '@/lib/precios';

export default function FloatingCart() {
  const router = useRouter();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    updateDescuentoPesos,
    updateDescuentoPorcentaje,
    getTotalItems,
    getTotalVenta,
    getTotalDescuentos,
    getTotalFinal,
    getGananciaEstimada
  } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<number | null>(null);
  const [discountType, setDiscountType] = useState<'pesos' | 'porcentaje'>('pesos');
  const [discountValue, setDiscountValue] = useState('');

  const totalItems = getTotalItems();

  const handleCheckout = () => {
    setIsOpen(false);
    // ✅ CORREGIDO: Ruta correcta a nuevo-pedido
    router.push('/dashboard/nuevo-pedido');
  };

  const handleOpenDiscountEdit = (variantId: number, currentItem: any) => {
    setEditingDiscount(variantId);

    if (currentItem.descuentoPorcentaje && currentItem.descuentoPorcentaje > 0) {
      setDiscountType('porcentaje');
      setDiscountValue(currentItem.descuentoPorcentaje.toString());
    } else if (currentItem.descuentoPesos && currentItem.descuentoPesos > 0) {
      setDiscountType('pesos');
      setDiscountValue(currentItem.descuentoPesos.toString());
    } else {
      setDiscountType('pesos');
      setDiscountValue('');
    }
  };

  const handleApplyDiscount = (variantId: number) => {
    const value = parseFloat(discountValue) || 0;

    if (discountType === 'porcentaje') {
      updateDescuentoPorcentaje(variantId, value);
    } else {
      updateDescuentoPesos(variantId, value);
    }

    setEditingDiscount(null);
    setDiscountValue('');
  };

  const calcularPrecioConDescuento = (item: any) => {
    const subtotal = item.venta * item.qty;

    if (item.descuentoPorcentaje && item.descuentoPorcentaje > 0) {
      return subtotal - (subtotal * item.descuentoPorcentaje / 100);
    }

    if (item.descuentoPesos && item.descuentoPesos > 0) {
      return subtotal - (item.descuentoPesos * item.qty);
    }

    return subtotal;
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-nadin-pink text-white rounded-full p-4 shadow-lg hover:bg-nadin-pink-dark transition-all z-40 flex items-center gap-2"
      >
        <ShoppingCart size={24} />
        <span className="bg-white text-nadin-pink rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm">
          {totalItems}
        </span>
      </button>

      {/* Panel lateral del carrito */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="bg-nadin-pink text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Mi Pedido</h3>
                <p className="text-sm opacity-90">{totalItems} producto{totalItems !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Lista de productos */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => (
                <div key={item.variantId} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex gap-3">
                    {/* Imagen */}
                    <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image && item.image !== '/placeholder.png' ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          Sin foto
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm line-clamp-2">{item.name}</h4>
                      <p className="text-xs text-gray-600">{item.brand}</p>
                      <p className="text-xs text-gray-600">
                        Talle {item.talle} • {item.color}
                      </p>

                      {/* Precio unitario */}
                      <p className="text-sm font-semibold text-nadin-pink mt-1">
                        {formatCurrency(item.venta)} c/u
                      </p>
                    </div>

                    {/* Botón eliminar */}
                    <button
                      onClick={() => removeFromCart(item.variantId)}
                      className="text-red-500 hover:text-red-700 self-start"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Controles de cantidad */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs font-medium text-gray-600">Cantidad:</span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.qty - 1)}
                      className="bg-gray-200 hover:bg-gray-300 rounded p-1"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-bold text-sm w-8 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.qty + 1)}
                      className="bg-gray-200 hover:bg-gray-300 rounded p-1"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Editor de descuento */}
                  {editingDiscount === item.variantId ? (
                    <div className="mt-3 p-2 bg-white rounded border border-gray-200">
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => setDiscountType('pesos')}
                          className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
                            discountType === 'pesos'
                              ? 'bg-nadin-pink text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          <DollarSign size={12} className="inline" /> En $
                        </button>
                        <button
                          onClick={() => setDiscountType('porcentaje')}
                          className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
                            discountType === 'porcentaje'
                              ? 'bg-nadin-pink text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          <Percent size={12} className="inline" /> En %
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          max={discountType === 'porcentaje' ? '100' : undefined}
                          step={discountType === 'porcentaje' ? '1' : '0.01'}
                          value={discountValue}
                          onChange={(e) => setDiscountValue((e.target as any).value)}
                          placeholder={discountType === 'porcentaje' ? '% desc.' : '$ desc.'}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => handleApplyDiscount(item.variantId)}
                          className="px-3 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setEditingDiscount(null)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-400"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => handleOpenDiscountEdit(item.variantId, item)}
                        className="text-xs text-nadin-pink hover:text-nadin-pink-dark font-medium"
                      >
                        {(item.descuentoPorcentaje || item.descuentoPesos)
                          ? '✏️ Editar descuento'
                          : '+ Agregar descuento'}
                      </button>

                      {/* Mostrar descuento aplicado */}
                      {item.descuentoPorcentaje && item.descuentoPorcentaje > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                          -{item.descuentoPorcentaje}%
                        </span>
                      )}
                      {item.descuentoPesos && item.descuentoPesos > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                          -{formatCurrency(item.descuentoPesos * item.qty)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Subtotal */}
                  <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-xs text-gray-600">Subtotal:</span>
                    <div className="text-right">
                      {(item.descuentoPorcentaje || item.descuentoPesos) ? (
                        <>
                          <span className="text-xs text-gray-400 line-through mr-2">
                            {formatCurrency(item.venta * item.qty)}
                          </span>
                          <span className="text-sm font-bold text-nadin-pink">
                            {formatCurrency(calcularPrecioConDescuento(item))}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-nadin-pink">
                          {formatCurrency(item.venta * item.qty)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer con totales */}
            <div className="border-t bg-white p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(getTotalVenta())}</span>
              </div>

              {getTotalDescuentos() > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuentos:</span>
                  <span className="font-semibold">-{formatCurrency(getTotalDescuentos())}</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-nadin-pink">{formatCurrency(getTotalFinal())}</span>
              </div>

              <div className="flex justify-between text-xs text-gray-600">
                <span>Tu ganancia estimada:</span>
                <span className="font-semibold text-green-600">{formatCurrency(getGananciaEstimada())}</span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-nadin-pink text-white py-3 rounded-lg font-bold hover:bg-nadin-pink-dark transition-colors mt-3"
              >
                Finalizar Pedido
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
