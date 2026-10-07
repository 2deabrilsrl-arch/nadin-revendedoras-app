// Layout de la revendedora: todo gira alrededor de "Mi Tienda".
// Compu: barra lateral fija a la izquierda. Celular: el mismo menú en un panel.
// Arriba de cada pantalla: título de la sección + botón "¿Cómo funciona?".
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Menu, X, ExternalLink } from 'lucide-react';
import NotificacionesRevendedora from '@/components/NotificacionesRevendedora';
import FloatingCart from '@/components/FloatingCart';
import AyudaSeccion from '@/components/AyudaSeccion';
import { MENU, itemActual } from '@/lib/menu-revendedora';

function MenuLateral({ onNavegar }: { onNavegar?: () => void }) {
  const pathname = usePathname();
  const tab = useSearchParams()?.get('tab') || null;
  const actual = itemActual(pathname || '', tab);
  return (
    <nav className="space-y-4 p-3" aria-label="Menú principal">
      {MENU.map((g, gi) => (
        <div key={gi}>
          {g.titulo && <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{g.titulo}</p>}
          <ul className="space-y-0.5">
            {g.items.map((x) => {
              const Icono = x.icon;
              const activo = actual?.id === x.id;
              return (
                <li key={x.id}>
                  <Link
                    href={x.href}
                    onClick={onNavegar}
                    aria-current={activo ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${activo ? 'bg-pink-50 text-pink-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <Icono className={`h-4 w-4 shrink-0 ${activo ? 'text-pink-600' : 'text-gray-400'}`} />
                    {x.label}
                  </Link>
                </li>
              );
            })}
            {g.titulo === 'Mi tienda' && (
              <li>
                <a href="/dashboard/mi-tienda/ver" target="_blank" rel="noopener" onClick={onNavegar} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                  <ExternalLink className="h-4 w-4 shrink-0 text-gray-400" /> Ver mi tienda
                </a>
              </li>
            )}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function BarraSeccion() {
  const pathname = usePathname();
  const tab = useSearchParams()?.get('tab') || null;
  const actual = itemActual(pathname || '', tab);
  if (!actual) return null;
  return (
    <div className="mx-auto mb-4 flex max-w-5xl items-center justify-between gap-3">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{actual.label}</h1>
      <AyudaSeccion id={actual.id} />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
    }
  }, [router]);

  // Cierra el menú del celular al cambiar de pantalla
  useEffect(() => { setMenuAbierto(false); }, [pathname]);

  const handleLogout = () => {
    (globalThis as any).localStorage?.removeItem('user');
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Encabezado */}
      <header className="sticky top-0 z-50 h-16 bg-gradient-to-r from-pink-500 to-pink-400 text-white shadow">
        <div className="flex h-full items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="flex items-center gap-2 rounded-lg p-2 hover:bg-white/10 lg:hidden"
              aria-label="Abrir menú"
            >
              {menuAbierto ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link href="/dashboard/mi-tienda" className="flex items-center gap-2 font-bold">
              <span className="rounded-lg bg-white px-1.5 py-0.5 text-lg">🛍️</span>
              <span className="leading-tight">Mi Tienda <span className="font-normal opacity-90">· Nadin</span></span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {user.id && <NotificacionesRevendedora userId={user.id} />}
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-pink-100">Revendedora</p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg p-2 hover:bg-white/10" title="Cerrar sesión">
              <LogOut size={20} />
              <span className="hidden text-sm sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Compu: barra lateral fija */}
      <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-60 overflow-y-auto border-r border-gray-200 bg-white lg:block">
        <Suspense fallback={null}><MenuLateral /></Suspense>
      </aside>

      {/* Celular: menú en panel */}
      {menuAbierto && (
        <>
          <div className="fixed inset-0 top-16 z-40 bg-black/40 lg:hidden" onClick={() => setMenuAbierto(false)} />
          <aside className="fixed bottom-0 left-0 top-16 z-40 w-72 overflow-y-auto bg-white shadow-2xl lg:hidden">
            <Suspense fallback={null}><MenuLateral onNavegar={() => setMenuAbierto(false)} /></Suspense>
            <div className="border-t border-gray-200 p-3">
              <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                <LogOut size={16} /> Cerrar sesión
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Contenido */}
      <main className="min-h-screen p-4 sm:p-6 lg:pl-[calc(15rem+1.5rem)]">
        <Suspense fallback={null}><BarraSeccion /></Suspense>
        {children}
      </main>

      <FloatingCart />
    </div>
  );
}
