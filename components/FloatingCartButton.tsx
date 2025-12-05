'use client';

import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/components/CartContext';
import { useRouter } from 'next/navigation';

export default function FloatingCartButton() {
  const { getTotalItems } = useCart();
  const router = useRouter();
  const totalItems = getTotalItems();

  if (totalItems === 0) return null;

  return (
    <button
      // ✅ CORREGIDO: Redirige a nuevo-pedido en lugar de consolidar
      onClick={() => router.push('/dashboard/nuevo-pedido')}
      className="fixed bottom-20 right-4 z-50 bg-nadin-pink text-white p-4 rounded-full shadow-lg hover:bg-nadin-pink-dark transition-all hover:scale-110 active:scale-95"
      aria-label="Ver carrito"
    >
      <div className="relative">
        <ShoppingCart size={24} />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-white text-nadin-pink text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-nadin-pink">
            {totalItems}
          </span>
        )}
      </div>
    </button>
  );
}
