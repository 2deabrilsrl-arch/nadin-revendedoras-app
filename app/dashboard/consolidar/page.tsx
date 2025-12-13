// PAGINA: Consolidar CON VALIDACIÓN DE STOCK
// Ubicacion: app/dashboard/consolidar/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Send, ShoppingCart, Home, Mail, X, CheckSquare, Square, AlertTriangle, Trash2, Plus } from 'lucide-react';

interface Pedido {
  id: string;
  cliente: string;
  telefono: string;
  nota: string;
  createdAt: string;
  lineas: any[];
}

interface ProductoSinStock {
  productId: string;
  variantId: string;
  nombre: string;
  talle: string;
  color: string;
  cantidad: number;
  stockActual: number;
  mensaje: string;
  cliente: string;
  telefono: string;
  pedidoId?: string;
  lineaId?: string;
}

export default function ConsolidarPedidosPage() {
  const router = useRouter();
  const [pedidosSinConsolidar, setPedidosSinConsolidar] = useState<Pedido[]>([]);
  const [pedidosSeleccionados, setPedidosSeleccionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [cancelando, setCancelando] = useState<string | null>(null);
  
  // Estados para validación de stock
  const [validandoStock, setValidandoStock] = useState(false);
  const [productosSinStock, setProductosSinStock] = useState<ProductoSinStock[]>([]);
  const [mostrarModalStock, setMostrarModalStock] = useState(false);

  // ✅ NUEVO: Estados para formulario de pago/envío
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [formaPago, setFormaPago] = useState('');
  const [tipoEnvio, setTipoEnvio] = useState('');
  const [transporteNombre, setTransporteNombre] = useState('');

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`/api/pedidos?userId=${userData.id}`);
      
      if (!res.ok) {
        throw new Error('Error al cargar pedidos');
      }
      
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const sinConsolidar = data.filter((p: any) => !p.consolidacionId && p.estado !== 'cancelado');
        setPedidosSinConsolidar(sinConsolidar);
      } else {
        console.error('Respuesta inesperada de la API:', data);
        setPedidosSinConsolidar([]);
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      setPedidosSinConsolidar([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePedido = (pedidoId: string) => {
    setPedidosSeleccionados(prev => {
      if (prev.includes(pedidoId)) {
        return prev.filter(id => id !== pedidoId);
      } else {
        return [...prev, pedidoId];
      }
    });
  };

  const handleToggleTodos = () => {
    if (pedidosSeleccionados.length === pedidosSinConsolidar.length) {
      setPedidosSeleccionados([]);
    } else {
      setPedidosSeleccionados(pedidosSinConsolidar.map(p => p.id));
    }
  };

  const handleCancelarPedido = async (pedidoId: string) => {
    const confirmar = confirm('¿Seguro que querés cancelar este pedido?');
    if (!confirmar) return;

    setCancelando(pedidoId);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'cancelado', orderStatus: 'cancelado' })
      });

      if (!res.ok) throw new Error('Error al cancelar pedido');

      alert('Pedido cancelado exitosamente');
      
      setPedidosSeleccionados(prev => prev.filter(id => id !== pedidoId));
      await cargarPedidos();
    } catch (error) {
      console.error('Error cancelando pedido:', error);
      alert('Error al cancelar el pedido');
    } finally {
      setCancelando(null);
    }
  };

  /**
   * 🆕 VALIDAR STOCK DE TODOS LOS PRODUCTOS
   */
  const validarStockPedidos = async () => {
    const pedidosAConsolidar = pedidosSinConsolidar.filter(p => 
      pedidosSeleccionados.includes(p.id)
    );

    // Construir array de productos para validar
    const productosAValidar: any[] = [];

    pedidosAConsolidar.forEach(pedido => {
      pedido.lineas.forEach((linea: any) => {
        productosAValidar.push({
          productId: linea.productId,
          variantId: linea.variantId,
          nombre: linea.name,
          talle: linea.talle,
          color: linea.color,
          cantidad: linea.qty,
          cliente: pedido.cliente,
          telefono: pedido.telefono,
          pedidoId: pedido.id,
          lineaId: linea.id
        });
      });
    });

    console.log('🔍 Validando stock de', productosAValidar.length, 'productos...');

    try {
      const res = await fetch('/api/pedidos/validar-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productos: productosAValidar })
      });

      if (!res.ok) throw new Error('Error al validar stock');

      const data = await res.json();
      
      console.log('✅ Validación completada:');
      console.log('   Disponibles:', data.conStock?.length || 0);
      console.log('   Sin stock:', data.sinStock?.length || 0);

      return data;

    } catch (error) {
      console.error('❌ Error validando stock:', error);
      throw error;
    }
  };

  /**
   * 🆕 ELIMINAR PRODUCTOS SIN STOCK DE LOS PEDIDOS
   */
  const eliminarProductosSinStock = async () => {
    if (productosSinStock.length === 0) return;

    const confirmar = confirm(
      `¿Confirmar eliminación de ${productosSinStock.length} producto(s) sin stock?\n\n` +
      'Esta acción no se puede deshacer.'
    );

    if (!confirmar) return;

    try {
      // Agrupar líneas a eliminar por pedido
      const lineasPorPedido = new Map<string, string[]>();

      productosSinStock.forEach(producto => {
        if (!producto.pedidoId || !producto.lineaId) return;
        
        if (!lineasPorPedido.has(producto.pedidoId)) {
          lineasPorPedido.set(producto.pedidoId, []);
        }
        lineasPorPedido.get(producto.pedidoId)!.push(producto.lineaId);
      });

      console.log('🗑️ Eliminando líneas sin stock de', lineasPorPedido.size, 'pedidos...');

      // Eliminar líneas de cada pedido
      for (const [pedidoId, lineasIds] of lineasPorPedido) {
        const res = await fetch(`/api/pedidos/${pedidoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'eliminar_lineas',
            lineasIds
          })
        });

        if (!res.ok) {
          throw new Error(`Error eliminando líneas del pedido ${pedidoId}`);
        }

        console.log(`✅ Eliminadas ${lineasIds.length} líneas del pedido ${pedidoId}`);
      }

      alert(`✅ Se eliminaron ${productosSinStock.length} producto(s) sin stock de tus pedidos.`);
      
      // Recargar pedidos y cerrar modal
      await cargarPedidos();
      setMostrarModalStock(false);
      setProductosSinStock([]);

    } catch (error) {
      console.error('❌ Error eliminando productos:', error);
      alert('Error al eliminar productos. Intentá de nuevo.');
    }
  };

  /**
   * 🆕 CONSOLIDAR CON VALIDACIÓN DE STOCK
   */
  const handleConsolidar = async () => {
    if (pedidosSeleccionados.length === 0) {
      alert('Seleccioná al menos un pedido para consolidar');
      return;
    }

    setValidandoStock(true);

    try {
      // 1. Validar stock
      const validacion = await validarStockPedidos();

      // 2. Si hay productos sin stock, mostrar modal
      if (!validacion.todosDisponibles && validacion.sinStock.length > 0) {
        console.log('⚠️ Hay productos sin stock:', validacion.sinStock.length);
        setProductosSinStock(validacion.sinStock);
        setMostrarModalStock(true);
        setValidandoStock(false);
        return; // Detener aquí, esperar decisión del usuario
      }

      // ✅ MODIFICADO: 3. Abrir modal de pago/envío en vez de ir directo
      setValidandoStock(false);
      setMostrarModalPago(true);

    } catch (error) {
      console.error('❌ Error en validación:', error);
      alert('Error al validar stock. ¿Querés continuar de todas formas?');
      setValidandoStock(false);
    }
  };

  /**
   * 🆕 PROCEDER CON LA CONSOLIDACIÓN (después de validar/resolver stock)
   */
  const procederConsolidacion = async () => {
    const confirmar = confirm(
      `Vas a consolidar ${pedidosSeleccionados.length} pedido(s).\n\n` +
      'Se enviará un email a Nadin con tu pedido.\n\n' +
      '¿Continuar?'
    );

    if (!confirmar) {
      setValidandoStock(false);
      return;
    }

    setEnviando(true);

    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('📤 Enviando consolidación...');
      console.log('   Pedidos:', pedidosSeleccionados);
      
      // Calcular totales de los pedidos seleccionados
      const pedidosAEnviar = pedidosSinConsolidar.filter(p => pedidosSeleccionados.includes(p.id));
      
      const totalMayorista = pedidosAEnviar.reduce((sum, pedido) => {
        const total = pedido.lineas?.reduce((pSum: number, l: any) => pSum + (l.mayorista * l.qty), 0) || 0;
        return sum + total;
      }, 0);
      
      const totalVenta = pedidosAEnviar.reduce((sum, pedido) => {
        const total = pedido.lineas?.reduce((pSum: number, l: any) => pSum + (l.venta * l.qty), 0) || 0;
        return sum + total;
      }, 0);
      
      const ganancia = totalVenta - totalMayorista;
      
      console.log('   Total Mayorista:', totalMayorista);
      console.log('   Total Venta:', totalVenta);
      console.log('   Ganancia:', ganancia);
      
      const res = await fetch('/api/consolidaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          pedidoIds: pedidosSeleccionados,
          formaPago: formaPago,
          tipoEnvio: tipoEnvio,
          transporteNombre: tipoEnvio === 'envio' ? transporteNombre : undefined,
          totalMayorista,
          totalVenta,
          ganancia,
          descuentoTotal: 0
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al consolidar');
      }

      const data = await res.json();
      console.log('✅ Respuesta:', data);

      let mensaje = '✅ ¡Pedidos consolidados exitosamente!\n\n';
      
      if (data.email?.enviado) {
        mensaje += '📧 Email enviado a Nadin correctamente.\n';
      } else if (data.email?.error) {
        mensaje += '⚠️ ATENCIÓN: La consolidación se creó pero el email NO se envió.\n\n';
        mensaje += 'Error: ' + data.email.error + '\n\n';
        mensaje += 'Por favor, avisale a Nadin manualmente.\n';
      }

      mensaje += '\n¿Qué querés hacer ahora?';

      alert(mensaje);

      setPedidosSeleccionados([]);

      // ✅ CORREGIDO: Recargar lista para que desaparezcan los pedidos consolidados
      await cargarPedidos();

      const irAPedidos = confirm(
        'OK = Ver mis pedidos\n' +
        'Cancelar = Volver al inicio'
      );

      if (irAPedidos) {
        router.push('/dashboard/pedidos');
      } else {
        router.push('/dashboard');
      }

    } catch (error) {
      console.error('❌ Error consolidando:', error);
      alert(
        '❌ Error al consolidar pedidos\n\n' +
        'Detalle: ' + ((error as any).message || 'Error desconocido') + '\n\n' +
        'Por favor, intentá de nuevo o contactá a soporte.'
      );
    } finally {
      setEnviando(false);
      setValidandoStock(false);
    }
  };

  const calcularTotal = (pedidos: Pedido[]) => {
    return pedidos.reduce((sum, pedido) => {
      const total = pedido.lineas?.reduce((pSum: number, l: any) => pSum + (l.mayorista * l.qty), 0) || 0;
      return sum + total;
    }, 0);
  };

  const handleVolverInicio = () => {
    router.push('/dashboard');
  };

  const handleCrearOtroPedido = () => {
    router.push('/dashboard/catalogo');
  };

  const pedidosAConsolidar = pedidosSinConsolidar.filter(p => 
    pedidosSeleccionados.includes(p.id)
  );

  const totalConsolidacion = calcularTotal(pedidosAConsolidar);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Package className="text-pink-500" size={32} />
                Consolidar Pedidos
              </h1>
              <p className="text-gray-600 mt-2">
                Seleccioná los pedidos que querés enviar a Nadin
              </p>
            </div>
            <button
              onClick={handleVolverInicio}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Home size={20} />
              Inicio
            </button>
          </div>

          {/* Botón seleccionar todos */}
          {pedidosSinConsolidar.length > 0 && (
            <button
              onClick={handleToggleTodos}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors mb-4"
            >
              {pedidosSeleccionados.length === pedidosSinConsolidar.length ? (
                <>
                  <Square size={20} />
                  Deseleccionar todos
                </>
              ) : (
                <>
                  <CheckSquare size={20} />
                  Seleccionar todos
                </>
              )}
            </button>
          )}
        </div>

        {/* Lista de pedidos */}
        <div className="space-y-4">
          {pedidosSinConsolidar.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Package size={64} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                No hay pedidos para consolidar
              </h2>
              <p className="text-gray-600 mb-6">
                Creá un pedido primero para poder consolidar
              </p>
              <button
                onClick={handleCrearOtroPedido}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
              >
                <ShoppingCart size={20} />
                Crear Pedido
              </button>
            </div>
          ) : (
            <>
              {pedidosSinConsolidar.map((pedido) => {
                const isSelected = pedidosSeleccionados.includes(pedido.id);
                const total = pedido.lineas?.reduce((sum: number, l: any) => sum + (l.venta * l.qty), 0) || 0;

                return (
                  <div
                    key={pedido.id}
                    className={`bg-white rounded-2xl shadow-lg p-6 transition-all cursor-pointer ${
                      isSelected ? 'ring-4 ring-pink-300' : 'hover:shadow-xl'
                    }`}
                    onClick={() => handleTogglePedido(pedido.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-full ${isSelected ? 'bg-pink-500' : 'bg-gray-200'}`}>
                          {isSelected ? (
                            <CheckSquare className="text-white" size={24} />
                          ) : (
                            <Square className="text-gray-500" size={24} />
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-1">
                            {pedido.cliente}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">
                            📱 {pedido.telefono}
                          </p>
                          {pedido.nota && (
                            <p className="text-gray-500 text-sm italic">
                              💬 {pedido.nota}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-pink-600 mb-1">
                          ${total.toLocaleString('es-AR')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {pedido.lineas?.length || 0} producto(s)
                        </div>
                      </div>
                    </div>

                    {/* Botón cancelar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelarPedido(pedido.id);
                      }}
                      disabled={cancelando === pedido.id}
                      className="w-full mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <X size={18} />
                      {cancelando === pedido.id ? 'Cancelando...' : 'Cancelar Pedido'}
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Resumen y botón consolidar */}
        {pedidosSeleccionados.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-pink-500 shadow-2xl p-6">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">
                  {pedidosSeleccionados.length} pedido(s) seleccionado(s)
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  ${totalConsolidacion.toLocaleString('es-AR')}
                </div>
              </div>

              <button
                onClick={handleConsolidar}
                disabled={enviando || validandoStock}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                {validandoStock ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Validando stock...
                  </>
                ) : enviando ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={24} />
                    Enviar a Nadin
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 🆕 MODAL DE PRODUCTOS SIN STOCK */}
        {mostrarModalStock && productosSinStock.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={32} />
                    <div>
                      <h2 className="text-2xl font-bold">Productos sin stock</h2>
                      <p className="text-orange-100">
                        {productosSinStock.length} producto(s) no tienen stock disponible
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMostrarModalStock(false);
                      setValidandoStock(false);
                    }}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Lista de productos */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {productosSinStock.map((producto, index) => (
                    <div
                      key={`${producto.productId}-${producto.variantId}-${index}`}
                      className="bg-red-50 border-2 border-red-200 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 mb-1">
                            {producto.nombre}
                          </h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>📏 Talle: {producto.talle} • 🎨 Color: {producto.color}</p>
                            <p>👤 Cliente: {producto.cliente} ({producto.telefono})</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="font-medium">
                                Pedido: {producto.cantidad} unidades
                              </span>
                              <span className="text-red-600 font-bold">
                                Stock actual: {producto.stockActual} unidades
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                            {producto.mensaje}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer con opciones */}
              <div className="border-t bg-gray-50 p-6">
                <div className="space-y-3">
                  {/* Opción 1: Eliminar productos sin stock */}
                  <button
                    onClick={eliminarProductosSinStock}
                    className="w-full px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-colors"
                  >
                    <Trash2 size={20} />
                    Eliminar estos productos y continuar
                  </button>

                  {/* Opción 2: Agregar productos alternativos */}
                  <button
                    onClick={() => {
                      setMostrarModalStock(false);
                      router.push('/dashboard/catalogo');
                    }}
                    className="w-full px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-colors"
                  >
                    <Plus size={20} />
                    Agregar productos alternativos
                  </button>

                  {/* Opción 3: Cancelar */}
                  <button
                    onClick={() => {
                      setMostrarModalStock(false);
                      setValidandoStock(false);
                    }}
                    className="w-full px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-3 transition-colors"
                  >
                    <X size={20} />
                    Cancelar consolidación
                  </button>
                </div>

                <p className="text-sm text-gray-500 text-center mt-4">
                  💡 Tip: Podés eliminar los productos sin stock y agregar otros desde el catálogo
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🆕 MODAL: Formulario de Pago y Envío */}
      {mostrarModalPago && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              📦 Datos de Entrega
            </h3>

            {/* Forma de Pago */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Forma de Pago
              </label>
              <select
                value={formaPago}
                onChange={(e) => setFormaPago((e.target as any).value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              >
                <option value="">Seleccioná una opción...</option>
                <option value="efectivo">💵 Efectivo</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="mercadopago">💳 Mercado Pago</option>
                <option value="tarjeta">💳 Tarjeta de Crédito/Débito</option>
              </select>
            </div>

            {/* Tipo de Envío */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Envío
              </label>
              <select
                value={tipoEnvio}
                onChange={(e) => {
                  setTipoEnvio((e.target as any).value);
                  if ((e.target as any).value !== 'envio') {
                    setTransporteNombre('');
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              >
                <option value="">Seleccioná una opción...</option>
                <option value="retiro">🏪 Retiro en Local</option>
                <option value="envio">📦 Envío por Transporte</option>
              </select>
            </div>

            {/* Nombre del Transporte (solo si es envío) */}
            {tipoEnvio === 'envio' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Transporte
                </label>
                <input
                  type="text"
                  value={transporteNombre}
                  onChange={(e) => setTransporteNombre((e.target as any).value)}
                  placeholder="Ej: Andreani, Cruz del Sur, etc."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setMostrarModalPago(false);
                  setFormaPago('');
                  setTipoEnvio('');
                  setTransporteNombre('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!formaPago || !tipoEnvio) {
                    alert('Por favor completá todos los campos obligatorios');
                    return;
                  }
                  if (tipoEnvio === 'envio' && !transporteNombre.trim()) {
                    alert('Por favor ingresá el nombre del transporte');
                    return;
                  }
                  setMostrarModalPago(false);
                  procederConsolidacion();
                }}
                disabled={!formaPago || !tipoEnvio || (tipoEnvio === 'envio' && !transporteNombre.trim())}
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
              >
                Consolidar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
