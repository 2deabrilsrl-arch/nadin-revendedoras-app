// ADMIN: PENDIENTES DE ARMADO - CON BÚSQUEDA
// Ubicación: app/admin/pendientes-armado/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, AlertCircle, CheckCircle, MessageCircle, Search } from 'lucide-react';

export default function PendientesArmadoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [consolidaciones, setConsolidaciones] = useState<any[]>([]);
  const [mensajesSinLeer, setMensajesSinLeer] = useState<Record<string, number>>({});
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarDatos();
    
    const interval = setInterval(cargarMensajesSinLeer, 10000);
    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      await Promise.all([
        cargarConsolidaciones(),
        cargarMensajesSinLeer()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarConsolidaciones = async () => {
    try {
      const res = await fetch('/api/admin/consolidaciones?pendientesArmado=true');
      const data = await res.json();
      setConsolidaciones(data.consolidaciones || []);
    } catch (error) {
      console.error('Error cargando consolidaciones:', error);
    }
  };

  const cargarMensajesSinLeer = async () => {
    try {
      const res = await fetch('/api/admin/mensajes-sin-leer');
      const data = await res.json();
      if (data.success) {
        setMensajesSinLeer(data.contadores || {});
      }
    } catch (error) {
      console.error('Error cargando mensajes sin leer:', error);
    }
  };

  const abrirConsolidacion = async (consolidacionId: string) => {
    try {
      const res = await fetch(`/api/consolidaciones/${consolidacionId}/access-token`, {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.token) {
        router.push(`/armar-consolidacion/${data.token}`);
      } else {
        alert('Error obteniendo acceso a la consolidación');
      }
    } catch (error) {
      console.error('Error abriendo consolidación:', error);
      alert('Error al abrir la consolidación');
    }
  };

  // ✅ FILTRADO CON BÚSQUEDA
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
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-2">
          <Package size={32} className="text-yellow-500" />
          <h1 className="text-2xl font-bold">Pendientes de Armado</h1>
        </div>
        <p className="text-gray-600">
          Consolidaciones enviadas que están esperando ser armadas
        </p>
      </div>

      {/* ✅ BUSCADOR */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre de revendedora..."
            value={busqueda}
            onChange={(e) => setBusqueda((e.target as any).value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        {busqueda && (
          <p className="text-sm text-gray-600 mt-2">
            Mostrando {consolidacionesFiltradas.length} de {consolidaciones.length} resultados
          </p>
        )}
      </div>

      {/* Estadística */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertCircle size={24} className="text-yellow-600" />
          <div>
            <div className="text-2xl font-bold text-yellow-700">{consolidacionesFiltradas.length}</div>
            <div className="text-sm text-yellow-600">
              {busqueda ? 'Resultados encontrados' : 'Consolidaciones pendientes de armar'}
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
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500 opacity-50" />
                <p className="text-lg font-semibold">¡Todo al día!</p>
                <p className="text-sm">No hay consolidaciones pendientes de armar</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {consolidacionesFiltradas.map((consolidacion: any) => {
              const pedidoIds = JSON.parse(consolidacion.pedidoIds);
              const diasPendientes = Math.floor(
                (Date.now() - new Date(consolidacion.enviadoAt).getTime()) / (1000 * 60 * 60 * 24)
              );
              const mensajesCount = mensajesSinLeer[consolidacion.id] || 0;

              return (
                <div key={consolidacion.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">{consolidacion.user?.name || 'Usuario'}</h3>
                        {diasPendientes > 7 && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            ⚠️ {diasPendientes} días
                          </span>
                        )}
                        {mensajesCount > 0 && (
                          <div className="bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                            <MessageCircle size={16} />
                            <span className="font-bold">{mensajesCount}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-sm text-gray-600">Monto esperado</div>
                          <div className="text-xl font-bold text-pink-600">
                            ${consolidacion.totalMayorista.toLocaleString('es-AR')}
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
                        onClick={() => abrirConsolidacion(consolidacion.id)}
                        className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 font-semibold flex items-center gap-2 whitespace-nowrap"
                      >
                        <Package size={18} />
                        Armar
                      </button>
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
