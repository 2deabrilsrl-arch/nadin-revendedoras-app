// API: CANCELAR CONSOLIDACIÓN POR VENDEDORA
// Ubicación: app/api/admin/consolidaciones/[id]/cancelar-vendedora/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recalcularGamificacionCompleta } from '@/lib/gamification-recalc';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('\n========================================');
    console.log('❌ CANCELANDO CONSOLIDACIÓN (VENDEDORA)');
    console.log('========================================');
    console.log('Consolidación ID:', id);

    // Buscar consolidación
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
        { error: 'Consolidación no encontrada' },
        { status: 404 }
      );
    }

    console.log('📋 Consolidación encontrada:');
    console.log(`   Usuario: ${consolidacion.user.name}`);
    console.log(`   Estado: ${consolidacion.estado}`);
    console.log(`   Total: $${consolidacion.totalMayorista}`);

    const pedidoIds = JSON.parse(consolidacion.pedidoIds);
    console.log(`   Pedidos: ${pedidoIds.length}`);

    // 🔥 PASO 1: Marcar consolidación como cancelada
    await prisma.consolidacion.update({
      where: { id },
      data: {
        estado: 'cancelado',
        cerrado: true
      }
    });
    console.log('✅ Consolidación marcada como cancelada');

    // 🔥 PASO 2: Marcar todos los pedidos como cancelados
    await prisma.pedido.updateMany({
      where: { id: { in: pedidoIds } },
      data: {
        estado: 'cancelado',
        orderStatus: 'cancelado'
      }
    });
    console.log(`✅ ${pedidoIds.length} pedidos marcados como cancelados`);

    // 🔥 PASO 3: RECALCULAR GAMIFICACIÓN COMPLETA
    console.log('\n🎮 Recalculando gamificación...');
    try {
      const resultado = await recalcularGamificacionCompleta(consolidacion.userId);
      console.log('✅ Gamificación recalculada:');
      console.log(`   Ventas totales: $${resultado.ventaTotal}`);
      console.log(`   Nivel: ${resultado.nivel}`);
      console.log(`   Pedidos activos: ${resultado.pedidosRealizados}`);
    } catch (gamifError) {
      console.error('⚠️ Error recalculando gamificación:', gamifError);
    }

    // 🔥 PASO 4: Notificar a la revendedora
    await prisma.notificacion.create({
      data: {
        userId: consolidacion.userId,
        tipo: 'consolidacion_cancelada',
        titulo: '❌ Consolidación Cancelada',
        mensaje: `Tu consolidación fue cancelada por Nadin. Los pedidos fueron marcados como cancelados y tu gamificación ha sido recalculada. Para consultas, contactanos a nadinlenceria@gmail.com`,
        leida: false
      }
    });
    console.log('✅ Notificación enviada a revendedora');

    console.log('========================================\n');

    return NextResponse.json({
      success: true,
      message: 'Consolidación cancelada exitosamente'
    });

  } catch (error) {
    console.error('Error cancelando consolidación:', error);
    console.log('========================================\n');
    return NextResponse.json(
      { error: 'Error al cancelar consolidación' },
      { status: 500 }
    );
  }
}
