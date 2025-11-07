'use client';
import { useEffect, useState } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada (modo standalone)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Si ya está instalada o el usuario cerró el banner, no mostrar
    const bannerDismissed = localStorage.getItem('pwa-banner-dismissed');
    if (standalone || bannerDismissed === 'true') {
      return;
    }

    // Evento de Chrome/Edge para instalación
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Para iOS, mostrar instrucciones después de 3 segundos
    if (iOS && !standalone) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ Usuario instaló la PWA');
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  // No mostrar si ya está instalada
  if (isStandalone || !showBanner) {
    return null;
  }

  // Banner para iOS (instrucciones)
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-nadin-pink to-pink-500 text-white p-4 shadow-2xl animate-slide-up">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-start gap-3 pr-8">
            <Smartphone size={32} className="flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg mb-2">
                ¡Instalá Nadin en tu iPhone!
              </h3>
              <p className="text-sm mb-3">
                Para una mejor experiencia, agregá la app a tu pantalla de inicio:
              </p>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Tocá el botón <strong>Compartir</strong> {' '}
                  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </li>
                <li>Desplazá hacia abajo</li>
                <li>Seleccioná <strong>"Agregar a pantalla de inicio"</strong></li>
                <li>Tocá <strong>"Agregar"</strong></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Banner para Android/Chrome (instalación automática)
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-nadin-pink to-pink-500 text-white p-4 shadow-2xl animate-slide-up">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-center justify-between gap-4 pr-8">
          <div className="flex items-center gap-3">
            <Download size={32} className="flex-shrink-0" />
            <div>
              <h3 className="font-bold text-lg">
                ¡Instalá Nadin Revendedoras!
              </h3>
              <p className="text-sm opacity-90">
                Accedé más rápido y trabajá sin conexión
              </p>
            </div>
          </div>
          
          <button
            onClick={handleInstallClick}
            className="bg-white text-nadin-pink px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}
