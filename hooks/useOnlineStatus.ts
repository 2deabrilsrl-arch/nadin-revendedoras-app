// hooks/useOnlineStatus.ts
'use client';
import { useEffect, useState } from 'react';

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

declare const window: any;
declare const navigator: any;

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    // Estado inicial basado en navigator.onLine
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    // Handlers para eventos de conexión
    const handleOnline = () => {
      console.log('🟢 Conexión restablecida');
      setIsOnline(true);
      
      // Marcar que estuvo offline para mostrar mensaje temporal
      if (wasOffline) {
        // Trigger sincronización de pedidos pendientes
        triggerSync();
      }
    };

    const handleOffline = () => {
      console.log('🔴 Conexión perdida - Modo offline activado');
      setIsOnline(false);
      setWasOffline(true);
    };

    // Registrar event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
}

// Función para trigger background sync
function triggerSync() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration: any) => {
        if ('sync' in registration) {
          return registration.sync.register('sync-pending-orders');
        }
      })
      .then(() => {
        console.log('📤 Background sync registrado');
      })
      .catch((error: any) => {
        console.error('Error al registrar background sync:', error);
      });
  }
}