// API: Cancelar/Eliminar Consolidación
// Ubicación: app/api/admin/consolidaciones/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Buscar consolidación
    const consolidacion = await prisma.consolidacion.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!consolidacion) {
      return NextResponse.json(
        { error: 'Consolidación no encontrada' },
        { status: 404 }
      );
    }

    const pedidoIds = JSON.parse(consolidacion.pedidoIds);

    // 🔥 Revertir pedidos a estado "pendiente"
    await prisma.pedido.updateMany({
      where: { id: { in: pedidoIds } },
      data: {
        consolidacionId: null,
        estado: 'pendiente',
        orderStatus: 'pending',
        sentToNadinAt: null
      }
    });

    // 🔥 Eliminar consolidación
    await prisma.consolidacion.delete({
      where: { id }
    });

    console.log(`✅ Consolidación ${id} cancelada`);
    console.log(`✅ ${pedidoIds.length} pedidos revertidos a pendiente`);

    // Crear notificación para la revendedora
    await prisma.notificacion.create({
      data: {
        userId: consolidacion.userId,
        tipo: 'consolidacion_cancelada',
        titulo: '⚠️ Consolidación Cancelada',
        mensaje: 'Tu consolidación fue cancelada. Los pedidos volvieron a estar disponibles para una nueva consolidación.',
        leida: false
      }
    });

    return NextResponse.json({
      success: true,
      mensaje: 'Consolidación cancelada exitosamente'
    });

  } catch (error) {
    console.error('Error cancelando consolidación:', error);
    return NextResponse.json(
      { error: 'Error al cancelar consolidación' },
      { status: 500 }
    );
  }
}
