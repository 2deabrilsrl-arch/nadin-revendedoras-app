// API: Pedidos - COMPLETO CON DELETE
// Ubicación: app/api/pedidos/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET - Obtener un pedido por ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        lineas: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            telefono: true
          }
        }
      }
    });

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(pedido);

  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    return NextResponse.json(
      { error: 'Error al obtener pedido' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Actualizar pedido
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    // CASO 1: Cambiar estado
    if (body.estado) {
      const pedido = await prisma.pedido.update({
        where: { id },
        data: {
          estado: body.estado,
          orderStatus: body.orderStatus || body.estado
        }
      });

      return NextResponse.json({
        success: true,
        pedido
      });
    }

    // CASO 2: Eliminar líneas específicas
    if (body.action === 'eliminar_lineas' && body.lineasIds) {
      const { lineasIds } = body;

      if (!Array.isArray(lineasIds) || lineasIds.length === 0) {
        return NextResponse.json(
          { error: 'lineasIds debe ser un array con al menos un ID' },
          { status: 400 }
        );
      }

      console.log(`🗑️ Eliminando ${lineasIds.length} líneas del pedido ${id}`);

      const deletedCount = await prisma.linea.deleteMany({
        where: {
          id: { in: lineasIds },
          pedidoId: id
        }
      });

      console.log(`✅ Eliminadas ${deletedCount.count} líneas`);

      const lineasRestantes = await prisma.linea.count({
        where: { pedidoId: id }
      });

      if (lineasRestantes === 0) {
        await prisma.pedido.update({
          where: { id },
          data: {
            estado: 'cancelado',
            orderStatus: 'cancelado'
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Todas las líneas eliminadas, pedido cancelado',
          lineasEliminadas: deletedCount.count,
          pedidoCancelado: true
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Líneas eliminadas exitosamente',
        lineasEliminadas: deletedCount.count,
        lineasRestantes
      });
    }

    return NextResponse.json(
      { error: 'Acción no reconocida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error en PATCH:', error);
    return NextResponse.json(
      { error: 'Error al actualizar pedido' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Cancelar y eliminar pedido completamente
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('🗑️ Iniciando cancelación del pedido:', id);

    // 1. Buscar el pedido
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        lineas: true
      }
    });

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // 2. Si el pedido está en una consolidación, quitarlo
    if (pedido.consolidacionId) {
      console.log('📦 Pedido está en consolidación:', pedido.consolidacionId);

      const consolidacion = await prisma.consolidacion.findUnique({
        where: { id: pedido.consolidacionId }
      });

      if (consolidacion) {
        // Parsear pedidoIds
        let pedidoIds: string[] = [];
        try {
          pedidoIds = JSON.parse(consolidacion.pedidoIds);
        } catch (error) {
          console.error('Error parseando pedidoIds:', error);
        }

        // Quitar el pedido del array
        const nuevosPedidoIds = pedidoIds.filter(pid => pid !== id);

        if (nuevosPedidoIds.length === 0) {
          // Si no quedan pedidos, eliminar la consolidación
          console.log('🗑️ Eliminando consolidación vacía');
          await prisma.consolidacion.delete({
            where: { id: pedido.consolidacionId }
          });
        } else {
          // Actualizar consolidación sin este pedido
          console.log(`✅ Quitando pedido de consolidación (quedan ${nuevosPedidoIds.length})`);
          await prisma.consolidacion.update({
            where: { id: pedido.consolidacionId },
            data: {
              pedidoIds: JSON.stringify(nuevosPedidoIds)
            }
          });
        }
      }
    }

    // 3. Eliminar líneas del pedido
    console.log(`🗑️ Eliminando ${pedido.lineas.length} líneas`);
    await prisma.linea.deleteMany({
      where: { pedidoId: id }
    });

    // 4. Eliminar el pedido
    console.log('🗑️ Eliminando pedido');
    await prisma.pedido.delete({
      where: { id }
    });

    console.log('✅ Pedido eliminado completamente');

    return NextResponse.json({
      success: true,
      message: 'Pedido cancelado y eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando pedido:', error);
    return NextResponse.json(
      { error: 'Error al eliminar pedido' },
      { status: 500 }
    );
  }
}
