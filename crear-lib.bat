@echo off
chcp 65001 >nul
echo ============================================
echo   CREANDO ARCHIVOS DE UTILIDADES (lib)
echo ============================================
echo.

REM lib/prisma.ts
(
echo import { PrismaClient } from '@prisma/client';
echo.
echo const globalForPrisma = globalThis as unknown as {
echo   prisma: PrismaClient ^| undefined;
echo };
echo.
echo export const prisma = globalForPrisma.prisma ?? new PrismaClient^(^);
echo.
echo if ^(process.env.NODE_ENV !== 'production'^) globalForPrisma.prisma = prisma;
) > lib\prisma.ts

REM lib/precios.ts
(
echo export const redondeo50 = ^(x: number^): number =^> {
echo   return Math.round^(x / 50^) * 50;
echo };
echo.
echo export const calcularPrecioVenta = ^(precioMayorista: number, margen: number^): number =^> {
echo   return redondeo50^(precioMayorista * ^(1 + margen / 100^)^);
echo };
echo.
echo export const formatCurrency = ^(amount: number^): string =^> {
echo   return `$${amount.toLocaleString^('es-AR', { minimumFractionDigits: 0 }^)}`;
echo };
) > lib\precios.ts

REM lib/tiendanube.ts
(
echo const TN_STORE_ID = process.env.TN_STORE_ID;
echo const TN_ACCESS_TOKEN = process.env.TN_ACCESS_TOKEN;
echo const TN_API_BASE = process.env.TN_API_BASE;
echo const TN_USER_AGENT = process.env.TN_USER_AGENT;
echo.
echo interface Product {
echo   id: string;
echo   name: { es: string };
echo   variants: Variant[];
echo   images: { src: string }[];
echo   brand?: string;
echo   categories?: { name: { es: string } }[];
echo }
echo.
echo interface Variant {
echo   id: string;
echo   product_id: string;
echo   price: string;
echo   stock: number;
echo   sku?: string;
echo   values?: { es: string }[];
echo }
echo.
echo async function fetchTN^(endpoint: string^) {
echo   const response = await fetch^(`${TN_API_BASE}/${TN_STORE_ID}${endpoint}`, {
echo     headers: {
echo       'Authentication': `bearer ${TN_ACCESS_TOKEN}`,
echo       'User-Agent': TN_USER_AGENT ^|^| '',
echo       'Content-Type': 'application/json',
echo     },
echo     next: { revalidate: 900 }
echo   }^);
echo   if ^(!response.ok^) throw new Error^(`TN API Error: ${response.status}`^);
echo   return response.json^(^);
echo }
echo.
echo export async function getProducts^(^) {
echo   const products = await fetchTN^('/products'^);
echo   return products;
echo }
echo.
echo export async function getProduct^(id: string^) {
echo   const product = await fetchTN^(`/products/${id}`^);
echo   return product;
echo }
) > lib\tiendanube.ts

REM lib/email.ts
(
echo import nodemailer from 'nodemailer';
echo.
echo const transporter = nodemailer.createTransport^({
echo   host: process.env.SMTP_HOST,
echo   port: Number^(process.env.SMTP_PORT^),
echo   secure: process.env.SMTP_SECURE === 'true',
echo   auth: {
echo     user: process.env.SMTP_USER,
echo     pass: process.env.SMTP_PASS,
echo   },
echo }^);
echo.
echo export async function sendConsolidacionEmail^(data: any^) {
echo   const { revendedora, pedidos, totales, formaPago, tipoEnvio, transporteNombre, csvContent } = data;
echo.
echo   const fecha = new Date^(^).toISOString^(^).slice^(0, 16^).replace^('T', ' '^);
echo   const subject = `Pedidos revendedora – ${revendedora.email} – ${fecha}`;
echo.
echo   const html = `
echo     ^<h2^>Consolidación de Pedidos^</h2^>
echo     ^<p^>^<strong^>Revendedora:^</strong^> ${revendedora.name} ^(@${revendedora.handle}^)^</p^>
echo     ^<p^>^<strong^>Email:^</strong^> ${revendedora.email}^</p^>
echo     ^<p^>^<strong^>Teléfono:^</strong^> ${revendedora.telefono}^</p^>
echo     ^<hr^>
echo     ^<p^>^<strong^>Pedidos incluidos:^</strong^> ${pedidos.length}^</p^>
echo     ^<p^>^<strong^>Total mayorista:^</strong^> $${totales.mayorista.toLocaleString^('es-AR'^)}^</p^>
echo     ^<p^>^<strong^>Total venta:^</strong^> $${totales.venta.toLocaleString^('es-AR'^)}^</p^>
echo     ^<p^>^<strong^>Ganancia estimada:^</strong^> $${totales.ganancia.toLocaleString^('es-AR'^)}^</p^>
echo     ^<hr^>
echo     ^<p^>^<strong^>Forma de pago:^</strong^> ${formaPago}^</p^>
echo     ^<p^>^<strong^>Tipo de envío:^</strong^> ${tipoEnvio}^</p^>
echo     ${transporteNombre ? `^<p^>^<strong^>Transporte:^</strong^> ${transporteNombre}^</p^>` : ''}
echo   `;
echo.
echo   await transporter.sendMail^({
echo     from: process.env.FROM_EMAIL,
echo     to: 'nadinlenceria@gmail.com',
echo     subject,
echo     html,
echo     attachments: [
echo       {
echo         filename: `pedidos_${revendedora.handle}_${Date.now^(^)}.csv`,
echo         content: csvContent,
echo       },
echo     ],
echo   }^);
echo }
) > lib\email.ts

echo.
echo ✅ Archivos de utilidades (lib) creados!
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul