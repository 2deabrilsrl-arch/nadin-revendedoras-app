// API: Marcar Armado con Notificación Detallada
// Ubicación: app/api/armar-consolidacion/[token]/marcar-armado/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const body = await request.json();
    const { productosArmados, resumen } = body;

    // Buscar consolidación
    const consolidacion = await prisma.consolidacion.findFirst({
      where: {
        accessTokens: {
          token: token,
          expiresAt: {
            gt: new Date()
          }
        }
      },
      include: {
        user: true
      }
    });

    if (!consolidacion) {
      return NextResponse.json(
        { error: 'Consolidación no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar consolidación como armada
    await prisma.consolidacion.update({
      where: { id: consolidacion.id },
      data: {
        armadoEn: new Date(),
        estado: 'armado'
      }
    });

    // ✅ Crear notificación DETALLADA para la revendedora
    let mensajeNotificacion = '📦 Tu consolidación ha sido armada\n\n';

    if (resumen.completos.length > 0) {
      mensajeNotificacion += `✅ Productos completos (${resumen.completos.length}):\n`;
      resumen.completos.forEach((p: any) => {
        mensajeNotificacion += `• ${p.nombre} - ${p.cantidadDisponible} unidad(es)\n`;
      });
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

    if (resumen.parciales.length > 0 || resumen.sinStock.length > 0) {
      mensajeNotificacion += '💬 Revisá el chat para más detalles o consultas.';
    } else {
      mensajeNotificacion += '🎉 ¡Todo el pedido está completo!';
    }

    // Crear notificación en la base de datos
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
          sinStock: resumen.sinStock.length
        })
      }
    });

    // ✅ Enviar mensaje automático al chat si hay cambios
    if (resumen.parciales.length > 0 || resumen.sinStock.length > 0) {
      let mensajeChat = 'El armado de tu consolidación está completo:\n\n';
      
      if (resumen.completos.length > 0) {
        mensajeChat += `✅ ${resumen.completos.length} producto(s) completo(s)\n`;
      }
      if (resumen.parciales.length > 0) {
        mensajeChat += `⚠️ ${resumen.parciales.length} producto(s) con stock parcial\n`;
      }
      if (resumen.sinStock.length > 0) {
        mensajeChat += `❌ ${resumen.sinStock.length} producto(s) sin stock\n`;
      }
      
      mensajeChat += '\nRevisá los detalles arriba. Si tenés dudas, escribime.';

      await prisma.consolidacionMensaje.create({
        data: {
          consolidacionId: consolidacion.id,
          autorNombre: 'Nadin',
          autorTipo: 'vendedora',
          mensaje: mensajeChat,
          leido: false
        }
      });
    }

    return NextResponse.json(
      { 
        success: true,
        mensaje: 'Armado completado y notificación enviada'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error en marcar-armado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
