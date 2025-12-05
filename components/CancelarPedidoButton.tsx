'use client';

import { useState } from 'react';

interface CancelarPedidoButtonProps {
  pedidoId: string;
  onCancel?: () => void;
}

export default function CancelarPedidoButton({ pedidoId, onCancel }: CancelarPedidoButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCancel = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/pedidos/update-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: pedidoId,
          estado: 'cancelado'
        })
      });

      if (!response.ok) {
        throw new Error('Error al cancelar pedido');
      }

      const data = await response.json() as any;
      console.log('Pedido cancelado:', data);

      (globalThis as any).alert?.('✅ Pedido cancelado correctamente');
      
      if (onCancel) {
        onCancel();
      }

      // Recargar la página para reflejar cambios
      (globalThis as any).window?.location?.reload();

    } catch (error) {
      console.error('Error:', error);
      (globalThis as any).alert?.('❌ Error al cancelar el pedido');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold mb-2">¿Cancelar pedido?</h3>
          <p className="text-gray-600 mb-4">
            Esta acción marcará el pedido como cancelado. El pedido no contará para la gamificación ni estadísticas.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              No, volver
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Cancelando...' : 'Sí, cancelar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm"
      disabled={loading}
    >
      Cancelar pedido
    </button>
  );
}
