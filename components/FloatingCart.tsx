'use client';
import { useState } from 'react';
import { ShoppingCart, X, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from './CartContext';
import { formatCurrency } from '@/lib/precios';
import { useRouter } from 'next/navigation';

export default function FloatingCart() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    getTotalItems,
    getTotalVenta,
    getTotalDescuentos,
    getTotalFinal,
    clearCart,
  } = useCart();

  const totalItems = getTotalItems();

  if (totalItems === 0 && !isOpen) {
    // No mostrar el botón si no hay items y el carrito está cerrado
    return null;
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-nadin-pink text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center gap-2 px-5 py-4"
      >
        <ShoppingCart size={24} />
        {totalItems > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {totalItems}
          </div>
        )}
        <span className="hidden sm:inline font-semibold">Mi Pedido</span>
      </button>

      {/* Panel del carrito */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[500px] bg-white shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-nadin-pink text-white p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Mi Pedido</h2>
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
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Tu pedido está vacío</p>
                  <p className="text-sm mt-2">Agregá productos para comenzar</p>
                </div>
              ) : (
                <div className="space-y-4">
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
                              Sin img
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                            {item.name}
                          </h3>
                          <p className="text-xs text-gray-600 mb-1">
                            {item.brand} • Talle {item.talle} • {item.color}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            SKU: {item.sku}
                          </p>

                          {/* Controles de cantidad */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.variantId, item.qty - 1)}
                              className="p-1 rounded border border-gray-300 hover:bg-gray-100"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-sm font-semibold w-8 text-center">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.variantId, item.qty + 1)}
                              className="p-1 rounded border border-gray-300 hover:bg-gray-100"
                            >
                              <Plus size={14} />
                            </button>

                            <button
                              onClick={() => removeFromCart(item.variantId)}
                              className="ml-auto p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Precios */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Unitario:</span>
                          <span className="font-semibold">{formatCurrency(item.venta)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold mt-1">
                          <span>Subtotal:</span>
                          <span className="text-nadin-pink">
                            {formatCurrency(item.venta * item.qty)}
                          </span>
                        </div>
                        {item.descuento && item.descuento > 0 && (
                          <div className="flex justify-between text-sm text-green-600 mt-1">
                            <span>Descuento:</span>
                            <span>-{formatCurrency(item.descuento * item.qty)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer con totales y acciones */}
            {cart.length > 0 && (
              <div className="border-t bg-white p-4 space-y-3">
                {/* Totales */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(getTotalVenta())}</span>
                  </div>
                  {getTotalDescuentos() > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuentos:</span>
                      <span>-{formatCurrency(getTotalDescuentos())}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-nadin-pink">{formatCurrency(getTotalFinal())}</span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (confirm('¿Estás segura de que querés vaciar el pedido?')) {
                        clearCart();
                      }
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Vaciar
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/dashboard/nuevo-pedido');
                    }}
                    className="flex-1 px-4 py-3 bg-nadin-pink text-white rounded-lg font-semibold hover:bg-nadin-pink-dark transition-colors"
                  >
                    Finalizar Pedido
                  </button>
                </div>

                {/* Info adicional */}
                <p className="text-xs text-center text-gray-500">
                  Podés seguir agregando productos o finalizar el pedido
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
