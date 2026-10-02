// Configuración pública del checkout (sin datos sensibles)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTiendaBySite } from '@/lib/tienda';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { site: string } }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });

  const [pagos, envios, hayCupones] = await Promise.all([
    prisma.tiendaMetodoPago.findMany({
      where: { tiendaId: tienda.id, activo: true },
      orderBy: { orden: 'asc' },
      select: { id: true, tipo: true, nombre: true, descuentoPct: true, config: true },
    }),
    prisma.tiendaEnvio.findMany({
      where: { tiendaId: tienda.id, activo: true },
      orderBy: { orden: 'asc' },
      select: { id: true, tipo: true, nombre: true, descripcion: true, precio: true, gratisDesde: true, pideDireccion: true },
    }),
    prisma.tiendaCupon.count({ where: { tiendaId: tienda.id, activo: true } }),
  ]);

  return NextResponse.json({
    nombre: tienda.nombre,
    // Mercado Pago solo aparece si está conectado; nunca devolvemos el config
    pagos: pagos
      .filter((p) => p.tipo !== 'mercadopago' || !!(p.config as any)?.accessToken)
      .map(({ config, ...p }) => p),
    envios,
    hayCupones: hayCupones > 0,
  });
}
