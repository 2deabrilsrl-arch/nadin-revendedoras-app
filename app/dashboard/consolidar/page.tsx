'use client';
import { useState, useEffect } from 'react';
import BackToHomeButton from '@/components/BackToHomeButton';

export default function ConsolidarPage() {
  const [formaPago, setFormaPago] = useState('');
  const [tipoEnvio, setTipoEnvio] = useState('');
  const [transporte, setTransporte] = useState('');
  const [descuentoTotal, setDescuentoTotal] = useState(0);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [selectedPedidos, setSelectedPedidos] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = (globalThis as any).localStorage?.getItem('user');
    if (userData) {
      const u = JSON.parse(userData);
      setUser(u);
      
      // Cargar pedidos pendientes
      fetch(`/api/pedidos?userId=${u.id}`)
        .then(r => r.json())
        .then((data: any) => {
          // @ts-ignore - data es array de pedidos
          const pendientes = data.filter((p: any) => p.estado === 'pendiente');
          setPedidos(pendientes);
        });
    }
  }, []);

  const handleConsolidar = async () => {
    if (selectedPedidos.length === 0) {
      (globalThis as any).alert?.('Seleccioná al menos un pedido');
      return;
    }
    if (!formaPago) {
      (globalThis as any).alert?.('Seleccioná forma de pago');
      return;
    }
    if (!tipoEnvio) {
      (globalThis as any).alert?.('Seleccioná tipo de envío');
      return;
    }
    if (tipoEnvio === 'Cadete a Transporte' && !transporte.trim()) {
      (globalThis as any).alert?.('Completá el nombre del transporte');
      return;
    }

    const res = await fetch('/api/consolidar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: user.id, 
        pedidoIds: selectedPedidos, 
        formaPago, 
        tipoEnvio, 
        transporteNombre: transporte,
        descuentoTotal
      }),
    });

    if (res.ok) {
      (globalThis as any).alert?.('✅ Pedidos consolidados y enviados a Nadin!');
      setSelectedPedidos([]);
      setFormaPago('');
      setTipoEnvio('');
      setTransporte('');
      setDescuentoTotal(0);
      // Recargar pedidos
      // @ts-ignore - window is available in client components
      window.location.reload();
    } else {
      (globalThis as any).alert?.('❌ Error al consolidar pedidos');
    }
  };

  const totales = pedidos
    .filter(p => selectedPedidos.includes(p.id))
    .reduce((acc, p) => {
      p.lineas.forEach((l: any) => {
        acc.venta += l.venta * l.qty;
        acc.mayorista += l.mayorista * l.qty;
      });
      return acc;
    }, { venta: 0, mayorista: 0 });

  const totalConDescuento = totales.venta - descuentoTotal;
  const ganancia = totalConDescuento - totales.mayorista;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <BackToHomeButton />
      <h2 className="text-2xl font-bold mb-4">Consolidar Pedidos</h2>
      
      {pedidos.length > 0 ? (
        <>
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h3 className="font-semibold mb-3">Seleccioná pedidos:</h3>
            <div className="space-y-2">
              {pedidos.map(pedido => {
                const total = pedido.lineas.reduce((sum: number, l: any) => sum + (l.venta * l.qty), 0);
                const isSelected = selectedPedidos.includes(pedido.id);
                
                return (
                  <label 
                    key={pedido.id}
                    className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer ${
                      isSelected ? 'border-nadin-pink bg-pink-50' : 'border-gray-200'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPedidos([...selectedPedidos, pedido.id]);
                        } else {
                          setSelectedPedidos(selectedPedidos.filter(id => id !== pedido.id));
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{pedido.cliente}</p>
                      <p className="text-sm text-gray-600">
                        {pedido.lineas.length} productos · ${total.toLocaleString('es-AR')}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {selectedPedidos.length > 0 && (
            <>
              {/* Resumen de totales */}
              <div className="bg-white rounded-lg shadow p-4 mb-4">
                <h3 className="font-semibold mb-3">Resumen:</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total venta:</span>
                    <span className="font-semibold">${totales.venta.toLocaleString('es-AR')}</span>
                  </div>
                  
                  {/* Campo de descuento */}
                  <div className="flex justify-between items-center border-t pt-2">
                    <span>Descuento a clienta:</span>
                    <input 
                      type="number"
                      value={descuentoTotal}
                      onChange={(e) => setDescuentoTotal(Number(e.target.value))}
                      placeholder="0"
                      className="w-32 px-3 py-1 border rounded text-right"
                      min="0"
                    />
                  </div>

                  {descuentoTotal > 0 && (
                    <div className="flex justify-between text-lg font-bold text-nadin-pink">
                      <span>Total con descuento:</span>
                      <span>${totalConDescuento.toLocaleString('es-AR')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">
                    <span>Costo mayorista:</span>
                    <span>${totales.mayorista.toLocaleString('es-AR')}</span>
                  </div>

                  <div className="flex justify-between text-lg font-bold text-green-600">
                    <span>Tu ganancia estimada:</span>
                    <span>${ganancia.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </div>

              {/* Formulario de envío */}
              <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <h3 className="font-semibold">Datos del envío:</h3>
                
                <div>
                  <label className="block font-medium mb-2 text-sm">Forma de pago *</label>
                  <select
                    value={formaPago}
                    onChange={(e) => setFormaPago((e.target as any).value)}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Seleccionar...</option>
                    <option>Efectivo</option>
                    <option>Mercado Pago</option>
                    <option>Transferencia Bancaria</option>
                    <option>Tarjeta de Crédito</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-2 text-sm">Tipo de envío *</label>
                  <select
                    value={tipoEnvio}
                    onChange={(e) => {
                      setTipoEnvio((e.target as any).value);
                      if (e.target.value !== 'Cadete a Transporte') {
                        setTransporte('');
                      }
                    }}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Seleccionar...</option>
                    <option>Retiro en el Local</option>
                    <option>Enviar por Correo Argentino</option>
                    <option value="Cadete a Transporte">Cadete a Transporte</option>
                  </select>
                </div>

                {tipoEnvio === 'Cadete a Transporte' && (
                  <div>
                    <label className="block font-medium mb-2 text-sm">Nombre del transporte *</label>
                    <input
                      type="text"
                      value={transporte}
                      onChange={(e) => setTransporte((e.target as any).value)}
                      placeholder="Completar nombre de Transporte a enviar"
                      className="w-full p-3 border rounded-lg"
                    />
                  </div>
                )}

                <button
                  onClick={handleConsolidar}
                  className="w-full bg-nadin-pink text-white py-3 rounded-lg font-bold hover:bg-nadin-pink-dark flex items-center justify-center gap-2"
                >
                  <span>📧</span>
                  Enviar {selectedPedidos.length} pedido(s) a Nadin
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No hay pedidos pendientes para consolidar</p>
        </div>
      )}
    </div>
  );
}
