// COMPONENTE: Carrito Flotante - SIN SOLAPAR CON WHATSAPP
// Ubicación: components/FloatingCart.tsx
// CORRECCIÓN: Movido arriba para no chocar con botón de WhatsApp

'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/components/CartContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function FloatingCart() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, getTotalItems, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const totalItems = getTotalItems();

  useEffect(() => {
    const userData = (globalThis as any).localStorage?.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // ✅ AGREGADO: Cerrar drawer cuando cambia la URL
    const handleRouteChange = () => {
      setIsOpen(false);
    };
    
    // Escuchar cambios de ruta
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const handleConfirmar = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    // ✅ CORREGIDO: Cerrar drawer ANTES de navegar
    setIsOpen(false);
    
    // Pequeño delay para animación suave
    setTimeout(() => {
      router.push('/dashboard/nuevo-pedido');
    }, 100);
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <>
      {/* ✅ CORREGIDO: Botón movido arriba (bottom-24 en vez de bottom-6) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 bg-nadin-pink text-white rounded-full p-4 shadow-lg hover:bg-nadin-pink-dark transition-all z-40 flex items-center gap-2"
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
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel - ✅ Reducido z-index de 50 a 40 */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-40 flex flex-col">
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
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingCart size={32} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm line-clamp-2">{item.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {[item.talle, item.color].filter(Boolean).join(' - ')}
                      </p>
                      <p className="text-sm text-nadin-pink font-semibold mt-1">
                        ${item.mayorista?.toFixed(2) || '0.00'}
                      </p>
                    </div>

                    {/* Eliminar */}
                    <button
                      onClick={() => removeFromCart(item.variantId)}
                      className="text-red-500 hover:bg-red-50 rounded-lg p-2 h-fit"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Cantidad */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Cantidad</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.qty - 1)}
                        disabled={item.qty <= 1}
                        className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg p-1"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-semibold w-8 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.qty + 1)}
                        className="bg-nadin-pink hover:bg-nadin-pink-dark text-white rounded-lg p-1"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 space-y-3">
              <button
                onClick={() => {
                  if (confirm('¿Vaciar todo el carrito?')) {
                    clearCart();
                    setIsOpen(false);
                  }
                }}
                className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
              >
                Vaciar Carrito
              </button>

              <button
                onClick={handleConfirmar}
                className="w-full bg-nadin-pink text-white py-3 rounded-lg font-semibold hover:bg-nadin-pink-dark transition-colors"
              >
                Continuar con el Pedido
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
