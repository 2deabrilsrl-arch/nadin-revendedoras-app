// COMPONENTE: REDIRECCIÓN POST-LOGIN
// Ubicación: components/LoginRedirect.tsx (crear carpeta components si no existe)

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      const isVendedora = session.user.email === 'nadinlenceria@gmail.com';
      
      if (isVendedora) {
        console.log('🔄 Redirigiendo a dashboard admin...');
        router.push('/admin/dashboard');
      } else {
        console.log('🔄 Redirigiendo a dashboard revendedora...');
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  return null;
}
