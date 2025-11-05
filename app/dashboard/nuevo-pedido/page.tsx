'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartContext';
import { formatCurrency } from '@/lib/precios';
import { ShoppingCart, User, Phone, FileText, Trash2, ArrowLeft } from 'lucide-react';

export default function NuevoPedidoPage() {
  const router = useRouter();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    updateDiscount,
    getTotalMayorista,
    getTotalVenta,
    getTotalDescuentos,
    getTotalFinal,
    getGananciaEstimada,
    clearCart,
  } = useCart();

  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [nota, setNota] = useState('');
  const [saving, setSaving] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark mb-4"
        >
          <ArrowLeft size={20} />
          Volver
        </button>

        <div className="text-center py-12 bg-white rounded-lg shadow">
          <ShoppingCart size={64} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold mb-2">No hay productos en el pedido</h2>
          <p className="text-gray-600 mb-6">
            Agregá productos desde el catálogo para crear un pedido
          </p>
          <button
            onClick={() => router.push('/dashboard/catalogo')}
            className="px-6 py-3 bg-nadin-pink text-white rounded-lg font-semibold hover:bg-nadin-pink-dark"
          >
            Ir al Catálogo
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteNombre.trim()) {
      alert('Por favor ingresá el nombre de la clienta');
      return;
    }

    if (!clienteTelefono.trim()) {
      alert('Por favor ingresá el teléfono de la clienta');
      return;
    }

    try {
      setSaving(true);

      const userStr = localStorage.getItem('user');
      if (!userStr) {
        alert('Error: Usuario no encontrado');
        return;
      }
      const user = JSON.parse(userStr);

      const pedidoData = {
        userId: user.id,
        cliente: clienteNombre.trim(),
        telefono: clienteTelefono.trim(),
        nota: nota.trim() || null,
        lineas: cart.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku,
          brand: item.brand,
          name: item.name,
          talle: item.talle,
          color: item.color,
          qty: item.qty,
          mayorista: item.mayorista,
          venta: item.venta - (item.descuento || 0),
        })),
      };

      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedidoData),
      });

      if (!res.ok) throw new Error('Error al crear pedido');

      clearCart();
      alert('✅ Pedido creado exitosamente');
      router.push('/dashboard/pedidos');
    } catch (error) {
      console.error('Error creando pedido:', error);
      alert('❌ Error al crear el pedido. Intentá nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark mb-4"
      >
        <ArrowLeft size={20} />
        Volver
      </button>

      <h2 className="text-2xl font-bold mb-6">Finalizar Pedido</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos de la clienta */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <User size={20} className="text-nadin-pink" />
            Datos de la Clienta
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo *
              </label>
              <input
                type="text"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej: María González"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
                placeholder="Ej: 341 123 4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nota (opcional)
              </label>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej: Enviar en caja de regalo..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Productos del pedido */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <ShoppingCart size={20} className="text-nadin-pink" />
            Productos ({cart.length})
          </h3>

          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.variantId} className="border rounded-lg p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold mb-1 line-clamp-2">{item.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.brand} • Talle {item.talle} • {item.color}
                    </p>
                    
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-600">Cant:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateQuantity(item.variantId, parseInt(e.target.value) || 1)}
                          className="w-14 px-2 py-1 border rounded text-center text-sm"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-600">Desc:</label>
                        <input
                          type="number"
                          min="0"
                          value={item.descuento || 0}
                          onChange={(e) => updateDiscount(item.variantId, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-16 px-2 py-1 border rounded text-sm"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.variantId)}
                        className="ml-auto text-red-500 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-2 pt-2 border-t flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-bold text-nadin-pink">
                        {formatCurrency((item.venta - (item.descuento || 0)) * item.qty)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen del pedido */}
        <div className="bg-gradient-to-br from-nadin-pink to-pink-400 rounded-lg shadow p-6 text-white">
          <h3 className="font-semibold text-lg mb-4">Resumen del Pedido</h3>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal venta:</span>
              <span className="font-semibold">{formatCurrency(getTotalVenta())}</span>
            </div>

            {getTotalDescuentos() > 0 && (
              <div className="flex justify-between">
                <span>Descuentos:</span>
                <span className="font-semibold">-{formatCurrency(getTotalDescuentos())}</span>
              </div>
            )}

            <div className="flex justify-between text-xl font-bold pt-2 border-t border-white border-opacity-30">
              <span>Total venta:</span>
              <span>{formatCurrency(getTotalFinal())}</span>
            </div>

            <div className="flex justify-between text-sm opacity-90 pt-2 border-t border-white border-opacity-30">
              <span>Costo mayorista:</span>
              <span>{formatCurrency(getTotalMayorista())}</span>
            </div>

            <div className="flex justify-between text-lg font-bold">
              <span>Tu ganancia:</span>
              <span>{formatCurrency(getGananciaEstimada())}</span>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4 sticky bottom-4 bg-gray-50 p-4 rounded-lg shadow-lg">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors bg-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-nadin-pink text-white rounded-lg font-semibold hover:bg-nadin-pink-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {saving ? 'Guardando...' : '✅ Finalizar Pedido'}
          </button>
        </div>
      </form>
    </div>
  );
}
