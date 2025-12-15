'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  rol?: string;
  [key: string]: any;
}

interface Session {
  user: User;
}

interface UseSessionReturn {
  data: Session | null;
  status: 'authenticated' | 'unauthenticated' | 'loading';
}

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<UseSessionReturn>({
    data: null,
    status: 'loading'
  });

  useEffect(() => {
    try {
      const userStr = (globalThis as any).localStorage?.getItem('user');
      if (!userStr) {
        setSession({ data: null, status: 'unauthenticated' });
        return;
      }

      const user = JSON.parse(userStr);
      setSession({
        data: { user },
        status: 'authenticated'
      });
    } catch (error) {
      console.error('Error al obtener sesión:', error);
      setSession({ data: null, status: 'unauthenticated' });
    }
  }, []);

  return session;
}

export function signOut() {
  (globalThis as any).localStorage?.removeItem('user');
  (globalThis as any).window.location.href = '/login';
}
