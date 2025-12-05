# Script para crear lib/useSession.ts
# Ejecutar desde la raíz del proyecto

# Crear carpeta lib si no existe
if (-not (Test-Path "lib")) {
    New-Item -ItemType Directory -Path "lib" -Force
    Write-Host "✓ Carpeta lib creada" -ForegroundColor Green
} else {
    Write-Host "✓ Carpeta lib ya existe" -ForegroundColor Yellow
}

# Contenido del archivo
$content = @'
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
      const userStr = localStorage.getItem('user');
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
  localStorage.removeItem('user');
  window.location.href = '/login';
}
'@

# Crear archivo
Set-Content -Path "lib\useSession.ts" -Value $content -Encoding UTF8

Write-Host "✓ Archivo lib\useSession.ts creado exitosamente" -ForegroundColor Green
Write-Host ""
Write-Host "Siguiente paso: Actualizar app\api\auth\login\route.ts" -ForegroundColor Cyan
