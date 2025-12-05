// 📦 COMPONENTE: MODAL DE VALIDACIÓN DE STOCK
// Ubicación: components/ModalValidacionStock.tsx

'use client';

import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Plus } from 'lucide-react';

interface ModalValidacionStockProps {
  isOpen: boolean;
  onClose: () => void;
  conStock: any[];
  sinStock: any[];
  onEnviarConDisponibles: () => void;
  onAgregarReemplazos: () => void;
}

export default function ModalValidacionStock({
  isOpen,
  onClose,
  conStock,
  sinStock,
  onEnviarConDisponibles,
  onAgregarReemplazos
}: ModalValidacionStockProps) {
  if (!isOpen) return null;

  const todosDisponibles = sinStock.length === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`p-6 ${todosDisponibles ? 'bg-green-50' : 'bg-yellow-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {todosDisponibles ? (
                <CheckCircle className="text-green-600" size={32} />
              ) : (
                <AlertTriangle className="text-yellow-600" size={32} />
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {todosDisponibles ? '✅ Todo disponible' : '⚠️ Validación de Stock'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {todosDisponibles
                    ? 'Todos los productos tienen stock disponible'
                    : 'Algunos productos no están disponibles'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Productos CON stock */}
          {conStock.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-green-700 mb-3 flex items-center gap-2">
                <CheckCircle size={20} />
                Productos Disponibles ({conStock.length})
              </h3>
              <div className="space-y-2">
                {conStock.map((producto: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-green-50 border border-green-200 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {producto.nombre}
                        </p>
                        <p className="text-sm text-gray-600">
                          {[producto.talle, producto.color].filter(Boolean).join(' - ')}
                        </p>
                        {producto.cliente && (
                          <p className="text-xs text-gray-500 mt-1">
                            Cliente: {producto.cliente}
                            {producto.telefono && ` - Tel: ${producto.telefono}`}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-700">
                          ✅ x{producto.cantidad}
                        </p>
                        <p className="text-xs text-gray-500">
                          Stock: {producto.stockActual}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Productos SIN stock */}
          {sinStock.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-red-700 mb-3 flex items-center gap-2">
                <AlertTriangle size={20} />
                Productos No Disponibles ({sinStock.length})
              </h3>
              <div className="space-y-2">
                {sinStock.map((producto: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-red-50 border border-red-200 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {producto.nombre}
                        </p>
                        <p className="text-sm text-gray-600">
                          {[producto.talle, producto.color].filter(Boolean).join(' - ')}
                        </p>
                        {producto.cliente && (
                          <p className="text-xs text-gray-500 mt-1">
                            Cliente: {producto.cliente}
                            {producto.telefono && ` - Tel: ${producto.telefono}`}
                          </p>
                        )}
                        <p className="text-xs text-red-600 font-medium mt-1">
                          {producto.mensaje}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-700">
                          ❌ x{producto.cantidad}
                        </p>
                        <p className="text-xs text-gray-500">
                          Stock: {producto.stockActual}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            {todosDisponibles ? (
              <>
                <button
                  onClick={onEnviarConDisponibles}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  ✅ Enviar Pedido ({conStock.length} productos)
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onEnviarConDisponibles}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Enviar con lo disponible ({conStock.length})
                </button>
                <button
                  onClick={onAgregarReemplazos}
                  className="flex-1 bg-nadin-pink hover:bg-nadin-pink-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Agregar Reemplazos
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>

          {!todosDisponibles && (
            <p className="text-xs text-gray-500 text-center mt-3">
              💡 Tip: Podés agregar productos reemplazos y volver a validar el stock
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
