// API: UPDATE STATUS CON FECHAS AUTOMATICAS Y CIERRE DE CHAT
// Ubicacion: app/api/pedidos/update-status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as any;
    const { pedidoId, orderStatus, paidToNadin, paidByClient } = body;

    if (!pedidoId) {
      return NextResponse.json({ error: 'Falta pedidoId' }, { status: 400 });
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId }
    });

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const updateData: any = {};
    const ahora = new Date();

    // ✅ ACTUALIZAR ESTADO CON FECHAS AUTOMÁTICAS
    if (orderStatus !== undefined) {
      updateData.orderStatus = orderStatus;
      
      switch (orderStatus) {
        case 'sent_to_nadin':
          updateData.sentToNadinAt = ahora;
          updateData.estado = 'enviado';
          break;
        
        case 'armado_iniciado':
          updateData.armadoIniciadoAt = ahora;
          updateData.estado = 'armando';
          break;
        
        case 'armado_completo':
          updateData.armadoCompletoAt = ahora;
          updateData.estado = 'armado';
          break;
        
        case 'pagado':
          updateData.pagadoAt = ahora;
          updateData.estado = 'pagado';
          break;
        
        case 'enviado':
          updateData.enviadoAt = ahora;
          updateData.estado = 'enviado';
          break;
        
        case 'entregado':
          updateData.entregadoAt = ahora;
          updateData.estado = 'entregado';
          break;
      }
    }

    // Pago a Nadin
    if (paidToNadin !== undefined) {
      updateData.paidToNadin = paidToNadin;
      updateData.paidToNadinAt = paidToNadin ? ahora : null;
      if (paidToNadin) {
        updateData.orderStatus = 'pagado';
        updateData.pagadoAt = ahora;
      }
    }

    // Cobro al cliente
    if (paidByClient !== undefined) {
      updateData.paidByClient = paidByClient;
      updateData.paidByClientAt = paidByClient ? ahora : null;
    }

    // Actualizar pedido
    await prisma.pedido.update({
      where: { id: pedidoId },
      data: updateData
    });

    console.log(`✅ Pedido ${pedidoId} actualizado:`, updateData);

    // ✅ SI EL PEDIDO SE ENTREGA, CERRAR CHAT DE CONSOLIDACIÓN
    if (orderStatus === 'entregado') {
      // Buscar consolidación que contiene este pedido
      const consolidaciones = await prisma.consolidacion.findMany({
        where: {
          pedidoIds: {
            contains: pedidoId
          }
        }
      });

      for (const consolidacion of consolidaciones) {
        const pedidoIds = JSON.parse(consolidacion.pedidoIds);
        
        // Verificar si TODOS los pedidos están entregados
        const todosLosPedidos = await prisma.pedido.findMany({
          where: { id: { in: pedidoIds } }
        });

        const todosEntregados = todosLosPedidos.every(p => p.orderStatus === 'entregado');

        if (todosEntregados && !consolidacion.cerrado) {
          await prisma.consolidacion.update({
            where: { id: consolidacion.id },
            data: { cerrado: true }
          });
          console.log(`✅ Chat cerrado para consolidación ${consolidacion.id}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Estado actualizado correctamente'
    });

  } catch (error) {
    console.error('Error actualizando estado:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
