'use client';
import { useState } from 'react';
import { Menu, Home, User, ShoppingCart, Send, TrendingUp, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-nadin-pink text-white p-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowMenu(!showMenu)}>
            <Menu size={24} />
          </button>
          <h1 className="font-bold text-lg">Nadin Lencería</h1>
        </div>
      </header>

      {showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMenu(false)}>
          <div 
            className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-nadin-pink text-white">
              <h2 className="font-bold text-xl">Menú</h2>
            </div>
            
            <nav className="p-2">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <Home size={20} className="text-nadin-pink" />
                <span className="font-medium">Inicio</span>
              </Link>

              <Link 
                href="/dashboard/catalogo" 
                className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <ShoppingCart size={20} className="text-nadin-pink" />
                <span className="font-medium">Productos</span>
              </Link>

              <Link 
                href="/dashboard/catalogos-digitales" 
                className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <BookOpen size={20} className="text-nadin-pink" />
                <span className="font-medium">Catálogos Digitales</span>
              </Link>

              <Link 
                href="/dashboard/pedidos" 
                className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <ShoppingCart size={20} className="text-nadin-pink" />
                <span className="font-medium">Mis Pedidos</span>
              </Link>

              <Link 
                href="/dashboard/consolidar" 
                className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <Send size={20} className="text-nadin-pink" />
                <span className="font-medium">Consolidar</span>
              </Link>

              <Link 
                href="/dashboard/analytics" 
                className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <TrendingUp size={20} className="text-nadin-pink" />
                <span className="font-medium">Analytics</span>
              </Link>

              <Link 
                href="/dashboard/historial" 
                className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <Clock size={20} className="text-nadin-pink" />
                <span className="font-medium">Historial</span>
              </Link>

              <Link 
                href="/dashboard/perfil" 
                className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <User size={20} className="text-nadin-pink" />
                <span className="font-medium">Mi Perfil</span>
              </Link>
            </nav>
          </div>
        </div>
      )}

      <main>{children}</main>
    </div>
  );
}
