'use client';
import { useState, useEffect } from 'react';
import { User, DollarSign, CreditCard } from 'lucide-react';

export default function PerfilPage() {
  const [margen, setMargen] = useState(60);
  const [cbu, setCbu] = useState('');
  const [alias, setAlias] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Cargar datos del usuario desde localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setMargen(userData.margen || 60);
      setCbu(userData.cbu || '');
      setAlias(userData.alias || '');
    }
  }, []);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage('');

    try {
      // Actualizar en el servidor
      const res = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          margen,
          cbu,
          alias
        })
      });

      if (res.ok) {
        // Actualizar localStorage
        const updatedUser = { ...user, margen, cbu, alias };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setMessage('✅ Cambios guardados correctamente');
      } else {
        setMessage('❌ Error al guardar cambios');
      }
    } catch (error) {
      console.error('Error guardando perfil:', error);
      setMessage('❌ Error al guardar cambios');
    } finally {
      setSaving(false);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const precioEjemplo = 10000;
  const precioConMargen = Math.round((precioEjemplo * (1 + margen / 100)) / 50) * 50;
  const gananciaEjemplo = precioConMargen - precioEjemplo;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <User className="text-nadin-pink" />
          Mi Perfil
        </h2>
        <p className="text-gray-600">Configura tu información de revendedora</p>
      </div>

      {user && (
        <div className="bg-gradient-to-r from-nadin-pink to-nadin-pink-dark text-white rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <User className="text-nadin-pink" size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold">{user.name}</h3>
              <p className="text-white/80">@{user.handle}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/70">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-white/70">Teléfono</p>
              <p className="font-medium">{user.telefono}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        {/* Margen de ganancia */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="text-nadin-pink" size={20} />
            <label className="block font-bold text-gray-800">
              Margen de Ganancia
            </label>
          </div>
          
          <input
            type="range"
            min="0"
            max="150"
            value={margen}
            onChange={(e) => setMargen(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-nadin-pink"
          />
          
          <div className="flex justify-between items-center mt-2">
            <span className="text-3xl font-bold text-nadin-pink">{margen}%</span>
            <span className="text-sm text-gray-500">0% - 150%</span>
          </div>

          {/* Ejemplo de cálculo */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">📊 Ejemplo:</p>
            <div className="space-y-1 text-sm text-blue-800">
              <p>Precio mayorista: <span className="font-bold">${precioEjemplo.toLocaleString()}</span></p>
              <p>Tu precio de venta: <span className="font-bold text-nadin-pink">${precioConMargen.toLocaleString()}</span></p>
              <p>Tu ganancia: <span className="font-bold text-green-600">${gananciaEjemplo.toLocaleString()}</span></p>
            </div>
          </div>
        </div>

        <hr />

        {/* Datos bancarios */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="text-nadin-pink" size={20} />
            <label className="block font-bold text-gray-800">
              Datos Bancarios
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CBU
              </label>
              <input
                type="text"
                value={cbu}
                onChange={(e) => setCbu(e.target.value)}
                placeholder="0000000000000000000000"
                maxLength={22}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">22 dígitos</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alias
              </label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="tu.alias.mp"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nadin-pink focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Mensaje de estado */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes('✅') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Botón guardar */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-nadin-pink text-white py-3 rounded-lg font-bold hover:bg-nadin-pink-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
