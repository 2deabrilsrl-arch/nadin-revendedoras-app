// Calcula totales (cupón, descuento por medio de pago, envío) sin crear la orden
import { NextResponse } from 'next/server';
import { getTiendaBySite } from '@/lib/tienda';
import { cotizar } from '@/lib/tienda-checkout';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { site: string } }) {
  const tienda = await getTiendaBySite(params.site);
  if (!tienda) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
  const body: any = await req.json().catch(() => ({}));
  const c = await cotizar(tienda, { items: body.items, envioId: body.envioId, pagoId: body.pagoId, cupon: body.cupon });
  return NextResponse.json({
    lineas: c.lineas.map(({ mayorista, ...l }) => l), // nunca exponer el costo
    errores: c.errores,
    subtotal: c.subtotal,
    descuentoCupon: c.descuentoCupon,
    descuentoPago: c.descuentoPago,
    envioCosto: c.envioCosto,
    total: c.total,
    cupon: c.cupon ? { codigo: c.cupon.codigo, tipo: c.cupon.tipo } : null,
    cuponError: c.cuponError,
  });
}
