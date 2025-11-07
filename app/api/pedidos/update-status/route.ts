import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processGamificationAfterSale, recalculateGamificationAfterCancel } from '@/lib/gamification';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, orderStatus, paidToNadin, paidByClient, estado } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId es requerido' },
        { status: 400 }
      );
    }

    // Obtener pedido actual ANTES de actualizar
    const pedidoAnterior = await prisma.pedido.findUnique({
      where: { id: orderId },
      include: { lineas: true }
    });

    if (!pedidoAnterior) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // Construir objeto de actualización
    const updateData: any = {
      updatedAt: new Date()
    };

    // Actualizar estado del pedido y su fecha correspondiente
    if (orderStatus !== undefined) {
      updateData.orderStatus = orderStatus;
      
      const now = new Date();
      switch (orderStatus) {
        case 'sent_to_nadin':
          updateData.sentToNadinAt = now;
          break;
        case 'received_nadin':
          updateData.receivedNadinAt = now;
          break;
        case 'sent_to_client':
          updateData.sentToClientAt = now;
          break;
        case 'delivered':
          updateData.deliveredAt = now;
          updateData.estado = 'entregado'; // Sincronizar campo estado
          break;
      }
    }

    // Actualizar estado manual si se provee
    if (estado !== undefined) {
      updateData.estado = estado;
    }

    // Actualizar pagos y sus fechas
    if (paidToNadin !== undefined) {
      updateData.paidToNadin = paidToNadin;
      if (paidToNadin) {
        updateData.paidToNadinAt = new Date();
      }
    }

    if (paidByClient !== undefined) {
      updateData.paidByClient = paidByClient;
      if (paidByClient) {
        updateData.paidByClientAt = new Date();
      }
    }

    // Actualizar pedido en la DB
    const updatedOrder = await prisma.pedido.update({
      where: { id: orderId },
      data: updateData,
      include: {
        lineas: true
      }
    });

    console.log('✅ Pedido actualizado:', orderId, updateData);

    // 🎮 GAMIFICACIÓN: Verificar si se debe activar o recalcular
    
    const estabaCompletado = 
      (pedidoAnterior.orderStatus === 'delivered' || pedidoAnterior.estado === 'entregado') && 
      pedidoAnterior.paidByClient === true &&
      pedidoAnterior.estado !== 'cancelado';
    
    const ahoraCompletado = 
      (updatedOrder.orderStatus === 'delivered' || updatedOrder.estado === 'entregado') && 
      updatedOrder.paidByClient === true &&
      updatedOrder.estado !== 'cancelado';
    
    const fueCancelado = updatedOrder.estado === 'cancelado';

    // Calcular monto total de venta
    const totalVenta = updatedOrder.lineas.reduce((sum, linea) => {
      return sum + (linea.venta * linea.qty);
    }, 0);

    let gamificationResult = null;

    // Caso 1: Se completó el pedido (entregado + pagado + NO cancelado)
    if (!estabaCompletado && ahoraCompletado) {
      gamificationResult = await processGamificationAfterSale(
        updatedOrder.userId, 
        totalVenta
      );
    }

    // Caso 2: Se canceló un pedido (recalcular todo sin restar puntos)
    if (fueCancelado) {
      gamificationResult = await recalculateGamificationAfterCancel(
        updatedOrder.userId
      );
    }

    return NextResponse.json({
      ...updatedOrder,
      gamification: {
        wasCompleted: estabaCompletado,
        isCompleted: ahoraCompletado,
        wasCanceled: fueCancelado,
        result: gamificationResult
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando pedido:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el pedido' },
      { status: 500 }
    );
  }
}
