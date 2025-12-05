'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthWrapperProps {
  children: React.ReactNode;
  allowedRole?: 'revendedora' | 'vendedora';
}

export default function AuthWrapper({ children, allowedRole = 'revendedora' }: AuthWrapperProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('user');
        
        if (!userData) {
          // No hay usuario, redirigir al login
          router.replace('/login');
          return;
        }

        const user = JSON.parse(userData);
        
        // Verificar rol
        if (allowedRole === 'revendedora' && user.rol === 'vendedora') {
          // Es admin pero está en dashboard de revendedora
          router.replace('/admin/dashboard');
          return;
        }
        
        if (allowedRole === 'vendedora' && user.rol !== 'vendedora') {
          // No es admin pero está en dashboard admin
          router.replace('/dashboard');
          return;
        }

        // Todo OK, autorizado
        setIsAuthorized(true);
        setIsChecking(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.replace('/login');
      }
    };

    // Pequeño delay para evitar hydration mismatch
    const timer = setTimeout(checkAuth, 50);
    return () => clearTimeout(timer);
  }, [router, allowedRole]);

  // Mientras verifica, mostrar loading
  if (isChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nadin-pink"></div>
      </div>
    );
  }

  // Si no está autorizado, no mostrar nada (ya redirigió)
  if (!isAuthorized) {
    return null;
  }

  // Si está autorizado, mostrar el contenido
  return <>{children}</>;
}
