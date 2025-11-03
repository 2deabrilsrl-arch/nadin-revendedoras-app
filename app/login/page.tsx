'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Guardar sesión en localStorage
        localStorage.setItem('user', JSON.stringify(data));
        router.push('/dashboard');
      } else {
        setError('Email o contraseña incorrectos');
      }
    } catch (error) {
      setError('Error de conexión. Intentá de nuevo.');
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
          <h1 className="text-2xl font-bold text-gray-800">Bienvenida</h1>
          <p className="text-gray-600">Ingresá a tu cuenta</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent" 
            required 
          />
          
          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent pr-10" 
              required 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="text-right">
            <a href="/recuperar-password" className="text-sm text-nadin-pink hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button 
            type="submit" 
            className="w-full bg-nadin-pink text-white py-3 rounded-lg font-bold hover:bg-nadin-pink-dark transition-colors"
          >
            Ingresar
          </button>
        </form>

        <p className="text-center mt-6 text-sm">
          ¿No tenés cuenta? <a href="/registro" className="text-nadin-pink font-bold hover:underline">Registrate</a>
        </p>
      </div>
    </div>
  );
}