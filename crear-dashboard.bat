@echo off
chcp 65001 >nul
echo ============================================
echo   CREANDO DASHBOARD COMPLETO
echo ============================================
echo.

REM app/dashboard/layout.tsx
(
echo 'use client';
echo import { useState } from 'react';
echo import { Menu, Home, User, ShoppingCart, Send, TrendingUp, Clock } from 'lucide-react';
echo import Link from 'next/link';
echo.
echo export default function DashboardLayout^({ children }: { children: React.ReactNode }^) {
echo   const [showMenu, setShowMenu] = useState^(false^);
echo.
echo   return ^(
echo     ^<div className="min-h-screen bg-gray-50"^>
echo       ^<header className="bg-nadin-pink text-white p-4 flex items-center justify-between"^>
echo         ^<div className="flex items-center gap-3"^>
echo           ^<button onClick={^(^) =^> setShowMenu^(!showMenu^)^}^>^<Menu size={24} /^>^</button^>
echo           ^<h1 className="font-bold"^>Nadin Lencería^</h1^>
echo         ^</div^>
echo       ^</header^>
echo       {showMenu ^&^& ^(
echo         ^<div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={^(^) =^> setShowMenu^(false^)^}^>
echo           ^<div className="absolute left-0 top-0 bottom-0 w-64 bg-white p-4" onClick={^(e^) =^> e.stopPropagation^(^)^}^>
echo             ^<nav className="space-y-2"^>
echo               ^<Link href="/dashboard" className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded"^>^<Home size={20} /^> Inicio^</Link^>
echo               ^<Link href="/dashboard/catalogo" className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded"^>^<ShoppingCart size={20} /^> Catálogo^</Link^>
echo               ^<Link href="/dashboard/pedidos" className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded"^>^<ShoppingCart size={20} /^> Pedidos^</Link^>
echo               ^<Link href="/dashboard/consolidar" className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded"^>^<Send size={20} /^> Consolidar^</Link^>
echo               ^<Link href="/dashboard/analytics" className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded"^>^<TrendingUp size={20} /^> Analytics^</Link^>
echo               ^<Link href="/dashboard/historial" className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded"^>^<Clock size={20} /^> Historial^</Link^>
echo               ^<Link href="/dashboard/perfil" className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded"^>^<User size={20} /^> Perfil^</Link^>
echo             ^</nav^>
echo           ^</div^>
echo         ^</div^>
echo       ^)^}
echo       ^<main^>{children}^</main^>
echo     ^</div^>
echo   ^);
echo }
) > app\dashboard\layout.tsx

REM app/dashboard/page.tsx
(
echo export default function DashboardHome^(^) {
echo   return ^(
echo     ^<div className="max-w-4xl mx-auto p-4"^>
echo       ^<h2 className="text-2xl font-bold mb-4"^>Bienvenida al Dashboard^</h2^>
echo       ^<div className="grid grid-cols-2 gap-4"^>
echo         ^<a href="/dashboard/catalogo" className="bg-white p-6 rounded-lg shadow hover:shadow-lg"^>
echo           ^<h3 className="font-bold text-lg"^>Catálogo^</h3^>
echo           ^<p className="text-gray-600"^>Ver productos^</p^>
echo         ^</a^>
echo         ^<a href="/dashboard/pedidos" className="bg-white p-6 rounded-lg shadow hover:shadow-lg"^>
echo           ^<h3 className="font-bold text-lg"^>Pedidos^</h3^>
echo           ^<p className="text-gray-600"^>Gestionar pedidos^</p^>
echo         ^</a^>
echo       ^</div^>
echo     ^</div^>
echo   ^);
echo }
) > app\dashboard\page.tsx

REM app/dashboard/catalogo/page.tsx
(
echo 'use client';
echo import { useEffect, useState } from 'react';
echo.
echo export default function CatalogoPage^(^) {
echo   const [products, setProducts] = useState^([^]^);
echo.
echo   useEffect^(^(^) =^> {
echo     fetch^('/api/catalogo'^).then^(r =^> r.json^(^)^).then^(setProducts^);
echo   }, [^]^);
echo.
echo   return ^(
echo     ^<div className="max-w-7xl mx-auto p-4"^>
echo       ^<h2 className="text-2xl font-bold mb-4"^>Catálogo^</h2^>
echo       ^<div className="grid grid-cols-2 md:grid-cols-4 gap-4"^>
echo         {products.map^(^(p: any^) =^> ^(
echo           ^<div key={p.id} className="bg-white rounded-lg shadow p-4"^>
echo             ^<h3 className="font-bold"^>{p.name.es}^</h3^>
echo             ^<p className="text-nadin-pink font-bold"^>${p.variants[0]?.price}^</p^>
echo           ^</div^>
echo         ^)^)}
echo       ^</div^>
echo     ^</div^>
echo   ^);
echo }
) > app\dashboard\catalogo\page.tsx

REM app/dashboard/pedidos/page.tsx
(
echo 'use client';
echo import { useEffect, useState } from 'react';
echo.
echo export default function PedidosPage^(^) {
echo   const [pedidos, setPedidos] = useState^([^]^);
echo.
echo   useEffect^(^(^) =^> {
echo     fetch^('/api/pedidos?userId=USER_ID'^).then^(r =^> r.json^(^)^).then^(setPedidos^);
echo   }, [^]^);
echo.
echo   return ^(
echo     ^<div className="max-w-4xl mx-auto p-4"^>
echo       ^<h2 className="text-2xl font-bold mb-4"^>Mis Pedidos^</h2^>
echo       ^<div className="space-y-3"^>
echo         {pedidos.map^(^(pedido: any^) =^> ^(
echo           ^<div key={pedido.id} className="bg-white rounded-lg shadow p-4"^>
echo             ^<p className="font-bold"^>{pedido.cliente}^</p^>
echo             ^<p className="text-sm text-gray-600"^>{pedido.lineas.length} productos^</p^>
echo           ^</div^>
echo         ^)^)}
echo       ^</div^>
echo     ^</div^>
echo   ^);
echo }
) > app\dashboard\pedidos\page.tsx

REM app/dashboard/consolidar/page.tsx
(
echo 'use client';
echo import { useState } from 'react';
echo.
echo export default function ConsolidarPage^(^) {
echo   const [formaPago, setFormaPago] = useState^('''^);
echo   const [tipoEnvio, setTipoEnvio] = useState^('''^);
echo   const [transporte, setTransporte] = useState^('''^);
echo.
echo   const handleConsolidar = async ^(^) =^> {
echo     const res = await fetch^('/api/consolidar', {
echo       method: 'POST',
echo       headers: { 'Content-Type': 'application/json' },
echo       body: JSON.stringify^({ 
echo         userId: 'USER_ID', 
echo         pedidoIds: [^], 
echo         formaPago, 
echo         tipoEnvio, 
echo         transporteNombre: transporte 
echo       }^),
echo     }^);
echo     if ^(res.ok^) alert^('Pedidos consolidados y enviados!'^);
echo   };
echo.
echo   return ^(
echo     ^<div className="max-w-4xl mx-auto p-4"^>
echo       ^<h2 className="text-2xl font-bold mb-4"^>Consolidar Pedidos^</h2^>
echo       ^<div className="bg-white rounded-lg shadow p-6 space-y-4"^>
echo         ^<select value={formaPago} onChange={^(e^) =^> setFormaPago^(e.target.value^)} className="w-full p-2 border rounded"^>
echo           ^<option^>Seleccionar forma de pago^</option^>
echo           ^<option^>Efectivo^</option^>
echo           ^<option^>Mercado Pago^</option^>
echo           ^<option^>Transferencia Bancaria^</option^>
echo           ^<option^>Tarjeta de Crédito^</option^>
echo         ^</select^>
echo         ^<select value={tipoEnvio} onChange={^(e^) =^> setTipoEnvio^(e.target.value^)} className="w-full p-2 border rounded"^>
echo           ^<option^>Seleccionar tipo de envío^</option^>
echo           ^<option^>Retiro en el Local^</option^>
echo           ^<option^>Enviar por Correo Argentino^</option^>
echo           ^<option value="transporte"^>Cadete a Transporte^</option^>
echo         ^</select^>
echo         {tipoEnvio === 'transporte' ^&^& ^(
echo           ^<input type="text" placeholder="Nombre del transporte" value={transporte} onChange={^(e^) =^> setTransporte^(e.target.value^)} className="w-full p-2 border rounded" /^>
echo         ^)^}
echo         ^<button onClick={handleConsolidar} className="w-full bg-nadin-pink text-white py-3 rounded font-bold"^>Enviar a Nadin^</button^>
echo       ^</div^>
echo     ^</div^>
echo   ^);
echo }
) > app\dashboard\consolidar\page.tsx

REM app/dashboard/analytics/page.tsx
(
echo 'use client';
echo import { useEffect, useState } from 'react';
echo.
echo export default function AnalyticsPage^(^) {
echo   const [data, setData] = useState^({ totalPedidos: 0, totalGanancia: 0, totalVentas: 0 }^);
echo.
echo   useEffect^(^(^) =^> {
echo     fetch^('/api/analytics?userId=USER_ID'^).then^(r =^> r.json^(^)^).then^(setData^);
echo   }, [^]^);
echo.
echo   return ^(
echo     ^<div className="max-w-4xl mx-auto p-4"^>
echo       ^<h2 className="text-2xl font-bold mb-4"^>Analytics^</h2^>
echo       ^<div className="grid grid-cols-3 gap-4"^>
echo         ^<div className="bg-white p-6 rounded-lg shadow"^>
echo           ^<p className="text-gray-600"^>Total Pedidos^</p^>
echo           ^<p className="text-3xl font-bold text-nadin-pink"^>{data.totalPedidos}^</p^>
echo         ^</div^>
echo         ^<div className="bg-white p-6 rounded-lg shadow"^>
echo           ^<p className="text-gray-600"^>Ganancia Total^</p^>
echo           ^<p className="text-3xl font-bold text-green-600"^>${data.totalGanancia.toLocaleString^(^)}^</p^>
echo         ^</div^>
echo         ^<div className="bg-white p-6 rounded-lg shadow"^>
echo           ^<p className="text-gray-600"^>Ventas Totales^</p^>
echo           ^<p className="text-3xl font-bold text-blue-600"^>${data.totalVentas.toLocaleString^(^)}^</p^>
echo         ^</div^>
echo       ^</div^>
echo     ^</div^>
echo   ^);
echo }
) > app\dashboard\analytics\page.tsx

REM app/dashboard/historial/page.tsx
(
echo 'use client';
echo export default function HistorialPage^(^) {
echo   return ^(
echo     ^<div className="max-w-4xl mx-auto p-4"^>
echo       ^<h2 className="text-2xl font-bold mb-4"^>Historial de Envíos^</h2^>
echo       ^<p className="text-gray-600"^>Aquí verás tus consolidaciones enviadas^</p^>
echo     ^</div^>
echo   ^);
echo }
) > app\dashboard\historial\page.tsx

REM app/dashboard/perfil/page.tsx
(
echo 'use client';
echo import { useState } from 'react';
echo.
echo export default function PerfilPage^(^) {
echo   const [margen, setMargen] = useState^(60^);
echo   const [cbu, setCbu] = useState^('''^);
echo   const [alias, setAlias] = useState^('''^);
echo.
echo   return ^(
echo     ^<div className="max-w-2xl mx-auto p-4"^>
echo       ^<h2 className="text-2xl font-bold mb-4"^>Mi Perfil^</h2^>
echo       ^<div className="bg-white rounded-lg shadow p-6 space-y-4"^>
echo         ^<div^>
echo           ^<label className="block font-medium mb-2"^>% de Ganancia^</label^>
echo           ^<input type="range" min="0" max="150" value={margen} onChange={^(e^) =^> setMargen^(Number^(e.target.value^)^)} className="w-full" /^>
echo           ^<p className="text-2xl font-bold text-nadin-pink"^>{margen}%^</p^>
echo         ^</div^>
echo         ^<div^>
echo           ^<label className="block font-medium mb-2"^>CBU^</label^>
echo           ^<input type="text" value={cbu} onChange={^(e^) =^> setCbu^(e.target.value^)} className="w-full p-2 border rounded" /^>
echo         ^</div^>
echo         ^<div^>
echo           ^<label className="block font-medium mb-2"^>Alias^</label^>
echo           ^<input type="text" value={alias} onChange={^(e^) =^> setAlias^(e.target.value^)} className="w-full p-2 border rounded" /^>
echo         ^</div^>
echo         ^<button className="w-full bg-nadin-pink text-white py-3 rounded font-bold"^>Guardar^</button^>
echo       ^</div^>
echo     ^</div^>
echo   ^);
echo }
) > app\dashboard\perfil\page.tsx

echo.
echo ✅ Dashboard completo creado!
echo.
echo ============================================
echo   PROYECTO COMPLETADO
echo ============================================
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul