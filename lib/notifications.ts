// SISTEMA DE NOTIFICACIONES
// Ubicacion: lib/notifications.ts

import { prisma } from '@/lib/prisma';

interface NotificacionPedidoAjustadoParams {
  usuario: any;
  pedidoId: string;
  productosArmados: number;
  productosFaltantes: any[];
  productosParciales: any[];
  totalOriginal: number;
  totalAjustado: number;
}

export async function enviarNotificacionPedidoAjustado(params: NotificacionPedidoAjustadoParams) {
  const {
    usuario,
    pedidoId,
    productosArmados,
    productosFaltantes,
    productosParciales,
    totalOriginal,
    totalAjustado
  } = params;

  try {
    console.log('\n========================================');
    console.log('ENVIANDO NOTIFICACION DE PEDIDO AJUSTADO');
    console.log('========================================');
    console.log(`Usuario: ${usuario.name} (${usuario.email})`);
    console.log(`Pedido: #${pedidoId}`);

    await prisma.notificacion.create({
      data: {
        userId: usuario.id,
        tipo: 'pedido_ajustado',
        titulo: `Pedido #${pedidoId.slice(-8)} - Ajustes en productos`,
        mensaje: `Tu pedido fue armado con ${productosArmados} productos. ${
          productosFaltantes.length > 0
            ? `${productosFaltantes.length} producto(s) no disponible(s).`
            : ''
        }`,
        leida: false,
        metadata: JSON.stringify({
          pedidoId,
          productosFaltantes: productosFaltantes.length,
          productosParciales: productosParciales.length
        })
      }
    });

    console.log('✅ Notificacion in-app creada');
    console.log('========================================\n');

    return {
      success: true,
      notificacionInApp: true,
      emailEnviado: false
    };

  } catch (error) {
    console.error('Error enviando notificacion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error'
    };
  }
}

/**
 * Notificacion de subida de nivel
 */
export async function notificarSubidaDeNivel(usuarioId: string, nuevoNivel: string) {
  try {
    await prisma.notificacion.create({
      data: {
        userId: usuarioId,
        tipo: 'nivel_up',
        titulo: `¡Subiste a nivel ${nuevoNivel}!`,
        mensaje: `Felicitaciones, alcanzaste el nivel ${nuevoNivel}. ¡Seguí vendiendo!`,
        leida: false
      }
    });

    console.log(`✅ Notificacion de nivel enviada a usuario ${usuarioId}`);
  } catch (error) {
    console.error('Error notificando subida de nivel:', error);
  }
}

/**
 * Notificacion de nuevo producto en catalogo
 */
export async function notificarNuevoProducto(params: {
  productoId: string;
  nombre: string;
  marca: string;
  imagen: string;
}) {
  try {
    const usuarios = await prisma.user.findMany({
      where: {
        rol: 'revendedora'
      }
    });

    await Promise.all(
      usuarios.map(usuario =>
        prisma.notificacion.create({
          data: {
            userId: usuario.id,
            tipo: 'nuevo_producto',
            titulo: `Nuevo producto: ${params.nombre}`,
            mensaje: `Ya está disponible ${params.nombre} de ${params.marca}`,
            leida: false,
            metadata: JSON.stringify({
              productoId: params.productoId,
              imagen: params.imagen
            })
          }
        })
      )
    );

    console.log(`✅ Notificacion de nuevo producto enviada a ${usuarios.length} usuarios`);
  } catch (error) {
    console.error('Error notificando nuevo producto:', error);
  }
}

/**
 * Funcion generica para enviar notificaciones
 * ✅ CORREGIDO: Acepta userId, usuarioId y metadata opcional
 */
export async function enviarNotificacionGeneral(params: {
  userId?: string;
  usuarioId?: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  metadata?: string; // ✅ AGREGADO: metadata opcional
}) {
  try {
    const targetUserId = params.userId || params.usuarioId;

    if (!targetUserId) {
      throw new Error('userId o usuarioId es requerido');
    }

    await prisma.notificacion.create({
      data: {
        userId: targetUserId,
        tipo: params.tipo,
        titulo: params.titulo,
        mensaje: params.mensaje,
        leida: false,
        metadata: params.metadata // ✅ AGREGADO
      }
    });

    console.log(`✅ Notificacion ${params.tipo} enviada a usuario ${targetUserId}`);
  } catch (error) {
    console.error('Error enviando notificacion general:', error);
    throw error;
  }
}
