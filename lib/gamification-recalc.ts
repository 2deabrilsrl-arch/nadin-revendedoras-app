// RECALCULO DE GAMIFICACION
// Ubicacion: lib/gamification-recalc.ts

import { prisma } from '@/lib/prisma';

interface RecalcularGamificacionParams {
  usuarioId: string;
  pedidoId: string;
  productosOriginales: number;
  productosReales: number;
  ventaOriginal: number;
  ventaReal: number;
}

export async function recalcularGamificacionPorPedido(params: RecalcularGamificacionParams) {
  const {
    usuarioId,
    pedidoId,
    productosOriginales,
    productosReales,
    ventaOriginal,
    ventaReal
  } = params;

  try {
    console.log('\n========================================');
    console.log('RECALCULANDO GAMIFICACION');
    console.log('========================================');

    // 1. Obtener nivel actual del usuario
    let userLevel = await prisma.userLevel.findUnique({
      where: { userId: usuarioId }
    });

    if (!userLevel) {
      // Crear nivel si no existe
      userLevel = await prisma.userLevel.create({
        data: {
          userId: usuarioId,
          currentLevel: 'bronce',
          currentXP: 0,
          totalSales: 0
        }
      });
    }

    console.log('Estado actual:');
    console.log(`   Ventas totales: $${userLevel.totalSales}`);
    console.log(`   Nivel: ${userLevel.currentLevel}`);
    console.log(`   XP: ${userLevel.currentXP}`);

    // 2. Calcular ajuste
    const ajusteVentas = ventaReal - ventaOriginal;

    console.log('\nAjustes:');
    console.log(`   Productos: ${productosOriginales} -> ${productosReales}`);
    console.log(`   Ventas: $${ventaOriginal} -> $${ventaReal} (${ajusteVentas >= 0 ? '+' : ''}$${ajusteVentas})`);

    // 3. Nuevos valores
    const nuevoTotalSales = Math.max(0, userLevel.totalSales + ajusteVentas);

    // 4. Calcular nuevo nivel
    const nuevoNivel = calcularNivel(nuevoTotalSales);

    // 5. Calcular XP
    const nuevoXP = Math.floor(nuevoTotalSales / 1000); // 1 XP por cada $1000

    // 6. Actualizar nivel de usuario
    await prisma.userLevel.update({
      where: { userId: usuarioId },
      data: {
        totalSales: nuevoTotalSales,
        currentLevel: nuevoNivel,
        currentXP: nuevoXP
      }
    });

    // 7. Registrar puntos del ajuste
    if (ajusteVentas !== 0) {
      await prisma.point.create({
        data: {
          userId: usuarioId,
          amount: Math.floor(ajusteVentas / 100), // 1 punto por cada $100
          reason: 'ajuste_pedido',
          description: `Ajuste de pedido ${pedidoId}: ${ajusteVentas >= 0 ? '+' : ''}$${ajusteVentas}`
        }
      });
    }

    console.log('\nNuevo estado:');
    console.log(`   Ventas totales: $${nuevoTotalSales}`);
    console.log(`   Nivel: ${nuevoNivel}`);
    console.log(`   XP: ${nuevoXP}`);

    // 8. Verificar si subió de nivel
    if (nuevoNivel !== userLevel.currentLevel) {
      console.log(`\n¡CAMBIO DE NIVEL! ${userLevel.currentLevel} -> ${nuevoNivel}`);

      // Enviar notificación de cambio de nivel
      await prisma.notificacion.create({
        data: {
          userId: usuarioId,
          tipo: 'nivel_up',
          titulo: `Nivel actualizado: ${nuevoNivel}`,
          mensaje: `Tu nivel cambió de ${userLevel.currentLevel} a ${nuevoNivel}`,
          leida: false
        }
      });
    }

    console.log('========================================\n');

    return {
      success: true,
      anterior: {
        ventas: userLevel.totalSales,
        nivel: userLevel.currentLevel
      },
      nuevo: {
        ventas: nuevoTotalSales,
        nivel: nuevoNivel
      },
      ajuste: {
        ventas: ajusteVentas
      }
    };

  } catch (error) {
    console.error('Error en recalcularGamificacionPorPedido:', error);
    throw error;
  }
}

/**
 * Calcula el nivel basado en venta total
 */
function calcularNivel(ventaTotal: number): string {
  if (ventaTotal >= 1000000) return 'leyenda';
  if (ventaTotal >= 500000) return 'diamante';
  if (ventaTotal >= 250000) return 'platino';
  if (ventaTotal >= 100000) return 'oro';
  if (ventaTotal >= 50000) return 'plata';
  return 'bronce';
}

/**
 * Recalcula toda la gamificación de un usuario desde cero
 */
export async function recalcularGamificacionCompleta(usuarioId: string) {
  try {
    console.log('\nRecalculando gamificación completa para usuario:', usuarioId);

    // Obtener todos los pedidos completados del usuario
    const pedidos = await prisma.pedido.findMany({
      where: {
        userId: usuarioId,
        estado: { in: ['enviado', 'armado', 'completado'] }
      },
      include: {
        lineas: true
      }
    });

    // Sumar totales
    const totalVentas = pedidos.reduce(
      (sum, p) => {
        const ventaPedido = p.lineas.reduce((s, l) => s + (l.venta * l.qty), 0);
        return sum + ventaPedido;
      },
      0
    );

    // Calcular nivel
    const nivel = calcularNivel(totalVentas);
    const xp = Math.floor(totalVentas / 1000);

    // Actualizar nivel del usuario
    await prisma.userLevel.upsert({
      where: { userId: usuarioId },
      create: {
        userId: usuarioId,
        currentLevel: nivel,
        currentXP: xp,
        totalSales: totalVentas
      },
      update: {
        currentLevel: nivel,
        currentXP: xp,
        totalSales: totalVentas
      }
    });

    console.log('Gamificación recalculada:');
    console.log(`   Ventas: $${totalVentas}`);
    console.log(`   Nivel: ${nivel}`);
    console.log(`   Pedidos: ${pedidos.length}`);

    return {
      success: true,
      ventaTotal: totalVentas,
      nivel,
      xp,
      pedidosRealizados: pedidos.length
    };

  } catch (error) {
    console.error('Error en recalcularGamificacionCompleta:', error);
    throw error;
  }
}
