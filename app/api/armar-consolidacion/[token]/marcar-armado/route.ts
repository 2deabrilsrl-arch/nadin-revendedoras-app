// API: Marcar Armado CON Descuentos y Productos Agregados
// Ubicación: app/api/armar-consolidacion/[token]/marcar-armado/route.ts
// VERSIÓN: Con costoReal, gananciaNeta, descuentos y productos agregados

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const body = await request.json() as any;
    const { 
      productosArmados, 
      productosAgregados,
      descuentoTotal,
      tipoDescuentoTotal,
      totales,
      resumen 
    } = body;

    console.log('\n🔧 ========================================');
    console.log('🔧 FINALIZANDO ARMADO CON DESCUENTOS');
    console.log('🔧 ========================================');

    // ✅ Buscar consolidación
    const consolidacion = await prisma.consolidacion.findFirst({
      where: {
        accessTokens: {
          token: token,
          expiresAt: { gt: new Date() }
        }
      },
      include: { user: true }
    });

    if (!consolidacion) {
      return NextResponse.json(
        { error: 'Consolidación no encontrada' },
        { status: 404 }
      );
    }

    console.log(`📦 Consolidación: ${consolidacion.id}`);
    console.log(`👤 Revendedora: ${consolidacion.user.name}`);
    
    // ✅ Información de totales (si están disponibles)
    if (totales) {
      console.log(`💰 Total original: $${totales.totalMayoristaOriginal?.toFixed(2) || '0.00'}`);
      console.log(`💰 Total con descuentos: $${totales.totalFinal?.toFixed(2) || '0.00'}`);
      const descuentoAplicado = (totales.totalMayoristaOriginal || 0) - (totales.totalFinal || 0);
      if (descuentoAplicado > 0) {
        console.log(`📊 Descuento total aplicado: $${descuentoAplicado.toFixed(2)}`);
      }
    }

    const ahora = new Date();

    // ✅ Parsear pedidoIds
    const pedidoIds = JSON.parse(consolidacion.pedidoIds);
    console.log(`📋 Pedidos incluidos: ${pedidoIds.length}`);

    // ✅ NUEVO: Actualizar consolidación con datos de armado Y descuentos
    const updateData: any = {
      armadoEn: ahora,
      estado: 'armado'
    };

    // ✅ Si hay totales, guardar costoReal y gananciaNeta
    if (totales && totales.totalFinal !== undefined) {
      updateData.costoReal = totales.totalFinal;
      
      // Calcular ganancia neta
      if (totales.totalVenta !== undefined) {
        updateData.gananciaNeta = totales.totalVenta - totales.totalFinal;
        console.log(`💎 Ganancia neta: $${updateData.gananciaNeta.toFixed(2)}`);
      }
    }

    await prisma.consolidacion.update({
      where: { id: consolidacion.id },
      data: updateData
    });

    console.log('✅ Consolidación actualizada con estado: armado');
    if (updateData.costoReal !== undefined) {
      console.log('✅ costoReal y gananciaNeta guardados en BD');
    }

    // ✅ Actualizar pedidos
    await prisma.pedido.updateMany({
      where: { id: { in: pedidoIds } },
      data: {
        estado: 'armado',
        orderStatus: 'armado_completo',
        armadoCompletoAt: ahora,
        armadoEn: ahora
      }
    });

    console.log(`✅ ${pedidoIds.length} pedidos actualizados`);

    // ✅ NUEVO: Guardar productos agregados en la BD
    if (productosAgregados && productosAgregados.length > 0) {
      console.log(`\n📦 ========================================`);
      console.log(`📦 GUARDANDO PRODUCTOS AGREGADOS`);
      console.log(`📦 ========================================`);
      console.log(`📦 Cantidad de productos agregados: ${productosAgregados.length}`);

      // Crear un nuevo pedido para productos agregados
      const nuevoPedido = await prisma.pedido.create({
        data: {
          userId: consolidacion.userId,
          cliente: '➕ Productos Agregados',
          telefono: consolidacion.user.telefono,
          nota: 'Productos agregados durante el armado de la consolidación',
          estado: 'armado',
          orderStatus: 'armado_completo',
          consolidacionId: consolidacion.id,
          armadoEn: ahora,
          armadoCompletoAt: ahora,
          sentToNadinAt: consolidacion.enviadoAt
        }
      });

      console.log(`✅ Pedido creado: ${nuevoPedido.id}`);

      // Crear las líneas de productos agregados
      for (const prod of productosAgregados) {
        await prisma.linea.create({
          data: {
            pedidoId: nuevoPedido.id,
            productId: prod.sku || 'agregado-manual',
            variantId: prod.sku || 'agregado-manual',
            sku: prod.sku,
            brand: prod.marca,
            name: prod.nombre,
            talle: prod.talle,
            color: prod.color,
            qty: prod.cantidad,
            mayorista: prod.precioMayorista,
            venta: prod.precioVenta,
            cantidadOriginal: prod.cantidad,
            cliente: '➕ Productos Agregados'
          }
        });

        console.log(`   ✅ Línea creada: ${prod.nombre} (${prod.talle}/${prod.color}) x${prod.cantidad}`);
      }

      // Agregar el nuevo pedido a pedidoIds
      const nuevoPedidoIds = [...pedidoIds, nuevoPedido.id];
      await prisma.consolidacion.update({
        where: { id: consolidacion.id },
        data: {
          pedidoIds: JSON.stringify(nuevoPedidoIds)
        }
      });

      console.log(`✅ Consolidación actualizada con ${productosAgregados.length} productos agregados`);
      console.log(`📦 ========================================\n`);
    }


    // ✅ Crear notificación DETALLADA
    let mensajeNotificacion = '📦 Tu consolidación ha sido armada\n\n';

    if (resumen.completos.length > 0) {
      mensajeNotificacion += `✅ Productos completos (${resumen.completos.length}):\n`;
      // Mostrar máximo 5 productos, si hay más indicarlo
      resumen.completos.slice(0, 5).forEach((p: any) => {
        mensajeNotificacion += `• ${p.nombre} - ${p.cantidadDisponible} unidad(es)\n`;
      });
      if (resumen.completos.length > 5) {
        mensajeNotificacion += `... y ${resumen.completos.length - 5} más\n`;
      }
      mensajeNotificacion += '\n';
    }

    if (resumen.parciales.length > 0) {
      mensajeNotificacion += `⚠️ Productos con stock parcial (${resumen.parciales.length}):\n`;
      resumen.parciales.forEach((p: any) => {
        const faltante = p.cantidadPedida - p.cantidadDisponible;
        mensajeNotificacion += `• ${p.nombre} - Solo ${p.cantidadDisponible} de ${p.cantidadPedida} (-${faltante})\n`;
      });
      mensajeNotificacion += '\n';
    }

    if (resumen.sinStock.length > 0) {
      mensajeNotificacion += `❌ Productos sin stock (${resumen.sinStock.length}):\n`;
      resumen.sinStock.forEach((p: any) => {
        mensajeNotificacion += `• ${p.nombre} - No disponible\n`;
      });
      mensajeNotificacion += '\n';
    }

    // ✅ NUEVO: Informar sobre productos agregados
    if (productosAgregados && productosAgregados.length > 0) {
      mensajeNotificacion += `➕ Productos agregados durante el armado (${productosAgregados.length}):\n`;
      productosAgregados.forEach((p: any) => {
        mensajeNotificacion += `• ${p.nombre} - ${p.cantidad} unidad(es)\n`;
      });
      mensajeNotificacion += '\n';
    }

    // ✅ NUEVO: Informar sobre descuentos
    if (totales) {
      const descuentoAplicado = (totales.totalMayoristaOriginal || 0) - (totales.totalFinal || 0);
      if (descuentoAplicado > 0) {
        mensajeNotificacion += `💰 DESCUENTO APLICADO:\n`;
        mensajeNotificacion += `• Total original: $${totales.totalMayoristaOriginal.toFixed(2)}\n`;
        mensajeNotificacion += `• Descuento: -$${descuentoAplicado.toFixed(2)}\n`;
        mensajeNotificacion += `• Total a pagar a Nadin: $${totales.totalFinal.toFixed(2)}\n\n`;
      }
    }

    if (resumen.parciales.length > 0 || resumen.sinStock.length > 0) {
      mensajeNotificacion += '💬 Revisá el chat para más detalles o consultas.';
    } else if (productosAgregados && productosAgregados.length > 0) {
      mensajeNotificacion += '💬 Se agregaron productos adicionales. Revisá el detalle arriba.';
    } else {
      mensajeNotificacion += '🎉 ¡Todo el pedido está completo!';
    }

    // Crear notificación
    await prisma.notificacion.create({
      data: {
        userId: consolidacion.userId,
        tipo: 'consolidacion_armada',
        titulo: '📦 Consolidación Armada',
        mensaje: mensajeNotificacion,
        leida: false,
        metadata: JSON.stringify({
          consolidacionId: consolidacion.id,
          completos: resumen.completos.length,
          parciales: resumen.parciales.length,
          sinStock: resumen.sinStock.length,
          agregados: productosAgregados?.length || 0,
          descuentoAplicado: totales ? ((totales.totalMayoristaOriginal || 0) - (totales.totalFinal || 0)) > 0 : false,
          totalFinal: totales?.totalFinal || null
        })
      }
    });

    console.log('✅ Notificación creada para la revendedora');

    // ✅ Mensaje automático al chat si hay cambios o descuentos
    if (resumen.parciales.length > 0 || 
        resumen.sinStock.length > 0 || 
        (productosAgregados && productosAgregados.length > 0) ||
        (totales && ((totales.totalMayoristaOriginal || 0) - (totales.totalFinal || 0)) > 0)) {
      
      let mensajeChat = '🔔 El armado de tu consolidación está completo:\n\n';
      
      if (resumen.completos.length > 0) {
        mensajeChat += `✅ ${resumen.completos.length} producto(s) completo(s)\n`;
      }
      if (resumen.parciales.length > 0) {
        mensajeChat += `⚠️ ${resumen.parciales.length} producto(s) con stock parcial\n`;
      }
      if (resumen.sinStock.length > 0) {
        mensajeChat += `❌ ${resumen.sinStock.length} producto(s) sin stock\n`;
      }
      if (productosAgregados && productosAgregados.length > 0) {
        mensajeChat += `➕ ${productosAgregados.length} producto(s) agregado(s)\n`;
      }
      
      // Información de descuentos
      if (totales) {
        const descuentoAplicado = (totales.totalMayoristaOriginal || 0) - (totales.totalFinal || 0);
        if (descuentoAplicado > 0) {
          mensajeChat += `\n💰 Se aplicó un descuento de $${descuentoAplicado.toFixed(2)}\n`;
          mensajeChat += `💵 Total a pagar: $${totales.totalFinal.toFixed(2)}\n`;
        }
      }
      
      mensajeChat += '\n📋 Revisá los detalles arriba. Si tenés dudas, escribime.';

      await prisma.consolidacionMensaje.create({
        data: {
          consolidacionId: consolidacion.id,
          autorNombre: 'Nadin',
          autorTipo: 'vendedora',
          mensaje: mensajeChat,
          leido: false
        }
      });

      console.log('✅ Mensaje automático enviado al chat');
    }

    console.log('🔧 ========================================');
    console.log('🔧 ARMADO FINALIZADO EXITOSAMENTE');
    console.log('🔧 ========================================\n');

    return NextResponse.json(
      { 
        success: true,
        mensaje: 'Armado completado y notificación enviada',
        consolidacionId: consolidacion.id,
        totales: totales ? {
          totalOriginal: totales.totalMayoristaOriginal,
          totalFinal: totales.totalFinal,
          descuento: (totales.totalMayoristaOriginal || 0) - (totales.totalFinal || 0),
          gananciaEstimada: totales.gananciaEstimada
        } : null
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error en marcar-armado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
