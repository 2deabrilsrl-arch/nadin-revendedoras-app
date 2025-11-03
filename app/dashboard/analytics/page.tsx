'use client';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/precios';
import { TrendingUp, DollarSign, Package, Calendar } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>({ 
    totalPedidos: 0, 
    totalGanancia: 0, 
    totalVentas: 0,
    consolidaciones: [] 
  });
  const [user, setUser] = useState<any>(null);
  const [selectedConsolidacion, setSelectedConsolidacion] = useState<any>(null);
  const [costoReal, setCostoReal] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const u = JSON.parse(userData);
      setUser(u);
      
      fetch(`/api/analytics?userId=${u.id}`)
        .then(r => r.json())
        .then(setData);
    }
  }, []);

  const handleRegistrarPago = async (consolidacionId: string) => {
    if (!costoReal || parseFloat(costoReal) <= 0) {
      alert('Ingresá el costo real del pedido');
      return;
    }

    const res = await fetch('/api/consolidar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        consolidacionId, 
        costoReal: parseFloat(costoReal) 
      }),
    });

    if (res.ok) {
      alert('✅ Pago registrado correctamente');
      setSelectedConsolidacion(null);
      setCostoReal('');
      // Recargar datos
      const userData = localStorage.getItem('user');
      if (userData) {
        const u = JSON.parse(userData);
        fetch(`/api/analytics?userId=${u.id}`)
          .then(r => r.json())
          .then(setData);
      }
    } else {
      alert('❌ Error al registrar pago');
    }
  };

  // Calcular ganancia neta total
  const gananciaNeta = data.consolidaciones
    .filter((c: any) => c.costoReal)
    .reduce((sum: number, c: any) => sum + (c.gananciaNeta || 0), 0);

  const gananciaEstimada = data.consolidaciones
    .filter((c: any) => !c.costoReal)
    .reduce((sum: number, c: any) => sum + c.ganancia, 0);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Analytics</h2>
      
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <Package className="text-nadin-pink" size={24} />
            <p className="text-gray-600 text-sm">Total Pedidos</p>
          </div>
          <p className="text-3xl font-bold text-nadin-pink">{data.totalPedidos}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-blue-600" size={24} />
            <p className="text-gray-600 text-sm">Ventas Totales</p>
          </div>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(data.totalVentas)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-green-600" size={24} />
            <p className="text-gray-600 text-sm">Ganancia Neta</p>
          </div>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(gananciaNeta)}</p>
          {gananciaEstimada > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              + {formatCurrency(gananciaEstimada)} estimada
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="text-purple-600" size={24} />
            <p className="text-gray-600 text-sm">Margen Promedio</p>
          </div>
          <p className="text-3xl font-bold text-purple-600">{user?.margen || 60}%</p>
        </div>
      </div>

      {/* Historial de consolidaciones */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold">Historial de Envíos</h3>
        </div>
        
        <div className="divide-y">
          {data.consolidaciones.length > 0 ? (
            data.consolidaciones.map((cons: any) => (
              <div key={cons.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      {new Date(cons.enviadoAt).toLocaleDateString('es-AR')} · {new Date(cons.enviadoAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="font-semibold text-lg mt-1">{formatCurrency(cons.totalVenta)}</p>
                  </div>
                  {cons.costoReal ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      ✓ Pagado
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      Pendiente pago
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-600">Forma de pago:</p>
                    <p className="font-medium">{cons.formaPago}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Envío:</p>
                    <p className="font-medium">{cons.tipoEnvio}</p>
                  </div>
                  {cons.descuentoTotal > 0 && (
                    <div>
                      <p className="text-gray-600">Descuento:</p>
                      <p className="font-medium text-red-600">-{formatCurrency(cons.descuentoTotal)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Ganancia estimada:</p>
                    <p className="font-medium text-green-600">{formatCurrency(cons.ganancia)}</p>
                  </div>
                </div>

                {/* Sección de registro de pago */}
                {!cons.costoReal ? (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium mb-3">¿Cuánto pagaste a Nadin por este pedido?</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Ingresá el costo real"
                        value={selectedConsolidacion === cons.id ? costoReal : ''}
                        onChange={(e) => {
                          setSelectedConsolidacion(cons.id);
                          setCostoReal(e.target.value);
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <button
                        onClick={() => handleRegistrarPago(cons.id)}
                        className="px-4 py-2 bg-nadin-pink text-white rounded-lg font-semibold hover:bg-nadin-pink-dark"
                      >
                        Registrar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Costo real pagado:</p>
                        <p className="font-bold text-lg">{formatCurrency(cons.costoReal)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Ganancia neta:</p>
                        <p className="font-bold text-lg text-green-600">{formatCurrency(cons.gananciaNeta)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Margen real:</p>
                        <p className="font-bold text-lg text-blue-600">
                          {((cons.gananciaNeta / cons.costoReal) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              <Calendar size={48} className="mx-auto mb-3 opacity-50" />
              <p>No hay envíos en el historial</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}