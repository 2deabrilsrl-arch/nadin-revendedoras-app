'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Plus, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/precios';
import { useCart } from '@/components/CartContext';

export default function NuevoPedidoPage() {
  const router = useRouter();
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    updateDiscount,
    clearCart,
    getTotalVenta,
    getTotalDescuentos,
    getTotalMayorista,
  } = useCart();
  
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [nota, setNota] = useState('');
  
  // Descuento general
  const [descuentoGeneral, setDescuentoGeneral] = useState(0);
  const [tipoDescuentoGeneral, setTipoDescuentoGeneral] = useState<'porcentaje' | 'fijo'>('porcentaje');
  
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserId(user.id);
    }
  }, []);

  // Calcular totales con descuento general
  const calcularTotales = () => {
    const subtotalVenta = getTotalVenta();
    const descuentosIndividuales = getTotalDescuentos();
    const subtotalConDescuentosIndiv = subtotalVenta - descuentosIndividuales;
    
    let descuentoGeneralAplicado = 0;
    if (descuentoGeneral > 0) {
      if (tipoDescuentoGeneral === 'porcentaje') {
        descuentoGeneralAplicado = subtotalConDescuentosIndiv * (descuentoGeneral / 100);
      } else {
        descuentoGeneralAplicado = descuentoGeneral;
      }
    }
    
    const totalFinal = subtotalConDescuentosIndiv - descuentoGeneralAplicado;
    const totalDescuentos = descuentosIndividuales + descuentoGeneralAplicado;
    const ganancia = totalFinal - getTotalMayorista();
    
    return {
      subtotalVenta,
      descuentosIndividuales,
      descuentoGeneralAplicado,
      totalDescuentos,
      totalFinal,
      ganancia
    };
  };

  const totales = calcularTotales();

  const handleFinalizarPedido = async () => {
    if (!cliente.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }
    
    if (!telefono.trim()) {
      alert('Por favor ingresa el teléfono del cliente');
      return;
    }
    
    if (cart.length === 0) {
      alert('El pedido debe tener al menos un producto');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/pedidos/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          cliente,
          telefono,
          nota,
          items: cart,
          descuentoTotal: totales.totalDescuentos,
          descuentoGeneral: totales.descuentoGeneralAplicado
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear pedido');
      }

      const data = await response.json();
      
      alert('✅ Pedido creado exitosamente');
      clearCart();
      setDescuentoGeneral(0);
      router.push('/dashboard/pedidos');
    } catch (error) {
      console.error('Error creando pedido:', error);
      alert('❌ Error al crear el pedido: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

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

        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-2">No hay productos en el pedido</h2>
          <p className="text-gray-600 mb-6">Agregá productos desde el catálogo o más vendidos</p>
          <button
            onClick={() => router.push('/dashboard/catalogo')}
            className="bg-nadin-pink text-white px-6 py-3 rounded-lg font-semibold hover:bg-nadin-pink-dark"
          >
            Ir al Catálogo
          </button>
        </div>
      </div>
    );
  }

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

      {/* Datos del Cliente */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-bold text-lg mb-4">📝 Datos de la Cliente</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre completo *
            </label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Ej: María González"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 341 123-4567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-bold text-lg mb-4">📦 Productos ({cart.length})</h3>
        
        <div className="space-y-4">
          {cart.map((item) => {
            const subtotal = item.venta * item.qty;
            const descuento = item.descuento || 0;
            const subtotalConDescuento = subtotal - (descuento * item.qty);
            
            return (
              <div key={item.variantId} className="border rounded-lg p-4">
                <div className="flex gap-3 mb-3">
                  {/* Imagen */}
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

                  {/* Info */}
                  <div className="flex-1">
                    <p className="text-xs text-nadin-pink font-medium">{item.brand}</p>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Talle {item.talle} • {item.color}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">SKU: {item.sku}</p>
                  </div>
                  
                  <button
                    onClick={() => removeFromCart(item.variantId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.qty - 1)}
                      disabled={item.qty <= 1}
                      className="p-1 bg-gray-100 rounded disabled:opacity-50"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-semibold w-8 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.qty + 1)}
                      className="p-1 bg-gray-100 rounded"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <p className="text-sm">
                    {formatCurrency(item.venta)} c/u
                  </p>
                </div>

                {/* Descuento individual (en pesos) */}
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm text-gray-700">Descuento por unidad ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={descuento}
                    onChange={(e) => {
                      const value = Math.max(0, parseFloat(e.target.value) || 0);
                      updateDiscount(item.variantId, value);
                    }}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="0"
                  />
                </div>

                <div className="border-t pt-2 flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <div className="text-right">
                    {descuento > 0 && (
                      <p className="text-gray-500 line-through">{formatCurrency(subtotal)}</p>
                    )}
                    <p className="font-bold text-nadin-pink">
                      {formatCurrency(subtotalConDescuento)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Descuento General */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-bold text-lg mb-4">💰 Descuento General (Opcional)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Este descuento se aplica sobre el total después de los descuentos individuales
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor del descuento
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={descuentoGeneral}
              onChange={(e) => setDescuentoGeneral(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de descuento
            </label>
            <select
              value={tipoDescuentoGeneral}
              onChange={(e) => setTipoDescuentoGeneral(e.target.value as 'porcentaje' | 'fijo')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
            >
              <option value="porcentaje">% Porcentaje</option>
              <option value="fijo">$ Monto Fijo</option>
            </select>
          </div>
        </div>

        {descuentoGeneral > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Descuento a aplicar:</strong> {' '}
              {tipoDescuentoGeneral === 'porcentaje' 
                ? `${descuentoGeneral}% = ${formatCurrency(totales.descuentoGeneralAplicado)}`
                : formatCurrency(descuentoGeneral)
              }
            </p>
          </div>
        )}
      </div>

      {/* Resumen del Pedido */}
      <div className="bg-gradient-to-br from-nadin-pink to-pink-400 text-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="font-bold text-xl mb-4">📊 Resumen del Pedido</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal venta:</span>
            <span className="font-semibold">{formatCurrency(totales.subtotalVenta)}</span>
          </div>
          
          {totales.descuentosIndividuales > 0 && (
            <div className="flex justify-between text-pink-100 text-sm">
              <span>Descuentos por producto:</span>
              <span>-{formatCurrency(totales.descuentosIndividuales)}</span>
            </div>
          )}
          
          {totales.descuentoGeneralAplicado > 0 && (
            <div className="flex justify-between text-pink-100 text-sm">
              <span>Descuento general:</span>
              <span>-{formatCurrency(totales.descuentoGeneralAplicado)}</span>
            </div>
          )}
          
          {totales.totalDescuentos > 0 && (
            <div className="flex justify-between text-pink-100 font-semibold border-t border-pink-300 pt-2">
              <span>Total descuentos:</span>
              <span>-{formatCurrency(totales.totalDescuentos)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-xl font-bold border-t border-pink-300 pt-2">
            <span>Total venta:</span>
            <span>{formatCurrency(totales.totalFinal)}</span>
          </div>
          
          <div className="flex justify-between text-sm opacity-90 border-t border-pink-300 pt-2">
            <span>Costo mayorista:</span>
            <span>{formatCurrency(getTotalMayorista())}</span>
          </div>
          
          <div className="flex justify-between text-lg font-bold">
            <span>Tu ganancia:</span>
            <span>{formatCurrency(totales.ganancia)}</span>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-4">
          <button
            onClick={() => router.back()}
            disabled={loading}
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleFinalizarPedido}
            disabled={loading || !cliente || !telefono}
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creando...
              </>
            ) : (
              <>
                ✓ Finalizar Pedido
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
