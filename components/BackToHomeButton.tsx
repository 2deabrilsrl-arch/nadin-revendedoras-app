'use client';
import { Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BackToHomeButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/dashboard')}
      className="fixed top-4 right-4 z-50 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-2 shadow-md transition-all hover:shadow-lg"
    >
      <Home size={20} className="text-nadin-pink" />
      <span className="hidden sm:inline text-sm font-medium">Inicio</span>
    </button>
  );
}
