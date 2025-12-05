// API: CAMBIAR ESTADO DE CONSOLIDACION - CORREGIDO
// Ubicacion: app/api/consolidaciones/[id]/estado/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enviarNotificacionGeneral } from '@/lib/notifications';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { nuevoEstado } = body as any;

    // Validar estado
    const estadosValidos = ['enviado', 'armando', 'armado', 'pagado', 'completado', 'despachado'];
    if (!estadosValidos.includes(nuevoEstado)) {
      return NextResponse.json(
        { error: 'Estado invalido' },
        { status: 400 }
      );
    }

    const consolidacion = await prisma.consolidacion.findUnique({
      where: { id },
      include: { 
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!consolidacion) {
      return NextResponse.json(
        { error: 'Consolidacion no encontrada' },
        { status: 404 }
      );
    }

    const pedidoIds = JSON.parse(consolidacion.pedidoIds);
    const ahora = new Date();

    // Preparar data de actualizacion
    const updateData: any = { estado: nuevoEstado };

    // ✅ CORREGIDO: Agregar timestamps segun estado
    if (nuevoEstado === 'armado') {
      // Solo marca como armado, NO como completado
      updateData.armadoEn = ahora;
      // ❌ REMOVIDO: updateData.completadoEn = ahora;
      
    } else if (nuevoEstado === 'pagado') {
      updateData.pagadoEn = ahora;
      
    } else if (nuevoEstado === 'completado') {
      // ✅ AGREGADO: Marcar como cerrado para que no vuelva a aparecer
      updateData.completadoEn = ahora;
      updateData.cerrado = true;
      
    } else if (nuevoEstado === 'despachado') {
      // ✅ AGREGADO: Marcar como cerrado para que no vuelva a aparecer
      updateData.completadoEn = ahora;
      updateData.cerrado = true;
    }

    // Actualizar consolidación
    const actualizada = await prisma.consolidacion.update({
      where: { id },
      data: updateData
    });

    // Actualizar estados de PEDIDOS también
    const pedidoUpdateData: any = {};

    switch (nuevoEstado) {
      case 'armado':
        pedidoUpdateData.orderStatus = 'armado_completo';
        pedidoUpdateData.armadoCompletoAt = ahora;
        break;
      case 'pagado':
        pedidoUpdateData.orderStatus = 'pagado';
        pedidoUpdateData.paidToNadin = true;
        pedidoUpdateData.paidToNadinAt = ahora;
        pedidoUpdateData.pagadoAt = ahora;
        break;
      case 'despachado':
        pedidoUpdateData.orderStatus = 'despachado';
        pedidoUpdateData.enviadoAt = ahora;
        break;
      case 'completado':
        pedidoUpdateData.orderStatus = 'entregado';
        pedidoUpdateData.entregadoAt = ahora;
        break;
    }

    if (Object.keys(pedidoUpdateData).length > 0) {
      await prisma.pedido.updateMany({
        where: { id: { in: pedidoIds } },
        data: pedidoUpdateData
      });

      console.log(`✅ ${pedidoIds.length} pedidos actualizados a estado: ${nuevoEstado}`);
    }

    // Enviar notificacion a revendedora
    let tituloNotif = '';
    let mensajeNotif = '';

    switch (nuevoEstado) {
      case 'armado':
        tituloNotif = '✅ Pedido armado';
        mensajeNotif = 'Tu consolidación fue armada y está lista para pagar.';
        break;
      case 'pagado':
        tituloNotif = '💰 Pago registrado';
        mensajeNotif = 'Se registró el pago de tu consolidación. Podés coordinar el retiro.';
        break;
      case 'despachado':
        tituloNotif = '🚚 Pedido despachado';
        mensajeNotif = 'Tu consolidación fue enviada. ¡Llegará pronto!';
        break;
      case 'completado':
        tituloNotif = '🎉 Pedido completado';
        mensajeNotif = 'Tu consolidación fue retirada/entregada. ¡Gracias por tu compra!';
        break;
    }

    if (tituloNotif) {
      await enviarNotificacionGeneral({
        usuarioId: consolidacion.userId,
        tipo: 'cambio_estado',
        titulo: tituloNotif,
        mensaje: mensajeNotif
      });
    }

    console.log(`✅ Consolidacion ${id} cambió de estado: ${consolidacion.estado} -> ${nuevoEstado}`);

    return NextResponse.json(actualizada);

  } catch (error) {
    console.error('Error cambiando estado:', error);
    return NextResponse.json(
      { error: 'Error al cambiar estado' },
      { status: 500 }
    );
  }
}
