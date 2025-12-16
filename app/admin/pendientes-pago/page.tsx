// ADMIN: PENDIENTES DE PAGO - CON BOTÓN CANCELAR Y VER/EDITAR PEDIDO
// Ubicación: app/admin/pendientes-pago/page.tsx
// ✅ NUEVO: Botón "Ver/Editar Pedido" para modificar consolidación antes del pago

'use client';

import { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, Check, X, Search, Home, Trash2, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PendientesPagoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [consolidaciones, setConsolidaciones] = useState<any[]>([]);
  const [marcando, setMarcando] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [busqueda, setBusqueda] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [consolidacionSeleccionada, setConsolidacionSeleccionada] = useState<any>(null);
  const [montoReal, setMontoReal] = useState('');

  useEffect(() => {
    const userData = (globalThis as any).localStorage?.getItem('user');
    if (userData) {
      const u = JSON.parse(userData);
      setUser(u);
      
      if (u.rol !== 'vendedora') {
        (globalThis as any).alert?.('❌ No tenés permisos para acceder a esta página');
        (globalThis as any).window?.location?.assign('/dashboard');
        return;
      }
    } else {
      (globalThis as any).window?.location?.assign('/login');
      return;
    }

    cargarPendientes();
  }, []);

  const cargarPendientes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/consolidaciones?pendientesPago=true');
      const data = await res.json();
      setConsolidaciones((data as any).consolidaciones || []);
    } catch (error) {
      console.error('Error cargando pendientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalPago = (consolidacion: any) => {
    setConsolidacionSeleccionada(consolidacion);
    // ✅ Usar costoReal si existe (ya tiene descuentos del armado), sino totalMayorista
    setMontoReal((consolidacion.costoReal || consolidacion.totalMayorista).toString());
    setShowModal(true);
  };

  const marcarPagadoConMonto = async () => {
    if (!user?.email) {
      (globalThis as any).alert?.('❌ Sesión expirada');
      (globalThis as any).window?.location?.assign('/login');
      return;
    }

    if (!montoReal || parseFloat(montoReal) <= 0) {
      (globalThis as any).alert?.('❌ Ingresá un monto válido');
      return;
    }

    const montoRealNum = parseFloat(montoReal);

    try {
      setMarcando(consolidacionSeleccionada.id);

      const resPago = await fetch(`/api/consolidaciones/${consolidacionSeleccionada.id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nuevoEstado: 'pagado'
        })
      });

      if (!resPago.ok) {
        throw new Error('Error al marcar como pagado');
      }

      // Actualizar monto real y ganancia neta
      const resGanancia = await fetch('/api/admin/consolidaciones/actualizar-ganancia', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consolidacionId: consolidacionSeleccionada.id,
          costoReal: montoRealNum
        })
      });

      if (!resGanancia.ok) {
        console.error('Error actualizando ganancia, pero pago registrado');
      }

      (globalThis as any).alert?.('✅ Consolidación marcada como pagada');
      setShowModal(false);
      setConsolidacionSeleccionada(null);
      setMontoReal('');
      await cargarPendientes();

    } catch (error) {
      console.error('Error:', error);
      (globalThis as any).alert?.('❌ Error al marcar como pagada');
    } finally {
      setMarcando(null);
    }
  };

  // Cancelar consolidación
  const cancelarConsolidacion = async (consolidacionId: string, nombreRevendedora: string) => {
    if (!(globalThis as any).confirm?.(`¿Estás segura de cancelar la consolidación de ${nombreRevendedora}?\n\nEsto marcará todos los pedidos como cancelados y recalculará la gamificación de la revendedora.`)) {
      return;
    }

    try {
      setCancelando(consolidacionId);

      const res = await fetch(`/api/admin/consolidaciones/${consolidacionId}/cancelar-vendedora`, {
        method: 'POST'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error((data as any).error || 'Error al cancelar');
      }

      (globalThis as any).alert?.('✅ Consolidación cancelada. La revendedora fue notificada.');
      await cargarPendientes();

    } catch (error: any) {
      console.error('Error cancelando:', error);
      (globalThis as any).alert?.(`❌ ${error.message}`);
    } finally {
      setCancelando(null);
    }
  };

  const consolidacionesFiltradas = consolidaciones.filter(c => {
    if (busqueda.trim()) {
      const searchLower = busqueda.toLowerCase();
      const nombreCompleto = (c.user?.name || '').toLowerCase();
      return nombreCompleto.includes(searchLower);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-gray-600">Cargando pendientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botón Volver */}
      <button
        onClick={() => router.push('/admin/dashboard')}
        className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium transition-colors"
      >
        <Home size={20} />
        <span>Volver al Inicio</span>
      </button>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign size={32} className="text-pink-500" />
          <h1 className="text-2xl font-bold">Pendientes de Pago</h1>
        </div>
        <p className="text-gray-600">
          Consolidaciones armadas que están pendientes de pago por parte de las revendedoras
        </p>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre de revendedora..."
            value={busqueda}
            onChange={(e) => setBusqueda((e.target as any).value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      </div>

      {/* Lista de consolidaciones */}
      <div>
        {consolidacionesFiltradas.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">
              {busqueda.trim() ? 'No se encontraron coincidencias' : 'No hay consolidaciones pendientes de pago'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {consolidacionesFiltradas.map(consolidacion => {
              const pedidoIds = JSON.parse(consolidacion.pedidoIds || '[]');
              const diasPendientes = Math.floor((Date.now() - new Date(consolidacion.enviadoAt).getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div key={consolidacion.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900">
                            {consolidacion.user?.name}
                          </h3>
                          {diasPendientes > 7 && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              ⚠️ {diasPendientes} días
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="text-sm text-gray-600">Monto esperado</div>
                            <div className="text-xl font-bold text-pink-600">
                              ${(consolidacion.costoReal || consolidacion.totalMayorista).toLocaleString('es-AR')}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Pedidos incluidos</div>
                            <div className="text-xl font-bold text-gray-700">{pedidoIds.length}</div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <strong>Enviado:</strong> {new Date(consolidacion.enviadoAt).toLocaleDateString('es-AR')}
                            {consolidacion.completadoEn && (
                              <> | <strong>Armado:</strong> {new Date(consolidacion.completadoEn).toLocaleDateString('es-AR')}</>
                            )}
                          </p>
                          <p>
                            <strong>Forma de pago:</strong> {consolidacion.formaPago} | 
                            <strong> Envío:</strong> {consolidacion.tipoEnvio}
                          </p>
                          <p>
                            <strong>Contacto:</strong> {consolidacion.user?.telefono} | {consolidacion.user?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => abrirModalPago(consolidacion)}
                          disabled={marcando === consolidacion.id}
                          className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
                        >
                          {marcando === consolidacion.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Marcando...
                            </>
                          ) : (
                            <>
                              <Check size={18} />
                              Marcar Pagado
                            </>
                          )}
                        </button>

                        {/* Botón Cancelar */}
                        <button
                          onClick={() => cancelarConsolidacion(consolidacion.id, consolidacion.user?.name)}
                          disabled={cancelando === consolidacion.id}
                          className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm flex items-center gap-2 justify-center"
                        >
                          {cancelando === consolidacion.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Cancelando...
                            </>
                          ) : (
                            <>
                              <Trash2 size={16} />
                              Cancelar
                            </>
                          )}
                        </button>

                        {/* ✅ NUEVO: Botón Ver/Editar Pedido */}
                        {consolidacion.accessTokens?.token && (
                          <button
                            onClick={() => router.push(`/armar-consolidacion/${consolidacion.accessTokens.token}`)}
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 text-sm flex items-center gap-2 justify-center font-medium"
                          >
                            <Package size={16} />
                            Ver/Editar Pedido
                          </button>
                        )}

                        {consolidacion.accessTokens?.token && (
                          <a
                            href={`/armar-consolidacion/${consolidacion.accessTokens.token}`}
                            className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 text-center text-sm"
                          >
                            Ver Chat
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para ingresar monto real */}
      {showModal && consolidacionSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Registrar Pago</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setConsolidacionSeleccionada(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Revendedora:</strong> {consolidacionSeleccionada.user?.name}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Pedidos:</strong> {JSON.parse(consolidacionSeleccionada.pedidoIds).length}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  Monto esperado {consolidacionSeleccionada.costoReal ? '(con descuentos del armado)' : '(mayorista)'}
                </p>
                <p className="text-2xl font-bold text-gray-700">
                  ${(consolidacionSeleccionada.costoReal || consolidacionSeleccionada.totalMayorista).toLocaleString('es-AR')}
                </p>
                {consolidacionSeleccionada.costoReal && 
                 consolidacionSeleccionada.costoReal !== consolidacionSeleccionada.totalMayorista && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      Total original: ${consolidacionSeleccionada.totalMayorista.toLocaleString('es-AR')}
                    </p>
                    <p className="text-xs text-green-600 font-semibold">
                      ✅ Ya se aplicaron ${(consolidacionSeleccionada.totalMayorista - consolidacionSeleccionada.costoReal).toLocaleString('es-AR')} de descuento en el armado
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Cuánto pagó realmente? *
                </label>
                <input
                  type="number"
                  value={montoReal}
                  onChange={(e) => setMontoReal((e.target as any).value)}
                  placeholder="Ingresá el monto real pagado"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-lg font-semibold"
                  step="0.01"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ingresá el monto exacto que te pagó la revendedora
                </p>
              </div>

              {montoReal && parseFloat(montoReal) !== (consolidacionSeleccionada.costoReal || consolidacionSeleccionada.totalMayorista) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Diferencia adicional:</strong> ${((consolidacionSeleccionada.costoReal || consolidacionSeleccionada.totalMayorista) - parseFloat(montoReal)).toLocaleString('es-AR')}
                    {parseFloat(montoReal) < (consolidacionSeleccionada.costoReal || consolidacionSeleccionada.totalMayorista) ? ' (descuento adicional)' : ' (pago extra)'}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setConsolidacionSeleccionada(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={marcarPagadoConMonto}
                  disabled={!montoReal || parseFloat(montoReal) <= 0}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                >
                  Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
