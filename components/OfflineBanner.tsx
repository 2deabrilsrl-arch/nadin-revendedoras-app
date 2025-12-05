// components/OfflineBanner.tsx
'use client';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [show, setShow] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      // Offline: mostrar banner permanentemente
      setShow(true);
    } else if (wasOffline) {
      // Volvió online después de estar offline: mostrar temporalmente
      setShow(true);
      setIsSyncing(true);

      // Ocultar después de 5 segundos
      const timer = setTimeout(() => {
        setShow(false);
        setIsSyncing(false);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      // Online normal: no mostrar nada
      setShow(false);
    }
  }, [isOnline, wasOffline]);

  if (!show) return null;

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isOnline ? 'bg-green-500' : 'bg-orange-500'
        }`}
        style={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-3 text-white">
            {isOnline ? (
              <>
                <Wifi size={20} className="flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <span className="font-medium">Conexión restablecida</span>
                  {isSyncing && (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span className="text-sm opacity-90">Sincronizando...</span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <WifiOff size={20} className="flex-shrink-0" />
                <div className="text-center sm:text-left">
                  <p className="font-medium">Sin conexión a internet</p>
                  <p className="text-sm opacity-90">
                    Trabajando en modo offline - Los cambios se sincronizarán automáticamente
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
