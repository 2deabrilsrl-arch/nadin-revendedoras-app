'use client';
import { useState } from 'react';
import Image from 'next/image';

export default function RecuperarPage() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // TODO: Implementar envío de email de recuperación
      // Por ahora solo simulamos
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEnviado(true);
    } catch (err) {
      setError('Error al enviar el email. Intenta nuevamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-nadin-pink to-nadin-pink-dark flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="https://res.cloudinary.com/ddxd6ha6q/image/upload/v1762132027/LOGO_NADIN_-_copia_aefdz4.png" 
            alt="Nadin" 
            className="h-20 mx-auto mb-4" 
          />
          <h1 className="text-2xl font-bold text-gray-800">Recuperar Contraseña</h1>
          <p className="text-gray-600 mt-2">
            {enviado 
              ? 'Revisa tu email' 
              : 'Ingresa tu email para recibir instrucciones'
            }
          </p>
        </div>

        {enviado ? (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                📧 Te enviamos un email con instrucciones para recuperar tu contraseña.
              </p>
            </div>
            <a 
              href="/login" 
              className="text-nadin-pink font-bold hover:underline"
            >
              Volver al login
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail((e.target as any).value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
                placeholder="tu@email.com"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-nadin-pink text-white py-3 rounded-lg font-bold hover:bg-nadin-pink-dark transition-colors"
            >
              Enviar instrucciones
            </button>

            <div className="text-center">
              <a 
                href="/login" 
                className="text-sm text-gray-600 hover:text-nadin-pink"
              >
                ← Volver al login
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
