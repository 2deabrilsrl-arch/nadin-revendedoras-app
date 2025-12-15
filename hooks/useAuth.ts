// HOOK: useAuth - Manejo de autenticación con localStorage
// Ubicación: hooks/useAuth.ts

'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  handle: string;
  margen: number;
  dni: string;
  telefono: string;
  cbu?: string;
  alias?: string;
  cvu?: string;
  rol?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Leer user de localStorage al montar
    const loadUser = () => {
      try {
        const userStr = (globalThis as any).localStorage?.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error cargando usuario:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Escuchar cambios en localStorage (para sync entre tabs)
    const handleStorageChange = (e: any) => {
      if (e.key === 'user') {
        if (e.newValue) {
          setUser(JSON.parse(e.newValue));
        } else {
          setUser(null);
        }
      }
    };

    (globalThis as any).window?.addEventListener('storage', handleStorageChange);

    return () => {
      (globalThis as any).window?.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const logout = () => {
    (globalThis as any).localStorage?.removeItem('user');
    setUser(null);
    (globalThis as any).window.location.href = '/login';
  };

  const updateUser = (newData: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...newData };
      (globalThis as any).localStorage?.setItem('user', JSON.stringify(updated));
      setUser(updated);
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isVendedora: user?.rol === 'vendedora',
    logout,
    updateUser
  };
}
