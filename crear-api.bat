@echo off
chcp 65001 >nul
echo ============================================
echo   CREANDO API ROUTES
echo ============================================
echo.

REM app/api/auth/login/route.ts
(
echo import { NextRequest, NextResponse } from 'next/server';
echo import { prisma } from '@/lib/prisma';
echo import bcrypt from 'bcryptjs';
echo.
echo export async function POST^(req: NextRequest^) {
echo   try {
echo     const { email, password } = await req.json^(^);
echo     const user = await prisma.user.findUnique^({ where: { email } }^);
echo.
echo     if ^(!user ^|^| !await bcrypt.compare^(password, user.password^)^) {
echo       return NextResponse.json^({ error: 'Credenciales inválidas' }, { status: 401 }^);
echo     }
echo.
echo     return NextResponse.json^({ 
echo       id: user.id, 
echo       email: user.email, 
echo       name: user.name, 
echo       handle: user.handle,
echo       margen: user.margen 
echo     }^);
echo   } catch ^(error^) {
echo     return NextResponse.json^({ error: 'Error en login' }, { status: 500 }^);
echo   }
echo }
) > app\api\auth\login\route.ts

REM app/api/auth/registro/route.ts
(
echo import { NextRequest, NextResponse } from 'next/server';
echo import { prisma } from '@/lib/prisma';
echo import bcrypt from 'bcryptjs';
echo.
echo export async function POST^(req: NextRequest^) {
echo   try {
echo     const { email, password, name, dni, telefono, handle } = await req.json^(^);
echo     const hashedPassword = await bcrypt.hash^(password, 10^);
echo.
echo     const user = await prisma.user.create^({
echo       data: { email, password: hashedPassword, name, dni, telefono, handle },
echo     }^);
echo.
echo     return NextResponse.json^({ id: user.id, email: user.email }^);
echo   } catch ^(error^) {
echo     return NextResponse.json^({ error: 'Error en registro' }, { status: 500 }^);
echo   }
echo }
) > app\api\auth\registro\route.ts

REM app/api/catalogo/route.ts
(
echo import { NextResponse } from 'next/server';
echo import { getProducts } from '@/lib/tiendanube';
echo.
echo export async function GET^(^) {
echo   try {
echo     const products = await getProducts^(^);
echo     return NextResponse.json^(products^);
echo   } catch ^(error^) {
echo     return NextResponse.json^({ error: 'Error al obtener productos' }, { status: 500 }^);
echo   }
echo }
) > app\api\catalogo\route.ts

REM app/api/pedidos/route.ts
(
echo import { NextRequest, NextResponse } from 'next/server';
echo import { prisma } from '@/lib/prisma';
echo.
echo export async function POST^(req: NextRequest^) {
echo   try {
echo     const { userId, cliente, telefono, nota, lineas } = await req.json^(^);
echo.
echo     const pedido = await prisma.pedido.create^({
echo       data: {
echo         userId,
echo         cliente,
echo         telefono,
echo         nota,
echo         lineas: {
echo           create: lineas.map^(^(l: any^) =^> ^({
echo             productId: l.productId,
echo             variantId: l.variantId,
echo             sku: l.sku,
echo             brand: l.brand,
echo             name: l.name,
echo             talle: l.talle,
echo             color: l.color,
echo             qty: l.qty,
echo             mayorista: l.mayorista,
echo             venta: l.venta,
echo           }^)^),
echo         },
echo       },
echo       include: { lineas: true },
echo     }^);
echo.
echo     return NextResponse.json^(pedido^);
echo   } catch ^(error^) {
echo     return NextResponse.json^({ error: 'Error al crear pedido' }, { status: 500 }^);
echo   }
echo }
echo.
echo export async function GET^(req: NextRequest^) {
echo   try {
echo     const userId = req.nextUrl.searchParams.get^('userId'^);
echo     const pedidos = await prisma.pedido.findMany^({
echo       where: { userId: userId ^|^| undefined },
echo       include: { lineas: true },
echo       orderBy: { createdAt: 'desc' },
echo     }^);
echo     return NextResponse.json^(pedidos^);
echo   } catch ^(error^) {
echo     return NextResponse.json^({ error: 'Error al obtener pedidos' }, { status: 500 }^);
echo   }
echo }
) > app\api\pedidos\route.ts

REM app/api/consolidar/route.ts
(
echo import { NextRequest, NextResponse } from 'next/server';
echo import { prisma } from '@/lib/prisma';
echo import { sendConsolidacionEmail } from '@/lib/email';
echo.
echo export async function POST^(req: NextRequest^) {
echo   try {
echo     const { userId, pedidoIds, formaPago, tipoEnvio, transporteNombre } = await req.json^(^);
echo.
echo     const pedidos = await prisma.pedido.findMany^({
echo       where: { id: { in: pedidoIds } },
echo       include: { lineas: true, user: true },
echo     }^);
echo.
echo     let totalMayorista = 0;
echo     let totalVenta = 0;
echo.
echo     const csvRows = ['cliente,telefono,product_id,variant_id,sku,marca,producto,talle,color,cantidad,precio_mayorista_unit,precio_mayorista_total,precio_revendedora_unit,precio_revendedora_total,nota'];
echo.
echo     pedidos.forEach^(pedido =^> {
echo       pedido.lineas.forEach^(linea =^> {
echo         totalMayorista += linea.mayorista * linea.qty;
echo         totalVenta += linea.venta * linea.qty;
echo         csvRows.push^(
echo           `${pedido.cliente},${pedido.telefono},${linea.productId},${linea.variantId},${linea.sku},${linea.brand},${linea.name},${linea.talle},${linea.color},${linea.qty},${linea.mayorista},${linea.mayorista * linea.qty},${linea.venta},${linea.venta * linea.qty},${pedido.nota ^|^| ''}`
echo         ^);
echo       }^);
echo     }^);
echo.
echo     const csvContent = csvRows.join^('\n'^);
echo     const ganancia = totalVenta - totalMayorista;
echo.
echo     await sendConsolidacionEmail^({
echo       revendedora: pedidos[0].user,
echo       pedidos,
echo       totales: { mayorista: totalMayorista, venta: totalVenta, ganancia },
echo       formaPago,
echo       tipoEnvio,
echo       transporteNombre,
echo       csvContent,
echo     }^);
echo.
echo     const consolidacion = await prisma.consolidacion.create^({
echo       data: {
echo         userId,
echo         pedidoIds: JSON.stringify^(pedidoIds^),
echo         formaPago,
echo         tipoEnvio,
echo         transporteNombre,
echo         totalMayorista,
echo         totalVenta,
echo         ganancia,
echo       },
echo     }^);
echo.
echo     await prisma.pedido.updateMany^({
echo       where: { id: { in: pedidoIds } },
echo       data: { estado: 'enviado' },
echo     }^);
echo.
echo     return NextResponse.json^(consolidacion^);
echo   } catch ^(error^) {
echo     console.error^(error^);
echo     return NextResponse.json^({ error: 'Error al consolidar' }, { status: 500 }^);
echo   }
echo }
) > app\api\consolidar\route.ts

REM app/api/analytics/route.ts
(
echo import { NextRequest, NextResponse } from 'next/server';
echo import { prisma } from '@/lib/prisma';
echo.
echo export async function GET^(req: NextRequest^) {
echo   try {
echo     const userId = req.nextUrl.searchParams.get^('userId'^);
echo     if ^(!userId^) return NextResponse.json^({ error: 'userId requerido' }, { status: 400 }^);
echo.
echo     const consolidaciones = await prisma.consolidacion.findMany^({
echo       where: { userId },
echo       orderBy: { enviadoAt: 'desc' },
echo     }^);
echo.
echo     const totalPedidos = consolidaciones.length;
echo     const totalGanancia = consolidaciones.reduce^(^(sum, c^) =^> sum + c.ganancia, 0^);
echo     const totalVentas = consolidaciones.reduce^(^(sum, c^) =^> sum + c.totalVenta, 0^);
echo.
echo     return NextResponse.json^({ totalPedidos, totalGanancia, totalVentas, consolidaciones }^);
echo   } catch ^(error^) {
echo     return NextResponse.json^({ error: 'Error al obtener analytics' }, { status: 500 }^);
echo   }
echo }
) > app\api\analytics\route.ts

echo.
echo ✅ API Routes creadas!
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul