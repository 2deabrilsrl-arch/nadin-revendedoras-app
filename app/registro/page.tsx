'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function RegistroPage() {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    dni: '', 
    telefono: '', 
    handle: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          dni: formData.dni,
          telefono: formData.telefono,
          handle: formData.handle
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('✅ Registro exitoso! Ahora podés iniciar sesión');
        router.push('/login');
      } else {
        setError(data.error || 'Error en el registro');
      }
    } catch (error) {
      setError('Error de conexión. Intentá de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-nadin-pink to-nadin-pink-dark flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <img 
            src="https://res.cloudinary.com/ddxd6ha6q/image/upload/v1762132027/LOGO_NADIN_-_copia_aefdz4.png" 
            alt="Nadin" 
            className="h-16 mx-auto mb-4" 
          />
          <h1 className="text-2xl font-bold text-center mb-2">Crear cuenta</h1>
          <p className="text-gray-600 text-sm">Registrate para empezar a vender</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input 
              type="text" 
              placeholder="Nombre completo *" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent" 
              required 
            />
          </div>

          <div>
            <input 
              type="email" 
              placeholder="Email *" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent" 
              required 
            />
          </div>

          <div>
            <input 
              type="text" 
              placeholder="DNI *" 
              value={formData.dni} 
              onChange={(e) => setFormData({...formData, dni: e.target.value})} 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent" 
              required 
            />
          </div>

          <div>
            <input 
              type="tel" 
              placeholder="Teléfono *" 
              value={formData.telefono} 
              onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent" 
              required 
            />
          </div>

          <div>
            <input 
              type="text" 
              placeholder="Handle (ej: vicky) *" 
              value={formData.handle} 
              onChange={(e) => setFormData({...formData, handle: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})} 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent" 
              required 
            />
            <p className="text-xs text-gray-500 mt-1">Tu link será: nadin.app/{formData.handle || 'tuhandle'}</p>
          </div>

          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña (mínimo 6 caracteres) *" 
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent pr-10" 
              required 
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <input 
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirmar contraseña *" 
              value={formData.confirmPassword} 
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent pr-10" 
              required 
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button 
            type="submit" 
            className="w-full bg-nadin-pink text-white py-3 rounded-lg font-bold hover:bg-nadin-pink-dark transition-colors"
          >
            Registrarme
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          ¿Ya tenés cuenta? <a href="/login" className="text-nadin-pink font-bold hover:underline">Ingresá</a>
        </p>
      </div>
    </div>
  );
}