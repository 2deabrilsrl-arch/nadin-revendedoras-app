// API: CAMBIAR ESTADO DE CONSOLIDACION - GAMIFICACIÓN CORREGIDA
// Ubicación: app/api/consolidaciones/[id]/estado/route.ts
// CORRECCIÓN: Llama a gamificación UNA SOLA VEZ después de actualizar todos los pedidos

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enviarNotificacionGeneral } from '@/lib/notifications';
import { processGamificationAfterSale } from '@/lib/gamification';

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

    console.log(`\n📄 ========================================`);
    console.log(`📄 CAMBIO DE ESTADO: ${consolidacion.estado} → ${nuevoEstado}`);
    console.log(`📄 Consolidación: ${id}`);
    console.log(`📄 Pedidos: ${pedidoIds.length}`);
    console.log(`📄 ========================================`);

    // Preparar data de actualización para CONSOLIDACION
    const updateData: any = { estado: nuevoEstado };

    // Agregar timestamps según estado
    if (nuevoEstado === 'armado') {
      updateData.armadoEn = ahora;
      
    } else if (nuevoEstado === 'pagado') {
      updateData.pagadoEn = ahora;
      
    } else if (nuevoEstado === 'completado') {
      updateData.completadoEn = ahora;
      updateData.cerrado = true;
      
    } else if (nuevoEstado === 'despachado') {
      updateData.completadoEn = ahora;
      updateData.cerrado = true;
    }

    // Actualizar consolidación
    const actualizada = await prisma.consolidacion.update({
      where: { id },
      data: updateData
    });

    // ✅ Actualizar AMBOS campos en PEDIDOS
    const pedidoUpdateData: any = {};

    switch (nuevoEstado) {
      case 'armado':
        pedidoUpdateData.orderStatus = 'armado_completo';
        pedidoUpdateData.estado = 'armado';
        pedidoUpdateData.armadoCompletoAt = ahora;
        break;
        
      case 'pagado':
        // 🎮 CLAVE: Cuando se paga, marcar como entregado + pagado para activar gamificación
        pedidoUpdateData.orderStatus = 'entregado';
        pedidoUpdateData.estado = 'entregado';
        pedidoUpdateData.paidToNadin = true;
        pedidoUpdateData.paidToNadinAt = ahora;
        pedidoUpdateData.pagadoAt = ahora;
        pedidoUpdateData.paidByClient = true;  // ✅ ESTO ACTIVA GAMIFICACIÓN
        pedidoUpdateData.paidByClientAt = ahora;
        pedidoUpdateData.entregadoAt = ahora;
        break;
        
      case 'despachado':
        pedidoUpdateData.orderStatus = 'despachado';
        pedidoUpdateData.estado = 'despachado';
        pedidoUpdateData.enviadoAt = ahora;
        break;
        
      case 'completado':
        pedidoUpdateData.orderStatus = 'entregado';
        pedidoUpdateData.estado = 'completado';
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

    // 🎮 GAMIFICACIÓN: Se activa SOLO cuando se marca como "pagado"
    // ✅ CORRECCIÓN: Llamar UNA SOLA VEZ después de actualizar todos los pedidos
    if (nuevoEstado === 'pagado') {
      try {
        console.log(`\n🎮 ========================================`);
        console.log(`🎮 ACTIVANDO GAMIFICACIÓN`);
        console.log(`🎮 ========================================`);
        
        // Obtener todos los pedidos de la consolidación con sus líneas
        const pedidos = await prisma.pedido.findMany({
          where: { id: { in: pedidoIds } },
          include: { lineas: true }
        });

        // Calcular total de venta de TODA la consolidación
        const totalVentaConsolidacion = pedidos.reduce((sum, pedido) => {
          const totalPedido = pedido.lineas.reduce((lineSum, linea) => {
            return lineSum + (linea.venta * linea.qty);
          }, 0);
          return sum + totalPedido;
        }, 0);

        console.log(`   💰 Total venta consolidación: $${totalVentaConsolidacion}`);
        console.log(`   📦 Cantidad de pedidos: ${pedidos.length}`);

        // 🎮 ✅ CORRECCIÓN: Llamar UNA SOLA VEZ
        // La función processGamificationAfterSale ya recalcula TODO
        const result = await processGamificationAfterSale(
          consolidacion.userId,
          totalVentaConsolidacion
        );

        if (result && result.success) {
          console.log(`   ✅ Gamificación procesada exitosamente`);
          console.log(`   🎯 Nivel actual: ${result.level}`);
          console.log(`   💎 Puntos ganados: ${result.points || 0}`);
        } else {
          console.log(`   ⚠️ Error en gamificación:`, result?.error || 'Unknown error');
        }

        console.log(`\n🎮 ========================================`);
        console.log(`🎮 GAMIFICACIÓN COMPLETADA`);
        console.log(`🎮 ========================================\n`);
        
      } catch (gamError) {
        console.error('⚠️ Error en gamificación (continuando):', gamError);
        console.error('Stack trace:', (gamError as Error).stack);
      }
    }

    // Enviar notificación a revendedora
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

    console.log(`✅ Consolidacion ${id} cambió de estado: ${consolidacion.estado} -> ${nuevoEstado}\n`);

    return NextResponse.json(actualizada);

  } catch (error) {
    console.error('❌ Error cambiando estado:', error);
    return NextResponse.json(
      { error: 'Error al cambiar estado' },
      { status: 500 }
    );
  }
}
