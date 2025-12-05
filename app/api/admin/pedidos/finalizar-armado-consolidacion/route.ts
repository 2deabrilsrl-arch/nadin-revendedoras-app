// API: FINALIZAR ARMADO DE CONSOLIDACION CON ESTADOS
// Ubicacion: app/api/admin/pedidos/finalizar-armado-consolidacion/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { consolidacionId, productosArmados, productosFaltantes, productosParciales } = body;

    if (!consolidacionId) {
      return NextResponse.json({ error: 'Falta consolidacionId' }, { status: 400 });
    }

    // Obtener consolidación
    const consolidacion = await prisma.consolidacion.findUnique({
      where: { id: consolidacionId },
      include: { user: true }
    });

    if (!consolidacion) {
      return NextResponse.json({ error: 'Consolidación no encontrada' }, { status: 404 });
    }

    const pedidoIds = JSON.parse(consolidacion.pedidoIds);
    const ahora = new Date();

    // Agrupar productos por pedido
    const productosPorPedido: any = {};
    
    [...productosArmados, ...productosFaltantes, ...productosParciales].forEach((prod: any) => {
      if (!productosPorPedido[prod.pedidoId]) {
        productosPorPedido[prod.pedidoId] = {
          armados: [],
          faltantes: [],
          parciales: []
        };
      }
    });

    productosArmados.forEach((prod: any) => {
      productosPorPedido[prod.pedidoId].armados.push(prod);
    });

    productosFaltantes.forEach((prod: any) => {
      productosPorPedido[prod.pedidoId].faltantes.push(prod);
    });

    productosParciales.forEach((prod: any) => {
      productosPorPedido[prod.pedidoId].parciales.push(prod);
    });

    // Actualizar cada pedido
    for (const pedidoId of pedidoIds) {
      const pedido = await prisma.pedido.findUnique({
        where: { id: pedidoId },
        include: { lineas: true }
      });

      if (!pedido) continue;

      const productosPedido = productosPorPedido[pedidoId] || { armados: [], faltantes: [], parciales: [] };

      // ✅ ACTUALIZAR ESTADO AUTOMÁTICAMENTE
      await prisma.pedido.update({
        where: { id: pedidoId },
        data: {
          estado: 'armado',
          orderStatus: 'armado_completo',
          armadoCompletoAt: ahora,
          armadoEn: ahora,
          armadoPor: 'nadinlenceria@gmail.com',
          productosOriginales: pedido.lineas.length,
          productosArmados: productosPedido.armados.length + productosPedido.parciales.length,
          productosFaltantes: productosPedido.faltantes.length
        }
      });

      console.log(`✅ Pedido ${pedidoId} actualizado a: armado_completo`);

      // Crear notificación si hay ajustes
      if (productosPedido.faltantes.length > 0 || productosPedido.parciales.length > 0) {
        await prisma.notificacion.create({
          data: {
            userId: pedido.userId,
            tipo: 'pedido_ajustado',
            titulo: '⚠️ Ajustes en tu pedido',
            mensaje: `Tu pedido #${pedidoId.slice(0, 8)} tiene ${productosPedido.faltantes.length} productos faltantes y ${productosPedido.parciales.length} parciales.`,
            leida: false,
            metadata: JSON.stringify({
              pedidoId,
              productosFaltantes: productosPedido.faltantes.length,
              productosParciales: productosPedido.parciales.length
            })
          }
        });
      }
    }

    // Actualizar consolidación
    await prisma.consolidacion.update({
      where: { id: consolidacionId },
      data: {
        completadoEn: ahora,
        armadoEn: ahora,
        estado: 'armado'
      }
    });

    console.log(`✅ Consolidación ${consolidacionId} finalizada - Total pedidos: ${pedidoIds.length}`);

    return NextResponse.json({
      success: true,
      message: 'Armado finalizado correctamente',
      pedidosActualizados: pedidoIds.length
    });

  } catch (error) {
    console.error('Error finalizando armado:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
