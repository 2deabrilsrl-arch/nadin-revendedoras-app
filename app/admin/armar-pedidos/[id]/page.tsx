'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Check, X, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ArmarPedidoIndividualPage({ params }: any) {
  const router = useRouter();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [estadoProductos, setEstadoProductos] = useState<any>({});

  useEffect(() => {
    cargarPedido();
  }, [params.id]);

  const cargarPedido = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/pedidos/${params.id}`);
      const data: any = await res.json();
      setPedido(data);

      const inicial: any = {};
      data.productos?.forEach((prod: any) => {
        inicial[prod.id] = {
          estado: data.estado === 'armado' ? 'armado' : null,
          cantidadReal: prod.cantidad
        };
      });
      setEstadoProductos(inicial);
    } catch (error) {
      console.error('Error cargando pedido:', error);
      (globalThis as any).alert('Error al cargar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const marcarProducto = (productoId: number, estado: 'armado' | 'faltante' | 'parcial', cantidadReal?: number) => {
    setEstadoProductos((prev: any) => ({
      ...prev,
      [productoId]: {
        estado,
        cantidadReal: cantidadReal !== undefined ? cantidadReal : prev[productoId]?.cantidadReal
      }
    }));
  };

  const finalizarArmado = async () => {
    const productosSinMarcar = pedido.productos.filter(
      (p: any) => !estadoProductos[p.id]?.estado
    );

    if (productosSinMarcar.length > 0) {
      (globalThis as any).alert(`Faltan marcar ${productosSinMarcar.length} productos`);
      return;
    }

    const confirmar = (globalThis as any).confirm('Confirmar finalizacion del armado?');
    if (!confirmar) return;

    try {
      setGuardando(true);

      const productosArmados: any[] = [];
      const productosFaltantes: any[] = [];
      const productosParciales: any[] = [];

      pedido.productos.forEach((prod: any) => {
        const estado = estadoProductos[prod.id];
        if (estado?.estado === 'armado') {
          productosArmados.push(prod);
        } else if (estado?.estado === 'faltante') {
          productosFaltantes.push(prod);
        } else if (estado?.estado === 'parcial') {
          productosParciales.push({
            ...prod,
            cantidadOriginal: prod.cantidad,
            cantidadReal: estado.cantidadReal
          });
        }
      });

      const response = await fetch('/api/admin/pedidos/finalizar-armado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedidoId: pedido.id,
          productosArmados,
          productosFaltantes,
          productosParciales
        })
      });

      if (!response.ok) throw new Error('Error al finalizar armado');

      (globalThis as any).alert('Pedido armado exitosamente!');
      router.push('/admin/armar-pedidos');

    } catch (error) {
      console.error('Error finalizando armado:', error);
      (globalThis as any).alert('Error al finalizar el armado');
    } finally {
      setGuardando(false);
    }
  };

  const getResumen = () => {
    let armados = 0;
    let faltantes = 0;
    let parciales = 0;
    let sinMarcar = 0;

    pedido?.productos.forEach((prod: any) => {
      const estado = estadoProductos[prod.id]?.estado;
      if (estado === 'armado') armados++;
      else if (estado === 'faltante') faltantes++;
      else if (estado === 'parcial') parciales++;
      else sinMarcar++;
    });

    return { armados, faltantes, parciales, sinMarcar };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-center text-gray-600">Pedido no encontrado</p>
      </div>
    );
  }

  const resumen = getResumen();
  const todosMarcados = resumen.sinMarcar === 0;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/armar-pedidos')}
          className="flex items-center gap-2 text-nadin-pink hover:text-nadin-pink-dark mb-4"
        >
          <ArrowLeft size={20} />
          Volver
        </button>

        <div className="bg-white border rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-2">Pedido #{pedido.id}</h1>
          <p className="text-lg font-medium">{pedido.usuario?.nombre}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-700 mb-1">Armados</p>
          <p className="text-2xl font-bold text-green-900">{resumen.armados}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-700 mb-1">Faltantes</p>
          <p className="text-2xl font-bold text-red-900">{resumen.faltantes}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs text-yellow-700 mb-1">Parciales</p>
          <p className="text-2xl font-bold text-yellow-900">{resumen.parciales}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-700 mb-1">Sin Marcar</p>
          <p className="text-2xl font-bold text-gray-900">{resumen.sinMarcar}</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <h2 className="text-lg font-bold mb-4">Productos ({pedido.productos?.length || 0})</h2>

        {pedido.productos?.map((producto: any) => {
          const estado = estadoProductos[producto.id];
          const esParcial = estado?.estado === 'parcial';

          return (
            <div
              key={producto.id}
              className={`bg-white border-2 rounded-lg p-4 ${
                estado?.estado === 'armado' ? 'border-green-300 bg-green-50' :
                estado?.estado === 'faltante' ? 'border-red-300 bg-red-50' :
                estado?.estado === 'parcial' ? 'border-yellow-300 bg-yellow-50' :
                'border-gray-200'
              }`}
            >
              <div className="flex justify-between mb-3">
                <div>
                  <h3 className="font-bold">{producto.nombre}</h3>
                  <p className="text-sm text-gray-600">{producto.talle} - {producto.color}</p>
                </div>
                <p className="text-lg font-bold">x{producto.cantidad}</p>
              </div>

              {esParcial && (
                <div className="mb-3 bg-yellow-100 border border-yellow-300 rounded p-3">
                  <label className="block text-sm font-medium mb-2">Cantidad real:</label>
                  <input
                    type="number"
                    min="0"
                    max={producto.cantidad}
                    value={estado.cantidadReal}
                    onChange={(e) => {
                      const val = parseInt((e.target as any).value) || 0;
                      marcarProducto(producto.id, 'parcial', val);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => marcarProducto(producto.id, 'armado', producto.cantidad)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium ${
                    estado?.estado === 'armado'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  <Check size={18} />
                  Armado
                </button>

                <button
                  onClick={() => marcarProducto(producto.id, 'faltante')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium ${
                    estado?.estado === 'faltante'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  <X size={18} />
                  No Hay
                </button>

                <button
                  onClick={() => marcarProducto(producto.id, 'parcial', Math.floor(producto.cantidad / 2))}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium ${
                    estado?.estado === 'parcial'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  <AlertTriangle size={18} />
                  Parcial
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 bg-white border-t-2 p-6 -mx-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm">{todosMarcados ? 'Todos marcados' : `Faltan ${resumen.sinMarcar}`}</p>
          </div>
          <button
            onClick={finalizarArmado}
            disabled={!todosMarcados || guardando}
            className={`flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg ${
              todosMarcados && !guardando
                ? 'bg-nadin-pink hover:bg-nadin-pink-dark text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {guardando ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save size={24} />
                Finalizar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
