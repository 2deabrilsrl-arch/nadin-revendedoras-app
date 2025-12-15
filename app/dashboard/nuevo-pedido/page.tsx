// PAGINA: Crear Nuevo Pedido - CON DESCUENTOS INDIVIDUALES Y GLOBAL
// Ubicacion: app/dashboard/nuevo-pedido/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  ArrowRight, 
  Home, 
  User, 
  Phone, 
  FileText,
  Trash2,
  Package,
  AlertCircle,
  Percent,
  DollarSign,
  Edit2,
  Tag
} from 'lucide-react';
import { useCart } from '@/components/CartContext';
import { formatCurrency } from '@/lib/precios';

export default function NuevoPedidoPage() {
  const router = useRouter();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    updateDescuentoPesos,
    updateDescuentoPorcentaje,
    clearCart,
    getTotalItems,
    getTotalMayorista,
    getTotalVenta,
    getTotalDescuentos,
    getTotalFinal,
    getGananciaEstimada
  } = useCart();

  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Estados para edicion de descuentos individuales
  const [editingDiscount, setEditingDiscount] = useState<number | null>(null);
  const [discountType, setDiscountType] = useState<'pesos' | 'porcentaje'>('pesos');
  const [discountValue, setDiscountValue] = useState('');

  // Estados para descuento global
  const [descuentoGlobalTipo, setDescuentoGlobalTipo] = useState<'pesos' | 'porcentaje'>('pesos');
  const [descuentoGlobalValor, setDescuentoGlobalValor] = useState(0);
  const [editandoDescuentoGlobal, setEditandoDescuentoGlobal] = useState(false);
  const [descuentoGlobalInput, setDescuentoGlobalInput] = useState('');

  useEffect(() => {
    const userData = (globalThis as any).localStorage?.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Calcular total final con descuento global
  const calcularTotalConDescuentoGlobal = () => {
    const totalConDescuentosIndividuales = getTotalFinal();

    if (descuentoGlobalValor === 0) {
      return totalConDescuentosIndividuales;
    }

    if (descuentoGlobalTipo === 'porcentaje') {
      return totalConDescuentosIndividuales - (totalConDescuentosIndividuales * descuentoGlobalValor / 100);
    } else {
      return totalConDescuentosIndividuales - descuentoGlobalValor;
    }
  };

  // Calcular descuento global en pesos
  const calcularDescuentoGlobalEnPesos = () => {
    if (descuentoGlobalValor === 0) return 0;

    const totalConDescuentosIndividuales = getTotalFinal();

    if (descuentoGlobalTipo === 'porcentaje') {
      return totalConDescuentosIndividuales * descuentoGlobalValor / 100;
    } else {
      return descuentoGlobalValor;
    }
  };

  const handleCrearPedido = async () => {
    // Validaciones
    if (cart.length === 0) {
      ((globalThis as any).alert)?.('El carrito esta vacio');
      return;
    }

    if (!cliente.trim()) {
      ((globalThis as any).alert)?.('Por favor ingresa el nombre del cliente');
      return;
    }

    if (!telefono.trim()) {
      ((globalThis as any).alert)?.('Por favor ingresa el telefono del cliente');
      return;
    }

    if (!user || !user.id) {
      ((globalThis as any).alert)?.('Error: Usuario no autenticado');
      return;
    }

    setLoading(true);

    try {
      // Preparar datos del pedido
      const pedidoData = {
        userId: user.id,
        cliente: cliente.trim(),
        telefono: telefono.trim(),
        nota: nota.trim() || '',
        items: cart.map(item => ({
          productId: item.productId.toString(),
          variantId: item.variantId.toString(),
          sku: item.sku,
          brand: item.brand,
          name: item.name,
          talle: item.talle,
          color: item.color,
          qty: item.qty,
          mayorista: item.mayorista,
          venta: item.venta
        })),
        descuentoTotal: calcularDescuentoGlobalEnPesos()
      };

      console.log('Creando pedido:', pedidoData);

      // Crear pedido en la API
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedidoData)
      });

      if (!res.ok) {
        const error = await res.json() as any;
        throw new Error(error.error || 'Error al crear pedido');
      }

      const data = await res.json() as any;
      console.log('Pedido creado:', data);

      // Limpiar carrito
      clearCart();

      // Preguntar que hacer
      const irAConsolidar = (globalThis as any).confirm?.(
        'Pedido creado exitosamente!\n\n' +
        'Cliente: ' + cliente + '\n' +
        'Total: ' + formatCurrency(calcularTotalConDescuentoGlobal()) + '\n\n' +
        'Queres consolidar este pedido ahora?\n\n' +
        'OK = Ir a Consolidar\n' +
        'Cancelar = Volver al inicio'
      );

      if (irAConsolidar) {
        router.push('/dashboard/consolidar');
      } else {
        router.push('/dashboard');
      }

    } catch (error) {
      console.error('Error creando pedido:', error);
      ((globalThis as any).alert)?.('Error al crear el pedido: ' + ((error as any).message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejo de descuentos individuales
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

  // Funciones para descuento global
  const handleOpenDescuentoGlobal = () => {
    setEditandoDescuentoGlobal(true);
    setDescuentoGlobalInput(descuentoGlobalValor.toString());
  };

  const handleApplyDescuentoGlobal = () => {
    const valor = parseFloat(descuentoGlobalInput) || 0;
    setDescuentoGlobalValor(valor);
    setEditandoDescuentoGlobal(false);
  };

  const handleRemoveDescuentoGlobal = () => {
    setDescuentoGlobalValor(0);
    setDescuentoGlobalInput('');
    setEditandoDescuentoGlobal(false);
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

  if (!user) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package size={28} className="text-pink-500" />
              Nuevo Pedido
            </h1>
            <p className="text-gray-600 mt-1">
              {cart.length > 0 
                ? getTotalItems() + ' producto' + (getTotalItems() !== 1 ? 's' : '') + ' en el carrito'
                : 'El carrito esta vacio'}
            </p>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium transition-colors"
          >
            <Home size={20} />
            <span className="hidden sm:inline">Volver al Inicio</span>
          </button>
        </div>
      </div>

      {/* Productos en el carrito */}
      {cart.length > 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingCart size={24} />
            Productos del Pedido
          </h2>

          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.variantId}
                className="flex gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-pink-300 transition-colors"
              >
                {/* Imagen */}
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image && item.image !== '/placeholder.png' ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package size={32} />
                    </div>
                  )}
                </div>

                {/* Info y controles */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 pr-4">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600">{item.brand}</p>
                      <p className="text-sm text-gray-600">
                        Talle {item.talle} - {item.color}
                      </p>
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        {formatCurrency(item.venta)} c/u x {item.qty} = {formatCurrency(item.venta * item.qty)}
                      </p>
                    </div>

                    {/* Boton eliminar */}
                    <button
                      onClick={() => removeFromCart(item.variantId)}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                      title="Eliminar producto"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Editor de descuento individual */}
                  {editingDiscount === item.variantId ? (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border-2 border-pink-300">
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => setDiscountType('pesos')}
                          className={'flex-1 py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1 ' + (discountType === 'pesos' ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300')}
                        >
                          <DollarSign size={16} /> En Pesos
                        </button>
                        <button
                          onClick={() => setDiscountType('porcentaje')}
                          className={'flex-1 py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1 ' + (discountType === 'porcentaje' ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300')}
                        >
                          <Percent size={16} /> En Porcentaje
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
                          placeholder={discountType === 'porcentaje' ? '% descuento' : '$ descuento'}
                          className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                          autoFocus
                        />
                        <button
                          onClick={() => handleApplyDiscount(item.variantId)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                        >
                          Aplicar
                        </button>
                        <button
                          onClick={() => setEditingDiscount(null)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => handleOpenDiscountEdit(item.variantId, item)}
                        className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1 hover:bg-pink-50 px-3 py-1 rounded transition-colors"
                      >
                        <Edit2 size={14} />
                        {(item.descuentoPorcentaje || item.descuentoPesos) ? 'Editar descuento' : 'Agregar descuento'}
                      </button>

                      {/* Mostrar descuento aplicado */}
                      {item.descuentoPorcentaje && item.descuentoPorcentaje > 0 && (
                        <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                          -{item.descuentoPorcentaje}% descuento
                        </span>
                      )}
                      {item.descuentoPesos && item.descuentoPesos > 0 && (
                        <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                          -{formatCurrency(item.descuentoPesos * item.qty)} descuento
                        </span>
                      )}
                    </div>
                  )}

                  {/* Subtotal con descuento */}
                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Subtotal:</span>
                    <div className="text-right">
                      {(item.descuentoPorcentaje || item.descuentoPesos) ? (
                        <>
                          <span className="text-sm text-gray-400 line-through mr-2">
                            {formatCurrency(item.venta * item.qty)}
                          </span>
                          <span className="text-lg font-bold text-pink-600">
                            {formatCurrency(calcularPrecioConDescuento(item))}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-pink-600">
                          {formatCurrency(item.venta * item.qty)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totales con descuentos */}
          <div className="mt-6 pt-6 border-t-2 border-gray-300 space-y-3 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-base text-gray-700">
              <span className="font-medium">Subtotal:</span>
              <span className="font-semibold">{formatCurrency(getTotalVenta())}</span>
            </div>

            {getTotalDescuentos() > 0 && (
              <div className="flex justify-between text-base text-green-600">
                <span className="font-medium">Descuentos por producto:</span>
                <span className="font-bold">-{formatCurrency(getTotalDescuentos())}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-semibold border-t border-gray-300 pt-2">
              <span>Subtotal con descuentos:</span>
              <span>{formatCurrency(getTotalFinal())}</span>
            </div>

            {/* Panel de descuento global */}
            <div className="border-t-2 border-gray-300 pt-3 mt-3">
              {editandoDescuentoGlobal ? (
                <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-300">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={20} className="text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Descuento Global en el Total</h3>
                  </div>

                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setDescuentoGlobalTipo('pesos')}
                      className={'flex-1 py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1 ' + (descuentoGlobalTipo === 'pesos' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300')}
                    >
                      <DollarSign size={16} /> En Pesos
                    </button>
                    <button
                      onClick={() => setDescuentoGlobalTipo('porcentaje')}
                      className={'flex-1 py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1 ' + (descuentoGlobalTipo === 'porcentaje' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300')}
                    >
                      <Percent size={16} /> En Porcentaje
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max={descuentoGlobalTipo === 'porcentaje' ? '100' : undefined}
                      step={descuentoGlobalTipo === 'porcentaje' ? '1' : '0.01'}
                      value={descuentoGlobalInput}
                      onChange={(e) => setDescuentoGlobalInput((e.target as any).value)}
                      placeholder={descuentoGlobalTipo === 'porcentaje' ? '% descuento' : '$ descuento'}
                      className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      autoFocus
                    />
                    <button
                      onClick={handleApplyDescuentoGlobal}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                    >
                      Aplicar
                    </button>
                    <button
                      onClick={() => setEditandoDescuentoGlobal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleOpenDescuentoGlobal}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:bg-blue-50 px-3 py-2 rounded transition-colors"
                  >
                    <Tag size={16} />
                    {descuentoGlobalValor > 0 ? 'Editar descuento global' : 'Agregar descuento global'}
                  </button>

                  {descuentoGlobalValor > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                        {descuentoGlobalTipo === 'porcentaje'
                          ? '-' + descuentoGlobalValor + '% en el total'
                          : '-' + formatCurrency(descuentoGlobalValor) + ' en el total'}
                      </span>
                      <button
                        onClick={handleRemoveDescuentoGlobal}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {descuentoGlobalValor > 0 && (
                <div className="flex justify-between text-base text-blue-600 mt-2">
                  <span className="font-medium">Descuento global aplicado:</span>
                  <span className="font-bold">-{formatCurrency(calcularDescuentoGlobalEnPesos())}</span>
                </div>
              )}
            </div>

            {/* Total final */}
            <div className="flex justify-between text-xl font-bold border-t-2 border-gray-400 pt-3">
              <span>Total del Pedido:</span>
              <span className="text-pink-600">{formatCurrency(calcularTotalConDescuentoGlobal())}</span>
            </div>

            <div className="flex justify-between text-sm text-gray-600 pt-2 border-t border-gray-200">
              <span>Tu ganancia estimada:</span>
              <span className="font-bold text-green-600 text-base">
                {formatCurrency(calcularTotalConDescuentoGlobal() - getTotalMayorista())}
              </span>
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span>Costo mayorista:</span>
              <span className="font-semibold">
                {formatCurrency(getTotalMayorista())}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            El carrito esta vacio
          </h3>
          <p className="text-gray-500 mb-6">
            Agrega productos para crear un pedido
          </p>
          <button
            onClick={() => router.push('/dashboard/catalogo')}
            className="bg-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors"
          >
            Ir al Catalogo
          </button>
        </div>
      )}

      {/* Datos del cliente */}
      {cart.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User size={24} />
            Datos del Cliente
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Cliente <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente((e.target as any).value)}
                  placeholder="Ej: Maria Gonzalez"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Telefono <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono((e.target as any).value)}
                  placeholder="Ej: 3416856033"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nota del Pedido (opcional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                <textarea
                  value={nota}
                  onChange={(e) => setNota((e.target as any).value)}
                  placeholder="Ej: Entrega urgente, preferencia de colores, etc."
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botones de accion */}
      {cart.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push('/dashboard/catalogo')}
              className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 border-2 border-gray-300"
            >
              <ShoppingCart size={20} />
              Agregar mas productos
            </button>

            <button
              onClick={handleCrearPedido}
              disabled={loading || !cliente.trim() || !telefono.trim()}
              className="flex-1 bg-pink-500 text-white py-4 px-6 rounded-lg font-semibold hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creando pedido...
                </>
              ) : (
                <>
                  Crear Pedido
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>

          {(!cliente.trim() || !telefono.trim()) && (
            <div className="mt-4 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <p>
                <strong>Recorda:</strong> El nombre y telefono del cliente son obligatorios para crear el pedido.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
