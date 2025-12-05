// PÁGINA: Pedido Finalizado
// Ubicacion: app/pedido-finalizado/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle, Mail, ArrowLeft } from 'lucide-react';

export default function PedidoFinalizadoPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Icono */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pedido Finalizado
          </h1>
          <p className="text-gray-600">
            Tu pedido ya fue enviado exitosamente
          </p>
        </div>

        {/* Contenido */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            Este pedido consolidado ya pasó por todas las etapas:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-blue-700">
            <li>✅ Armado</li>
            <li>✅ Pagado</li>
            <li>✅ Enviado / Retirado</li>
          </ul>
        </div>

        {/* Contacto */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 mb-3">
            <strong>¿Tenés alguna consulta o reclamo?</strong>
          </p>
          
          <a
            href="mailto:nadinlenceria@gmail.com"
            className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium"
          >
            <Mail size={20} />
            <span>nadinlenceria@gmail.com</span>
          </a>
        </div>

        {/* Botón volver */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft size={20} />
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}
