// LAYOUT ÚNICO VENDEDORA - Header + Menú Lateral
// Ubicación: app/admin/layout.tsx (REEMPLAZAR)

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Package,
  DollarSign,
  Truck,
  MessageSquare,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import NotificacionesVendedora from '@/components/NotificacionesVendedora';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [badges, setBadges] = useState({
    armado: 0,
    pago: 0,
    entrega: 0
  });

  useEffect(() => {
    const userData = (globalThis as any).localStorage?.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      if (parsedUser.rol !== 'vendedora') {
        if ((globalThis as any).window?.location) {
          (globalThis as any).window.location.href = '/dashboard';
        }
      }
    } else {
      if ((globalThis as any).window?.location) {
        (globalThis as any).window.location.href = '/login';
      }
    }
  }, []);

  useEffect(() => {
    cargarBadges();
    const interval = setInterval(cargarBadges, 30000);
    return () => clearInterval(interval);
  }, []);

  const cargarBadges = async () => {
    try {
      const [resArmado, resPago, resEntrega] = await Promise.all([
        fetch('/api/admin/consolidaciones?pendientesArmado=true'),
        fetch('/api/admin/consolidaciones?pendientesPago=true'),
        fetch('/api/admin/consolidaciones?pendientesEntrega=true')
      ]);

      const [dataArmado, dataPago, dataEntrega] = await Promise.all([
        resArmado.json(),
        resPago.json(),
        resEntrega.json()
      ]);

      setBadges({
        armado: (dataArmado as any).consolidaciones?.length || 0,
        pago: (dataPago as any).consolidaciones?.length || 0,
        entrega: (dataEntrega as any).consolidaciones?.length || 0
      });
    } catch (error) {
      console.error('Error cargando badges:', error);
    }
  };

  const handleLogout = () => {
    (globalThis as any).localStorage?.removeItem('user');
    router.push('/login');
  };

  const menuItems = [
    { 
      href: '/admin/pendientes-armado', 
      label: 'Pendientes de Armado', 
      icon: Package, 
      emoji: '📦',
      badge: badges.armado,
      badgeColor: 'bg-yellow-500'
    },
    { 
      href: '/admin/pendientes-pago', 
      label: 'Pendientes de Pago', 
      icon: DollarSign, 
      emoji: '💰',
      badge: badges.pago,
      badgeColor: 'bg-orange-500'
    },
    { 
      href: '/admin/pendientes-entrega', 
      label: 'Pendientes de Entrega', 
      icon: Truck, 
      emoji: '🚚',
      badge: badges.entrega,
      badgeColor: 'bg-blue-500'
    },
    { 
      href: '/admin/conversaciones', 
      label: 'Backup Chats', 
      icon: MessageSquare, 
      emoji: '💬',
      badge: null
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href);
  };

  if (!user || user.rol !== 'vendedora') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Único */}
      <header className="bg-gradient-to-r from-pink-500 to-pink-400 text-white shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          {/* Botón Menú */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
            <span className="text-sm font-medium">Menú Admin</span>
          </button>

          {/* Logo y Título (centrado en móvil) */}
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <span className="text-2xl">💗</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold">Panel Vendedora - Nadin</h1>
              <p className="text-xs opacity-90">Administrador</p>
            </div>
          </div>
          
          {/* Notificaciones + Salir */}
          <div className="flex items-center gap-3">
            <NotificacionesVendedora />

            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-pink-100">Administrador</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut size={20} />
              <span className="hidden sm:inline text-sm">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Menú Lateral */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setMenuOpen(false)}
          />
          
          <aside className="fixed left-0 top-0 w-72 h-screen bg-white z-50 overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-pink-500 to-pink-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg">
                    <span className="text-2xl">💗</span>
                  </div>
                  <div className="text-white">
                    <h2 className="font-bold text-lg">Nadin Admin</h2>
                    <p className="text-xs text-pink-100">{user.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <nav className="p-4">
              <div className="space-y-1">
                {menuItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'bg-pink-500 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.emoji}</span>
                        {item.label}
                      </div>
                      
                      {/* Badge con número */}
                      {item.badge !== null && item.badge > 0 && (
                        <span className={`${item.badgeColor} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full"
                >
                  <LogOut size={18} />
                  Cerrar Sesión
                </button>
              </div>
            </nav>
          </aside>
        </>
      )}

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
