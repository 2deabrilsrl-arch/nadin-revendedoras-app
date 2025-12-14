// ENDPOINT: FINALIZAR ARMADO (ACTUALIZACION AUTOMATICA)
// Ubicacion: app/api/admin/pedidos/finalizar-armado/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recalcularGamificacionPorPedido } from '@/lib/gamification-recalc';
import { enviarNotificacionPedidoAjustado } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const body = await request.json() as any;
    const {
      pedidoId,
      productosArmados,
      productosFaltantes,
      productosParciales
    } = body as any;

    console.log('\n========================================');
    console.log('FINALIZANDO ARMADO DE PEDIDO');
    console.log('========================================');
    console.log(`Pedido ID: ${pedidoId}`);
    console.log(`Armados: ${productosArmados.length}`);
    console.log(`Faltantes: ${productosFaltantes.length}`);
    console.log(`Parciales: ${productosParciales.length}`);

    // 1. Obtener pedido original
    const pedidoOriginal = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        user: true,
        lineas: true
      }
    });

    if (!pedidoOriginal) {
      return NextResponse.json({
        success: false,
        error: 'Pedido no encontrado'
      }, { status: 404 });
    }

    // 2. Construir lista final de productos (solo armados + parciales)
    const productosFinales = [
      ...productosArmados,
      ...productosParciales.map((p: any) => ({
        ...p,
        cantidad: p.cantidadReal,
        cantidadOriginal: p.cantidadOriginal,
        nota: `Pedido: ${p.cantidadOriginal} | Armado: ${p.cantidadReal}`
      }))
    ];

    console.log(`\nProductos finales: ${productosFinales.length}`);

    // 3. Calcular nuevos totales
    const nuevoTotalVenta = productosFinales.reduce(
      (sum: number, p: any) => sum + (p.precioVenta * p.cantidad),
      0
    );

    const nuevoTotalMayorista = productosFinales.reduce(
      (sum: number, p: any) => sum + (p.precioMayorista * p.cantidad),
      0
    );

    console.log(`Total original: $${(pedidoOriginal as any).totalVenta}`);
    console.log(`Total ajustado: $${nuevoTotalVenta}`);

    // 4. Actualizar pedido en la base de datos
    console.log('\nActualizando pedido...');

    // Primero borrar productos viejos
    await prisma.linea.deleteMany({
      where: { pedidoId: pedidoId }
    });

    // Crear nuevos productos
    await prisma.linea.createMany({
      data: productosFinales.map((p: any) => ({
        pedidoId: pedidoId,
        nombre: p.nombre,
        sku: p.sku || '',
        talle: p.talle || '',
        color: p.color || '',
        cantidad: p.cantidad,
        precioVenta: p.precioVenta,
        precioMayorista: p.precioMayorista,
        cliente: p.cliente || '',
        telefono: p.telefono || '',
        nota: p.nota || ''
      })) as any
    });

    // Actualizar el pedido
    await prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        estado: 'armado',
        totalVenta: nuevoTotalVenta,
        totalMayorista: nuevoTotalMayorista,
        productosOriginales: pedidoOriginal.lineas.length,
        productosArmados: productosFinales.length,
        productosFaltantes: productosFaltantes.length,
        armadoEn: new Date(),
        armadoPor: 'vendedora@nadin.com'
      } as any
    });

    console.log('Pedido actualizado');

    // 5. RECALCULAR GAMIFICACION
    console.log('\nRecalculando gamificacion...');

    await recalcularGamificacionPorPedido({
      usuarioId: pedidoOriginal.userId,
      pedidoId: pedidoId as any,
      productosOriginales: pedidoOriginal.lineas.length,
      productosReales: productosFinales.length,
      ventaOriginal: (pedidoOriginal as any).totalVenta,
      ventaReal: nuevoTotalVenta
    });

    console.log('Gamificacion actualizada');

    // 6. NOTIFICAR A REVENDEDORA
    if (productosFaltantes.length > 0 || productosParciales.length > 0) {
      console.log('\nEnviando notificacion a revendedora...');

      await enviarNotificacionPedidoAjustado({
        usuario: pedidoOriginal.user,
        pedidoId: pedidoId as any,
        productosArmados: productosArmados.length,
        productosFaltantes: productosFaltantes,
        productosParciales: productosParciales,
        totalOriginal: (pedidoOriginal as any).totalVenta,
        totalAjustado: nuevoTotalVenta
      });

      console.log('Notificacion enviada');
    }

    // 7. Generar resumen
    const resumen = {
      pedidoId,
      estado: 'armado',
      productosArmados: productosArmados.length,
      productosParciales: productosParciales.length,
      productosFaltantes: productosFaltantes.length,
      totalProductosFinales: productosFinales.length,
      ajusteDinero: (pedidoOriginal as any).totalVenta - nuevoTotalVenta,
      totalOriginal: (pedidoOriginal as any).totalVenta,
      totalFinal: nuevoTotalVenta
    };

    console.log('\n========================================');
    console.log('ARMADO FINALIZADO EXITOSAMENTE');
    console.log('========================================');
    console.log(JSON.stringify(resumen, null, 2));
    console.log('========================================\n');

    return NextResponse.json({
      success: true,
      mensaje: 'Pedido armado y actualizado correctamente',
      resumen,
      actualizaciones: {
        pedidoActualizado: true,
        gamificacionActualizada: true,
        notificacionEnviada: productosFaltantes.length > 0 || productosParciales.length > 0
      }
    });

  } catch (error) {
    console.error('\nERROR en finalizar-armado:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
