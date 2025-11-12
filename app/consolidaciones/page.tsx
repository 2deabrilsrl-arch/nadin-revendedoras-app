'use client';
import { useState, useEffect } from 'react';
import { Receipt, DollarSign, Package, Calendar, TrendingUp, Check } from 'lucide-react';
import BackToHomeButton from '@/components/BackToHomeButton';

interface Consolidacion {
  id: string;
  pedidoIds: string;
  formaPago: string;
  tipoEnvio: string;
  transporteNombre?: string;
  totalMayorista: number;
  totalVenta: number;
  ganancia: number;
  descuentoTotal: number;
  costoReal?: number;
  gananciaNeta?: number;
  enviadoAt: string;
}

export default function ConsolidacionesPage() {
  const [consolidaciones, setConsolidaciones] = useState<Consolidacion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [costoReal, setCostoReal] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = (globalThis as any).localStorage?.getItem('user');
    if (userData) {
      const u = JSON.parse(userData);
      setUser(u);
      cargarConsolidaciones(u.id);
    }
  }, []);

  const cargarConsolidaciones = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/consolidar?userId=${userId}`);
      if (res.ok) {
        const data = await res.json() as Consolidacion[];
        setConsolidaciones(data);
      }
    } catch (error) {
      console.error('Error al cargar consolidaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarPago = async (consolidacionId: string) => {
    const monto = parseFloat(costoReal);
    if (isNaN(monto) || monto <= 0) {
      (globalThis as any).alert?.('Ingresá un monto válido');
      return;
    }

    const res = await fetch('/api/consolidar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consolidacionId,
        costoReal: monto
      })
    });

    if (res.ok) {
      (globalThis as any).alert?.('✅ Pago registrado correctamente');
      setSelectedId(null);
      setCostoReal('');
      if (user) cargarConsolidaciones(user.id);
    } else {
      (globalThis as any).alert?.('❌ Error al registrar el pago');
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calcularPedidosCount = (pedidoIds: string) => {
    try {
      return JSON.parse(pedidoIds).length;
    } catch {
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <BackToHomeButton />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Cargando consolidaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 pb-24">
      <BackToHomeButton />
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="text-nadin-pink" size={28} />
          Mis Consolidaciones
        </h2>
        <p className="text-gray-600 mt-1">
          Historial de pedidos consolidados enviados a Nadin
        </p>
      </div>

      {consolidaciones.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="mx-auto mb-4 text-gray-300" size={64} />
          <p className="text-gray-500 mb-2">No hay consolidaciones todavía</p>
          <p className="text-sm text-gray-400 mb-6">
            Cuando envíes pedidos a Nadin aparecerán aquí
          </p>
          <a
            href="/dashboard/consolidar"
            className="inline-block px-6 py-3 bg-nadin-pink text-white rounded-lg hover:bg-nadin-pink-dark font-semibold"
          >
            Ir a Consolidar Pedidos
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {consolidaciones.map((consolidacion) => {
            const pedidosCount = calcularPedidosCount(consolidacion.pedidoIds);
            const totalFinal = consolidacion.totalVenta - consolidacion.descuentoTotal;
            const tienePagoReal = consolidacion.costoReal !== null && consolidacion.costoReal !== undefined;
            const isEditing = selectedId === consolidacion.id;

            return (
              <div
                key={consolidacion.id}
                className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-gray-100 hover:border-nadin-pink transition-colors"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-nadin-pink to-pink-400 text-white px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar size={20} />
                      <span className="font-semibold">
                        {formatFecha(consolidacion.enviadoAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                      <Package size={16} />
                      <span className="text-sm font-medium">
                        {pedidosCount} pedido{pedidosCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  {/* Información del envío */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <DollarSign className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Forma de pago</p>
                        <p className="font-semibold">{consolidacion.formaPago}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Package className="text-purple-600" size={20} />
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Tipo de envío</p>
                        <p className="font-semibold">
                          {consolidacion.tipoEnvio}
                          {consolidacion.transporteNombre && (
                            <span className="text-gray-500 text-xs ml-1">
                              ({consolidacion.transporteNombre})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Totales financieros */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total vendido:</span>
                      <span className="font-semibold">
                        ${consolidacion.totalVenta.toLocaleString('es-AR')}
                      </span>
                    </div>
                    
                    {consolidacion.descuentoTotal > 0 && (
                      <div className="flex justify-between text-sm text-orange-600">
                        <span>Descuento aplicado:</span>
                        <span className="font-semibold">
                          -${consolidacion.descuentoTotal.toLocaleString('es-AR')}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-gray-600">Total final:</span>
                      <span className="font-semibold text-lg">
                        ${totalFinal.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm text-gray-500 pt-2 border-t">
                      <span>Costo mayorista estimado:</span>
                      <span>${consolidacion.totalMayorista.toLocaleString('es-AR')}</span>
                    </div>

                    {!tienePagoReal && (
                      <div className="flex justify-between text-sm text-green-600 font-semibold pt-2 border-t">
                        <span>Ganancia estimada:</span>
                        <span>${consolidacion.ganancia.toLocaleString('es-AR')}</span>
                      </div>
                    )}
                  </div>

                  {/* Sección de pago real */}
                  <div className="mt-6">
                    {tienePagoReal ? (
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-green-500 rounded-full p-1">
                            <Check className="text-white" size={16} />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-green-800 mb-3">
                              💰 Pago a Nadin registrado
                            </p>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-green-700">Monto real pagado:</span>
                                <span className="font-bold text-green-900">
                                  ${consolidacion.costoReal?.toLocaleString('es-AR')}
                                </span>
                              </div>
                              <div className="flex justify-between text-base border-t-2 border-green-200 pt-2">
                                <span className="text-green-700 font-semibold">
                                  Tu ganancia neta real:
                                </span>
                                <span className="font-bold text-green-900 text-lg flex items-center gap-1">
                                  <TrendingUp size={18} />
                                  ${consolidacion.gananciaNeta?.toLocaleString('es-AR')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                        {!isEditing ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-yellow-800 mb-1">
                                ⚠️ Falta registrar el pago a Nadin
                              </p>
                              <p className="text-xs text-yellow-700">
                                Agregá el monto que realmente pagaste para calcular tu ganancia neta
                              </p>
                            </div>
                            <button
                              onClick={() => setSelectedId(consolidacion.id)}
                              className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 whitespace-nowrap ml-4"
                            >
                              Agregar pago
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="font-semibold text-yellow-800">
                              💳 ¿Cuánto pagaste realmente a Nadin?
                            </p>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <input
                                  type="number"
                                  value={costoReal}
                                  onChange={(e) => setCostoReal((e.target as HTMLInputElement).value)}
                                  placeholder="Ej: 45000"
                                  className="w-full px-4 py-2 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              <button
                                onClick={() => handleAgregarPago(consolidacion.id)}
                                className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedId(null);
                                  setCostoReal('');
                                }}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400"
                              >
                                Cancelar
                              </button>
                            </div>
                            <p className="text-xs text-yellow-700">
                              Puede ser diferente al costo mayorista debido a descuentos, comisiones de pago, etc.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
