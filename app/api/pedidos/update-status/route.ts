import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, orderStatus, paidToNadin, paidByClient } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId es requerido' },
        { status: 400 }
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
          break;
      }
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

    // Actualizar en base de datos
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        lineas: true
      }
    });

    console.log('✅ Pedido actualizado:', orderId, updateData);

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('❌ Error actualizando pedido:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el pedido' },
      { status: 500 }
    );
  }
}
