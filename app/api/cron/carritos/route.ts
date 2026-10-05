// Cron cada hora: recordatorio por email a quienes dejaron el carrito hace más de 2 horas
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTiendaBaseUrl, formatPrecio } from '@/lib/tienda';
import { emailOrden, escapeHtml } from '@/lib/tienda-checkout';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const ahora = Date.now();
  const carritos = await prisma.tiendaCarrito.findMany({
    where: { estado: 'abierto', email: { not: null }, avisadoAt: null, updatedAt: { lte: new Date(ahora - 2 * 3600e3), gte: new Date(ahora - 3 * 864e5) } },
    include: { tienda: true },
    take: 50,
  });
  let enviados = 0;
  for (const c of carritos) {
    if (!c.tienda.activa) continue;
    const link = `${getTiendaBaseUrl(c.tienda)}/carrito?recuperar=${c.token}`;
    const items = (c.items as any[]).slice(0, 6).map((i) => `<li>${escapeHtml(i.nombre)} ${i.talle ? `· ${escapeHtml(i.talle)}` : ''} × ${i.qty}</li>`).join('');
    await emailOrden(
      c.email,
      `¿Te olvidaste algo? Tu carrito te espera en ${c.tienda.nombre}`,
      `<p>¡Hola${c.nombre ? ` ${escapeHtml(c.nombre)}` : ''}!</p><p>Dejaste estos productos en tu carrito:</p><ul>${items}</ul>
       <p>Total: <strong>${formatPrecio(c.total)}</strong></p><p><a href="${link}">Terminar mi compra</a></p><p>${escapeHtml(c.tienda.nombre)}</p>`,
      c.tienda.email
    ).catch(() => {});
    await prisma.tiendaCarrito.update({ where: { id: c.id }, data: { estado: 'avisado', avisadoAt: new Date() } });
    enviados++;
  }
  return NextResponse.json({ ok: true, enviados });
}
