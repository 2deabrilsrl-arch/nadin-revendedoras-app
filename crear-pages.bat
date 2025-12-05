@echo off
chcp 65001 >nul
echo ============================================
echo   CREANDO PÁGINAS PRINCIPALES
echo ============================================
echo.

REM app/layout.tsx
(
echo import './globals.css';
echo import type { Metadata } from 'next';
echo.
echo export const metadata: Metadata = {
echo   title: 'Nadin Lencería - Revendedoras',
echo   description: 'App para revendedoras de Nadin Lencería',
echo   manifest: '/manifest.json',
echo   themeColor: '#ef88b7',
echo };
echo.
echo export default function RootLayout^({ children }: { children: React.ReactNode }^) {
echo   return ^(
echo     ^<html lang="es"^>
echo       ^<head^>
echo         ^<link rel="icon" href="/logo.png" /^>
echo       ^</head^>
echo       ^<body^>{children}^</body^>
echo     ^</html^>
echo   ^);
echo }
) > app\layout.tsx

REM app/globals.css
(
echo @tailwind base;
echo @tailwind components;
echo @tailwind utilities;
echo.
echo body {
echo   font-family: 'Open Sans', system-ui, sans-serif;
echo }
) > app\globals.css

REM app/page.tsx
(
echo 'use client';
echo import { useRouter } from 'next/navigation';
echo import { useEffect } from 'react';
echo.
echo export default function Home^(^) {
echo   const router = useRouter^(^);
echo.
echo   useEffect^(^(^) =^> {
echo     router.push^('/login'^);
echo   }, [router]^);
echo.
echo   return null;
echo }
) > app\page.tsx

REM app/login/page.tsx
(
echo 'use client';
echo import { useState } from 'react';
echo import { useRouter } from 'next/navigation';
echo import Image from 'next/image';
echo.
echo export default function LoginPage^(^) {
echo   const [email, setEmail] = useState^('''^);
echo   const [password, setPassword] = useState^('''^);
echo   const router = useRouter^(^);
echo.
echo   const handleLogin = async ^(e: React.FormEvent^) =^> {
echo     e.preventDefault^(^);
echo     const res = await fetch^('/api/auth/login', {
echo       method: 'POST',
echo       headers: { 'Content-Type': 'application/json' },
echo       body: JSON.stringify^({ email, password }^),
echo     }^);
echo     if ^(res.ok^) {
echo       router.push^('/dashboard'^);
echo     } else {
echo       alert^('Credenciales inválidas'^);
echo     }
echo   };
echo.
echo   return ^(
echo     ^<div className="min-h-screen bg-gradient-to-b from-nadin-pink to-nadin-pink-dark flex items-center justify-center p-4"^>
echo       ^<div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"^>
echo         ^<div className="text-center mb-8"^>
echo           ^<img src="https://res.cloudinary.com/ddxd6ha6q/image/upload/v1762132027/LOGO_NADIN_-_copia_aefdz4.png" alt="Nadin" className="h-20 mx-auto mb-4" /^>
echo           ^<h1 className="text-2xl font-bold text-gray-800"^>Bienvenida^</h1^>
echo           ^<p className="text-gray-600"^>Ingresá a tu cuenta^</p^>
echo         ^</div^>
echo         ^<form onSubmit={handleLogin} className="space-y-4"^>
echo           ^<input type="email" placeholder="Email" value={email} onChange={^(e^) =^> setEmail^(e.target.value^)} className="w-full px-4 py-3 border rounded-lg" required /^>
echo           ^<input type="password" placeholder="Contraseña" value={password} onChange={^(e^) =^> setPassword^(e.target.value^)} className="w-full px-4 py-3 border rounded-lg" required /^>
echo           ^<button type="submit" className="w-full bg-nadin-pink text-white py-3 rounded-lg font-bold hover:bg-nadin-pink-dark"^>Ingresar^</button^>
echo         ^</form^>
echo         ^<p className="text-center mt-6 text-sm"^>¿No tenés cuenta? ^<a href="/registro" className="text-nadin-pink font-bold"^>Registrate^</a^>^</p^>
echo       ^</div^>
echo     ^</div^>
echo   ^);
echo }
) > app\login\page.tsx

REM app/registro/page.tsx
(
echo 'use client';
echo import { useState } from 'react';
echo import { useRouter } from 'next/navigation';
echo.
echo export default function RegistroPage^(^) {
echo   const [formData, setFormData] = useState^({ name: '', email: '', password: '', dni: '', telefono: '', handle: '' }^);
echo   const router = useRouter^(^);
echo.
echo   const handleSubmit = async ^(e: React.FormEvent^) =^> {
echo     e.preventDefault^(^);
echo     const res = await fetch^('/api/auth/registro', {
echo       method: 'POST',
echo       headers: { 'Content-Type': 'application/json' },
echo       body: JSON.stringify^(formData^),
echo     }^);
echo     if ^(res.ok^) {
echo       alert^('Registro exitoso'^);
echo       router.push^('/login'^);
echo     } else {
echo       alert^('Error en el registro'^);
echo     }
echo   };
echo.
echo   return ^(
echo     ^<div className="min-h-screen bg-gradient-to-b from-nadin-pink to-nadin-pink-dark flex items-center justify-center p-4"^>
echo       ^<div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"^>
echo         ^<h1 className="text-2xl font-bold text-center mb-6"^>Crear cuenta^</h1^>
echo         ^<form onSubmit={handleSubmit} className="space-y-3"^>
echo           ^<input type="text" placeholder="Nombre completo" value={formData.name} onChange={^(e^) =^> setFormData^({...formData, name: e.target.value}^)} className="w-full px-4 py-2 border rounded-lg" required /^>
echo           ^<input type="email" placeholder="Email" value={formData.email} onChange={^(e^) =^> setFormData^({...formData, email: e.target.value}^)} className="w-full px-4 py-2 border rounded-lg" required /^>
echo           ^<input type="text" placeholder="DNI" value={formData.dni} onChange={^(e^) =^> setFormData^({...formData, dni: e.target.value}^)} className="w-full px-4 py-2 border rounded-lg" required /^>
echo           ^<input type="tel" placeholder="Teléfono" value={formData.telefono} onChange={^(e^) =^> setFormData^({...formData, telefono: e.target.value}^)} className="w-full px-4 py-2 border rounded-lg" required /^>
echo           ^<input type="text" placeholder="Handle ^(ej: vicky^)" value={formData.handle} onChange={^(e^) =^> setFormData^({...formData, handle: e.target.value.toLowerCase^(^)}^)} className="w-full px-4 py-2 border rounded-lg" required /^>
echo           ^<input type="password" placeholder="Contraseña" value={formData.password} onChange={^(e^) =^> setFormData^({...formData, password: e.target.value}^)} className="w-full px-4 py-2 border rounded-lg" required /^>
echo           ^<button type="submit" className="w-full bg-nadin-pink text-white py-3 rounded-lg font-bold"^>Registrarme^</button^>
echo         ^</form^>
echo         ^<p className="text-center mt-4 text-sm"^>¿Ya tenés cuenta? ^<a href="/login" className="text-nadin-pink font-bold"^>Ingresá^</a^>^</p^>
echo       ^</div^>
echo     ^</div^>
echo   ^);
echo }
) > app\registro\page.tsx

echo.
echo ✅ Páginas principales creadas!
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul