'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, Home, User, ShoppingCart, Send, TrendingUp, Clock, Award } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-nadin-pink text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowMenu(!showMenu)}><Menu size={24} /></button>
          <h1 className="font-bold">Nadin Lencería</h1>
        </div>
      </header>
      {showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMenu(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <nav className="space-y-2">
              <Link href="/dashboard" className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded"><Home size={20} /> Inicio</Link>
              <Link href="/dashboard/catalogo" className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded"><ShoppingCart size={20} /> Catálogo</Link>
              <Link href="/dashboard/pedidos" className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded"><ShoppingCart size={20} /> Pedidos</Link>
              <Link href="/dashboard/consolidar" className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded"><Send size={20} /> Consolidar</Link>
              <Link href="/dashboard/analytics" className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded"><TrendingUp size={20} /> Analytics</Link>
              <Link href="/dashboard/best-sellers" className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded"><Award size={20} /> Best Sellers</Link>
              <Link href="/dashboard/historial" className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded"><Clock size={20} /> Historial</Link>
              <Link href="/dashboard/perfil" className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded"><User size={20} /> Perfil</Link>
            </nav>
          </div>
        </div>
      )}
      <main>{children}</main>
    </div>
  );
}
