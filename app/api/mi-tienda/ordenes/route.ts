// Pedidos web de mi tienda
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAndTienda, noAuth, bad } from '@/lib/mi-tienda';
import { vaANadin, cotizar, marcarPagada } from '@/lib/tienda-checkout';
import { getTiendaBySite } from '@/lib/tienda';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const estado = new URL(req.url).searchParams.get('estado');
  const ordenes = await prisma.ordenTienda.findMany({
    where: { tiendaId: ctx.tienda.id, ...(estado ? { estado } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { items: true },
  });
  // Pedidos que se mandaron a Nadin "sin consolidar": todavía se pueden juntar y enviar
  const pedidoIds = ordenes.map((o) => o.pedidoId).filter(Boolean) as string[];
  const pedidos = pedidoIds.length ? await prisma.pedido.findMany({ where: { id: { in: pedidoIds } }, select: { id: true, estado: true } }) : [];
  const estadoPedido = new Map(pedidos.map((p) => [p.id, p.estado]));
  const conEstado = ordenes.map((o) => ({
    ...o,
    paraEnviar:
      (['pagada', 'pendiente_pago'].includes(o.estado) && !o.pedidoId && o.items.some(vaANadin)) ||
      (o.estado === 'enviada_nadin' && !!o.pedidoId && estadoPedido.get(o.pedidoId) === 'pendiente'),
  }));
  const pendientesEnvio = conEstado.filter((o) => o.paraEnviar && o.estado !== 'pendiente_pago').length;
  return NextResponse.json({ ordenes: conEstado, pendientesEnvio });
}

// ---------------------------------------------------------------------
// Venta manual: la revendedora carga una venta que hizo por WhatsApp o en persona.
// Queda como un pedido más: descuenta su stock, se manda a Nadin y suma en estadísticas.
// ---------------------------------------------------------------------
const str = (v: any, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const PAGOS_MANUAL: Record<string, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia', mercadopago: 'Mercado Pago', tarjeta: 'Tarjeta', otro: 'Otro' };
const ENTREGAS_MANUAL: Record<string, string> = { en_mano: 'Entregado en mano', retiro: 'Retira', envio: 'Envío' };

export async function POST(req: Request) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const tienda = await getTiendaBySite(ctx.tienda.slug);
  if (!tienda) return bad('Tienda no encontrada.', 404);
  const b: any = await req.json().catch(() => ({}));

  const nombre = str(b.cliente?.nombre, 100);
  const telefono = str(b.cliente?.telefono, 30);
  const email = str(b.cliente?.email, 120).toLowerCase();
  if (nombre.length < 2) return bad('Poné el nombre de la clienta.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('El email no es válido.');
  const pagoTipo = PAGOS_MANUAL[b.pago] ? String(b.pago) : 'otro';
  const entregaTipo = ENTREGAS_MANUAL[b.entrega] ? String(b.entrega) : 'en_mano';

  const entrada = (Array.isArray(b.items) ? b.items : []).slice(0, 50);
  const c = await cotizar(tienda, { items: entrada.map((i: any) => ({ productId: String(i.productId || ''), variantId: String(i.variantId || ''), qty: Number(i.qty) })) });
  if (c.errores.length) return bad(c.errores.join(' '), 409);
  if (!c.lineas.length) return bad('Agregá al menos un producto.');

  // Precio de venta: el de la tienda, o el que puso ella (puede haber negociado)
  const precioPedido = new Map<string, number>();
  for (const i of entrada) {
    const p = Math.round(Number(i.precio));
    if (p > 0 && p <= 99999999) precioPedido.set(String(i.variantId), p);
  }
  const lineas = c.lineas.map((l) => ({ ...l, precio: precioPedido.get(l.variantId) ?? l.precio }));
  const subtotal = lineas.reduce((a, l) => a + l.precio * l.qty, 0);
  const envioCosto = entregaTipo === 'envio' ? Math.max(0, Math.min(Math.round(Number(b.envioCosto) || 0), 9999999)) : 0;
  const descuento = Math.max(0, Math.min(Math.round(Number(b.descuento) || 0), subtotal));
  const total = subtotal - descuento + envioCosto;

  const orden = await prisma.ordenTienda.create({
    data: {
      tiendaId: tienda.id,
      origen: 'manual',
      metodoPagoTipo: pagoTipo,
      metodoPagoNombre: PAGOS_MANUAL[pagoTipo],
      envioTipo: entregaTipo,
      envioNombre: ENTREGAS_MANUAL[entregaTipo],
      envioCosto,
      subtotal,
      descuento,
      descuentoPromo: 0,
      total,
      totalMayorista: c.totalMayorista,
      clienteNombre: nombre,
      clienteEmail: email || null,
      clienteTelefono: telefono || '-',
      direccion: entregaTipo === 'envio' && str(b.direccion, 300) ? { calle: str(b.direccion, 300) } : undefined,
      nota: str(b.nota, 500) || null,
      items: { create: lineas.map((l) => ({ ...l, imagen: l.imagen || null })) },
    },
  });
  // Si ya le pagaron, queda cobrada (descuenta su stock y, si tiene el envío automático, va a Nadin)
  if (b.pagada) await marcarPagada(orden.id, undefined, { silencioso: true });
  const final = await prisma.ordenTienda.findUnique({ where: { id: orden.id }, select: { id: true, numero: true, estado: true, total: true } });
  return NextResponse.json({ orden: final });
}
