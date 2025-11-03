'use client';
import { useEffect, useState } from 'react';

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    fetch('/api/pedidos?userId=USER_ID').then(r => r.json()).then(setPedidos);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Mis Pedidos</h2>
      <div className="space-y-3">
        {pedidos.map((pedido: any) => (
          <div key={pedido.id} className="bg-white rounded-lg shadow p-4">
            <p className="font-bold">{pedido.cliente}</p>
            <p className="text-sm text-gray-600">{pedido.lineas.length} productos</p>
          </div>
        ))}
      </div>
    </div>
  );
}
