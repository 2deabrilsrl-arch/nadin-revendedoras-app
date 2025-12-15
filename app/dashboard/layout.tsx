// Layout Revendedora - CON LINK AL CHAT
// Ubicacion: app/dashboard/layout.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  ShoppingCart, 
  TrendingUp,
  Package, 
  PackageCheck,
  Trophy,
  BarChart3,
  BookOpen,
  LineChart,
  History,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  MessageCircle
} from 'lucide-react';
import NotificacionesRevendedora from '@/components/NotificacionesRevendedora';
import FloatingCart from '@/components/FloatingCart';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const userData = (globalThis as any).localStorage?.getItem('user');
    if (userData) {
      const u = JSON.parse(userData);
      setUser(u);
      
      if (u.rol === 'vendedora') {
        router.push('/admin/dashboard');
        return;
      }
    } else {
      router.push('/login');
      return;
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof (globalThis as any).window !== 'undefined') {
      (globalThis as any).localStorage?.removeItem('user');
    }
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  const menuItems = [
    { href: '/dashboard', icon: Home, label: 'Inicio', emoji: '🏠' },
    { href: '/dashboard/catalogo', icon: ShoppingCart, label: 'Productos', emoji: '🛍️' },
    { href: '/dashboard/best-sellers', icon: TrendingUp, label: 'Mas Vendidos', emoji: '⭐' },
    { href: '/dashboard/pedidos', icon: Package, label: 'Mis Pedidos', emoji: '📦' },
    { href: '/dashboard/consolidar', icon: PackageCheck, label: 'Consolidar', emoji: '📮' },
    { href: '/dashboard/chat', icon: MessageCircle, label: 'Chat con Nadin', emoji: '💬' }, // 🆕 NUEVO
    { href: '/dashboard/notificaciones', icon: Bell, label: 'Notificaciones', emoji: '🔔' },
    { href: '/dashboard/logros', icon: Trophy, label: 'Mis Logros', emoji: '🏆' },
    { href: '/dashboard/ranking', icon: BarChart3, label: 'Ranking', emoji: '📊' },
    { href: '/dashboard/catalogos-digitales', icon: BookOpen, label: 'Catalogos Digitales', emoji: '📱' },
    { href: '/dashboard/analytics', icon: LineChart, label: 'Analytics', emoji: '📈' },
    { href: '/dashboard/historial', icon: History, label: 'Historial', emoji: '📋' },
    { href: '/dashboard/perfil', icon: User, label: 'Mi Perfil', emoji: '👤' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-500 to-pink-400 text-white shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          {/* Boton menu */}
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {menuAbierto ? <X size={24} /> : <Menu size={24} />}
            <span className="text-sm font-medium">Menu</span>
          </button>

          {/* Notificaciones + Info Usuario + Salir */}
          <div className="flex items-center gap-3">
            {user.id && <NotificacionesRevendedora userId={user.id} />}

            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-pink-100">Revendedora</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Cerrar Sesion"
            >
              <LogOut size={20} />
              <span className="hidden sm:inline text-sm">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      {menuAbierto && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setMenuAbierto(false)}
          />
          
          <aside className="fixed left-0 top-0 w-72 h-screen bg-white z-50 overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-pink-500 to-pink-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg">
                    <span className="text-2xl">👗</span>
                  </div>
                  <div className="text-white">
                    <h2 className="font-bold text-lg">Nadin Revendedoras</h2>
                    <p className="text-xs text-pink-100">{user.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMenuAbierto(false)}
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
                      onClick={() => setMenuAbierto(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'bg-pink-500 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-lg">{item.emoji}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setMenuAbierto(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full"
                >
                  <LogOut size={18} />
                  Cerrar Sesion
                </button>
              </div>
            </nav>
          </aside>
        </>
      )}

      {/* Contenido */}
      <main className="min-h-screen p-6">
        {children}
      </main>

      {/* FLOATING CART - Boton flotante con panel lateral */}
      <FloatingCart />
    </div>
  );
}
