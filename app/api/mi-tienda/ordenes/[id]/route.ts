// Acciones sobre un pedido web: marcar pagada, enviar a Nadin, lista, entregada, cancelar
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAndTienda, noAuth, bad } from '@/lib/mi-tienda';
import { marcarPagada, enviarANadin } from '@/lib/tienda-checkout';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getUserAndTienda();
  if (!ctx) return noAuth();
  const orden = await prisma.ordenTienda.findFirst({ where: { id: params.id, tiendaId: ctx.tienda.id } });
  if (!orden) return bad('Pedido no encontrado.', 404);
  const body: any = await req.json().catch(() => ({}));
  const { accion } = body;

  try {
    switch (accion) {
      case 'marcar_pagada':
        if (orden.estado !== 'pendiente_pago') return bad('El pedido no está pendiente de pago.');
        await marcarPagada(orden.id);
        break;
      case 'enviar_nadin':
        await enviarANadin(orden.id, ctx.user.id, {
          consolidar: body.consolidar !== false,
          formaPago: body.formaPago,
          tipoEnvio: body.tipoEnvio,
          transporteNombre: body.transporteNombre,
        });
        break;
      case 'marcar_lista':
        if (!['pagada', 'enviada_nadin'].includes(orden.estado)) return bad('Primero tiene que estar pagado.');
        await prisma.ordenTienda.update({ where: { id: orden.id }, data: { estado: 'lista' } });
        break;
      case 'marcar_entregada':
        if (!['pagada', 'enviada_nadin', 'lista'].includes(orden.estado)) return bad('Primero tiene que estar pagado.');
        await prisma.ordenTienda.update({ where: { id: orden.id }, data: { estado: 'entregada' } });
        break;
      case 'cancelar':
        if (orden.pedidoId) return bad('Este pedido ya se envió a Nadin. Cancelalo desde "Mis pedidos" o hablá con Nadin.');
        await prisma.$transaction(async (tx) => {
          await tx.ordenTienda.update({ where: { id: orden.id }, data: { estado: 'cancelada', canceladaAt: new Date() } });
          if (orden.cuponCodigo) {
            await tx.tiendaCupon.updateMany({
              where: { tiendaId: ctx.tienda.id, codigo: orden.cuponCodigo, usos: { gt: 0 } },
              data: { usos: { decrement: 1 } },
            });
          }
        });
        break;
      default:
        return bad('Acción inválida.');
    }
  } catch (e: any) {
    return bad(e?.message || 'No se pudo actualizar.');
  }
  const upd = await prisma.ordenTienda.findUnique({ where: { id: orden.id }, include: { items: true } });
  return NextResponse.json({ orden: upd });
}
