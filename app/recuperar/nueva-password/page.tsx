'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

function NuevaPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setError('Link inválido o expirado');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token,
          newPassword: password,
        }),
      });

      const data = await res.json() as any;

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'Error al cambiar la contraseña');
      }
    } catch (err) {
      setError('Error de conexión. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">¡Contraseña Actualizada!</h1>
        <p className="text-gray-600 mb-4">
          Tu contraseña ha sido cambiada exitosamente.
        </p>
        <p className="text-sm text-gray-500">
          Redirigiendo al login en 3 segundos...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <img
          src="https://res.cloudinary.com/ddxd6ha6q/image/upload/v1762132027/LOGO_NADIN_-_copia_aefdz4.png"
          alt="Nadin"
          className="h-20 mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-gray-800">Nueva Contraseña</h1>
        <p className="text-gray-600 mt-2">
          Ingresá tu nueva contraseña
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nueva Contraseña
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword((e.target as any).value)}
            placeholder="Mínimo 6 caracteres"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent pr-10"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-11 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirmar Contraseña
          </label>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword((e.target as any).value)}
            placeholder="Ingresá la misma contraseña"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-11 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !token || !email}
          className="w-full bg-nadin-pink text-white py-3 rounded-lg font-bold hover:bg-nadin-pink-dark transition-colors disabled:opacity-50"
        >
          {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
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
    </div>
  );
}

export default function NuevaPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-nadin-pink to-nadin-pink-dark flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      }>
        <NuevaPasswordForm />
      </Suspense>
    </div>
  );
}
