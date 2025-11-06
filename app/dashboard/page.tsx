'use client';
import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, Lightbulb, Heart } from 'lucide-react';

const FRASES_MOTIVADORAS = [
  {
    tipo: 'motivacion',
    icono: Heart,
    texto: '¡Cada venta es un paso más hacia tus sueños! 💪',
    color: 'text-pink-600'
  },
  {
    tipo: 'motivacion',
    icono: Sparkles,
    texto: 'Tu actitud determina tu éxito. ¡Seguí adelante!',
    color: 'text-purple-600'
  },
  {
    tipo: 'consejo',
    icono: Lightbulb,
    texto: 'Tip: Mostrá los productos más vendidos a tus clientas primero',
    color: 'text-yellow-600'
  },
  {
    tipo: 'consejo',
    icono: TrendingUp,
    texto: 'Consejo: Revisá Analytics semanalmente para conocer tus tendencias',
    color: 'text-blue-600'
  },
  {
    tipo: 'app',
    icono: Lightbulb,
    texto: '¿Sabías que podés consolidar varios pedidos en uno solo?',
    color: 'text-green-600'
  },
  {
    tipo: 'app',
    icono: Sparkles,
    texto: 'Usá los Catálogos Digitales para compartir con tus clientas',
    color: 'text-indigo-600'
  },
  {
    tipo: 'motivacion',
    icono: Heart,
    texto: 'El éxito es la suma de pequeños esfuerzos repetidos día a día',
    color: 'text-red-600'
  },
  {
    tipo: 'consejo',
    icono: TrendingUp,
    texto: 'Ofrecé descuentos en compras por mayor para aumentar tus ventas',
    color: 'text-teal-600'
  },
  {
    tipo: 'app',
    icono: Lightbulb,
    texto: 'Recordá actualizar tu margen en Perfil si cambian tus precios',
    color: 'text-orange-600'
  },
  {
    tipo: 'motivacion',
    icono: Sparkles,
    texto: '¡Cada clienta satisfecha trae 3 más! Cuidá el servicio',
    color: 'text-pink-600'
  },
];

export default function DashboardHome() {
  const [fraseActual, setFraseActual] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Obtener datos del usuario
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Rotar frases cada 8 segundos
    const interval = setInterval(() => {
      setFraseActual((prev) => (prev + 1) % FRASES_MOTIVADORAS.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const frase = FRASES_MOTIVADORAS[fraseActual];
  const IconoFrase = frase.icono;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Banner motivacional */}
      <div className="mb-6 bg-gradient-to-r from-nadin-pink to-pink-400 text-white rounded-xl shadow-lg p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>

        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">
            ¡Hola{user ? ` ${user.name.split(' ')[0]}` : ''}! 👋
          </h2>
          <p className="text-pink-100 text-sm mb-4">
            Bienvenida a tu plataforma de revendedoras Nadin
          </p>

          {/* Frase rotativa */}
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 flex items-start gap-3 animate-fadeIn">
            <IconoFrase size={24} className="flex-shrink-0 mt-0.5" />
            <p className="text-white font-medium leading-relaxed">
              {frase.texto}
            </p>
          </div>

          {/* Indicadores de frases */}
          <div className="flex gap-1.5 mt-4 justify-center">
            {FRASES_MOTIVADORAS.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === fraseActual
                    ? 'w-8 bg-white'
                    : 'w-1.5 bg-white bg-opacity-40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Grid de secciones */}
      <div className="grid grid-cols-2 gap-4">
        <a
          href="/dashboard/catalogo"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 group"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📦</div>
          <h3 className="font-bold text-lg mb-2">Productos</h3>
          <p className="text-gray-600 text-sm">Ver catálogo completo</p>
        </a>

        <a
          href="/dashboard/best-sellers"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 group"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🔥</div>
          <h3 className="font-bold text-lg mb-2">Más Vendidos</h3>
          <p className="text-gray-600 text-sm">Los productos top</p>
        </a>

        <a
          href="/dashboard/pedidos"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 group"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🛍️</div>
          <h3 className="font-bold text-lg mb-2">Mis Pedidos</h3>
          <p className="text-gray-600 text-sm">Gestionar pedidos</p>
        </a>

        <a
          href="/dashboard/consolidar"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 group"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📤</div>
          <h3 className="font-bold text-lg mb-2">Consolidar</h3>
          <p className="text-gray-600 text-sm">Enviar a Nadin</p>
        </a>

        <a
          href="/dashboard/catalogos-digitales"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 group"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📚</div>
          <h3 className="font-bold text-lg mb-2">Catálogos Digitales</h3>
          <p className="text-gray-600 text-sm">Descargar catálogos</p>
        </a>

        <a
          href="/dashboard/analytics"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 group"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📊</div>
          <h3 className="font-bold text-lg mb-2">Analytics</h3>
          <p className="text-gray-600 text-sm">Ver estadísticas</p>
        </a>

        <a
          href="/dashboard/historial"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 group"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📋</div>
          <h3 className="font-bold text-lg mb-2">Historial</h3>
          <p className="text-gray-600 text-sm">Ver historial</p>
        </a>

        <a
          href="/dashboard/perfil"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 group"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">👤</div>
          <h3 className="font-bold text-lg mb-2">Mi Perfil</h3>
          <p className="text-gray-600 text-sm">Configuración</p>
        </a>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
