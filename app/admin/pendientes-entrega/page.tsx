// ADMIN: PENDIENTES DE ENTREGA - CON BOTÓN CANCELAR
// Ubicación: app/admin/pendientes-entrega/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Truck, AlertCircle, Check, Search, Home, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PendientesEntregaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [consolidaciones, setConsolidaciones] = useState<any[]>([]);
  const [marcando, setMarcando] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null); // 🔥 NUEVO
  const [user, setUser] = useState<any>(null);
  const [busqueda, setBusqueda] = useState('');

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
      const res = await fetch('/api/admin/consolidaciones?pendientesEntrega=true');
      const data = await res.json();
      setConsolidaciones((data as any).consolidaciones || []);
    } catch (error) {
      console.error('Error cargando pendientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarEntregado = async (consolidacionId: string) => {
    if (!user?.email) {
      (globalThis as any).alert?.('❌ Sesión expirada');
      (globalThis as any).window?.location?.assign('/login');
      return;
    }

    if (!(globalThis as any).confirm?.('¿Confirmar que esta consolidación fue entregada?')) {
      return;
    }

    try {
      setMarcando(consolidacionId);

      const res = await fetch(`/api/consolidaciones/${consolidacionId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nuevoEstado: 'completado'
        })
      });

      if (!res.ok) {
        throw new Error('Error al marcar como entregado');
      }

      (globalThis as any).alert?.('✅ Consolidación marcada como entregada');
      await cargarPendientes();

    } catch (error) {
      console.error('Error:', error);
      (globalThis as any).alert?.('❌ Error al marcar como entregada');
    } finally {
      setMarcando(null);
    }
  };

  // 🔥 NUEVO: Cancelar consolidación
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
          <Truck size={32} className="text-blue-500" />
          <h1 className="text-2xl font-bold">Pendientes de Entrega</h1>
        </div>
        <p className="text-gray-600">
          Consolidaciones pagadas que están pendientes de despacho/entrega
        </p>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre de revendedora..."
            value={busqueda}
            onChange={(e) => setBusqueda((e.target as any).value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {busqueda && (
          <p className="text-sm text-gray-600 mt-2">
            Mostrando {consolidacionesFiltradas.length} de {consolidaciones.length} resultados
          </p>
        )}
      </div>

      {/* Estadística */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertCircle size={24} className="text-blue-600" />
          <div>
            <div className="text-2xl font-bold text-blue-700">{consolidacionesFiltradas.length}</div>
            <div className="text-sm text-blue-600">
              {busqueda ? 'Resultados encontrados' : 'Consolidaciones pendientes de envío'}
            </div>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-lg shadow">
        {consolidacionesFiltradas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {busqueda ? (
              <>
                <Search size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
                <p className="text-lg font-semibold">No se encontraron resultados</p>
                <p className="text-sm">Intentá con otro nombre</p>
              </>
            ) : (
              <>
                <Check size={48} className="mx-auto mb-4 text-green-500 opacity-50" />
                <p className="text-lg font-semibold">¡Todo al día!</p>
                <p className="text-sm">No hay consolidaciones pendientes de entrega</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {consolidacionesFiltradas.map((consolidacion: any) => {
              const pedidoIds = JSON.parse(consolidacion.pedidoIds);
              const diasPendientes = Math.floor(
                (Date.now() - new Date(consolidacion.pagadoEn || consolidacion.completadoEn).getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div key={consolidacion.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">{consolidacion.user?.name || 'Usuario'}</h3>
                        {diasPendientes > 3 && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            ⚠️ {diasPendientes} días
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-sm text-gray-600">Monto pagado</div>
                          <div className="text-xl font-bold text-green-600">
                            ${(consolidacion.costoReal || consolidacion.totalMayorista).toLocaleString('es-AR')}
                          </div>
                          {consolidacion.costoReal && consolidacion.costoReal !== consolidacion.totalMayorista && (
                            <div className="text-xs text-green-600 mt-1">
                              ✅ Descuento: ${(consolidacion.totalMayorista - consolidacion.costoReal).toFixed(2)}
                            </div>
                          )}
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
                          {consolidacion.pagadoEn && (
                            <> | <strong>Pagado:</strong> {new Date(consolidacion.pagadoEn).toLocaleDateString('es-AR')}</>
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
                        onClick={() => marcarEntregado(consolidacion.id)}
                        disabled={marcando === consolidacion.id}
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
                      >
                        {marcando === consolidacion.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Marcando...
                          </>
                        ) : (
                          <>
                            <Check size={18} />
                            Marcar Entregado
                          </>
                        )}
                      </button>

                      {/* 🔥 NUEVO: Botón Cancelar */}
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

                      {consolidacion.accessTokens?.token && (
                        <a
                          href={`/armar-consolidacion/${consolidacion.accessTokens.token}`}
                          className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 text-center text-sm"
                        >
                          Ver Detalle
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
