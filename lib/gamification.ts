import { Prisma } from '@prisma/client';

/**
 * Calcula el nivel del usuario según la cantidad de ventas completadas (NO canceladas)
 */
export function calculateUserLevel(salesCount: number): string {
  if (salesCount >= 500) return 'leyenda';
  if (salesCount >= 200) return 'diamante';
  if (salesCount >= 100) return 'oro';
  if (salesCount >= 50) return 'plata';
  if (salesCount >= 10) return 'bronce';
  return 'principiante';
}

/**
 * Calcula puntos por una venta
 */
export function calculateSalePoints(amount: number, isFirstSale: boolean): number {
  const basePoints = Math.floor(amount / 1000) * 10; // 10 puntos por cada $1000
  const firstSaleBonus = isFirstSale ? 50 : 0;
  return basePoints + firstSaleBonus;
}

/**
 * Procesa gamificación después de COMPLETAR un pedido
 * SOLO se activa si: estado="entregado" Y paidByClient=true Y estado != "cancelado"
 * 
 * IMPORTANTE: Esta función recalcula TODA la gamificación del usuario
 * basándose SOLO en pedidos completados NO cancelados
 */
export async function processGamificationAfterSale(
  userId: string,
  saleAmount: number
) {
  const { prisma } = await import('@/lib/prisma');

  try {
    console.log(`\n🎮 ========================================`);
    console.log(`🎮 PROCESANDO GAMIFICACIÓN`);
    console.log(`🎮 ========================================`);
    console.log(`🎮 Venta de $${saleAmount}`);

    // 1. Contar SOLO pedidos completados NO cancelados
    const pedidosCompletados = await prisma.pedido.count({
      where: {
        userId,
        estado: {
          in: ['entregado']
        },
        paidByClient: true,
        NOT: {
          estado: 'cancelado'
        }
      }
    });

    console.log(`   📊 Total ventas completadas (no canceladas): ${pedidosCompletados}`);

    // 2. Calcular nivel basado en ventas completadas
    const newLevel = calculateUserLevel(pedidosCompletados);
    console.log(`   🎯 Nivel calculado: ${newLevel}`);

    // 3. Obtener nivel anterior
    const oldLevel = await prisma.userLevel.findUnique({
      where: { userId }
    });

    // 4. Actualizar o crear UserLevel
    await prisma.userLevel.upsert({
      where: { userId },
      create: {
        userId,
        currentLevel: newLevel,
        currentXP: pedidosCompletados,
        totalSales: pedidosCompletados
      },
      update: {
        currentLevel: newLevel,
        currentXP: pedidosCompletados,
        totalSales: pedidosCompletados
      }
    });

    console.log(`   ✅ Nivel actualizado: ${newLevel} (${pedidosCompletados} ventas)`);

    // 5. Verificar si subió de nivel
    if (oldLevel && oldLevel.currentLevel !== newLevel) {
      console.log(`   🎊 ¡SUBIÓ DE NIVEL! ${oldLevel.currentLevel} → ${newLevel}`);
      
      await prisma.point.create({
        data: {
          userId,
          amount: 100,
          reason: 'level_up',
          description: `¡Subiste a nivel ${newLevel}!`
        }
      });
      
      console.log(`   💎 +100 puntos por subir de nivel`);
    }

    // 6. Otorgar puntos por esta venta
    const isFirstSale = pedidosCompletados === 1;
    const salePoints = calculateSalePoints(saleAmount, isFirstSale);
    
    await prisma.point.create({
      data: {
        userId,
        amount: salePoints,
        reason: 'sale',
        description: `Venta de $${saleAmount}`
      }
    });

    console.log(`   💎 +${salePoints} puntos por la venta`);

    // 7. Verificar y asignar badges basados en ventas completadas
    await checkAndAssignBadges(userId, pedidosCompletados);

    console.log(`   ✅ Gamificación procesada`);
    console.log(`🎮 ========================================\n`);

    return { success: true, level: newLevel, points: salePoints };
  } catch (error) {
    console.error('❌ Error procesando gamificación:', error);
    return { success: false, error };
  }
}

/**
 * Recalcula gamificación cuando se cancela un pedido
 * 
 * IMPORTANTE: NO resta puntos, simplemente recalcula TODO
 * basándose en pedidos NO cancelados
 */
export async function recalculateGamificationAfterCancel(userId: string) {
  const { prisma } = await import('@/lib/prisma');

  try {
    console.log(`\n🔄 ========================================`);
    console.log(`🔄 RECALCULANDO GAMIFICACIÓN (cancelación)`);
    console.log(`🔄 ========================================`);

    // 1. Contar pedidos completados NO cancelados
    const pedidosCompletados = await prisma.pedido.count({
      where: {
        userId,
        estado: {
          in: ['entregado']
        },
        paidByClient: true,
        NOT: {
          estado: 'cancelado'
        }
      }
    });

    console.log(`   📊 Ventas válidas después de cancelación: ${pedidosCompletados}`);

    // 2. Recalcular nivel
    const newLevel = calculateUserLevel(pedidosCompletados);
    console.log(`   🎯 Nivel recalculado: ${newLevel}`);

    // 3. Obtener nivel anterior
    const oldLevel = await prisma.userLevel.findUnique({
      where: { userId }
    });

    // 4. Actualizar UserLevel
    if (oldLevel) {
      await prisma.userLevel.update({
        where: { userId },
        data: {
          currentLevel: newLevel,
          currentXP: pedidosCompletados,
          totalSales: pedidosCompletados
        }
      });

      // Si bajó de nivel, informar (pero NO quitar puntos)
      if (oldLevel.currentLevel !== newLevel) {
        console.log(`   ⚠️ Cambio de nivel: ${oldLevel.currentLevel} → ${newLevel}`);
      }
    }

    // 5. Agregar registro de cancelación (sin quitar puntos)
    await prisma.point.create({
      data: {
        userId,
        amount: 0, // 0 puntos = solo registro informativo
        reason: 'cancel',
        description: 'Pedido cancelado - gamificación recalculada'
      }
    });

    console.log(`   ℹ️ Pedidos cancelados no afectan puntos acumulados`);
    console.log(`   ℹ️ Badges permanecen (son logros permanentes)`);
    console.log(`   ✅ Recálculo completado`);
    console.log(`🔄 ========================================\n`);

    return { success: true, level: newLevel };
  } catch (error) {
    console.error('❌ Error recalculando gamificación:', error);
    return { success: false, error };
  }
}

/**
 * Verifica y asigna badges según las ventas del usuario
 * SOLO cuenta pedidos completados NO cancelados
 */
async function checkAndAssignBadges(userId: string, totalSales: number) {
  const { prisma } = await import('@/lib/prisma');

  const badgesToCheck: { slug: string; minSales: number }[] = [
    { slug: 'primera-venta', minSales: 1 },
    { slug: '10-ventas', minSales: 10 },
    { slug: '50-ventas', minSales: 50 },
    { slug: '100-ventas', minSales: 100 },
    { slug: '200-ventas', minSales: 200 },
    { slug: '500-ventas', minSales: 500 }
  ];

  for (const { slug, minSales } of badgesToCheck) {
    if (totalSales >= minSales) {
      const badge = await prisma.badge.findUnique({
        where: { slug }
      });

      if (badge) {
        const existing = await prisma.userBadge.findUnique({
          where: {
            userId_badgeId: {
              userId,
              badgeId: badge.id
            }
          }
        });

        if (!existing) {
          await prisma.userBadge.create({
            data: {
              userId,
              badgeId: badge.id
            }
          });

          await prisma.point.create({
            data: {
              userId,
              amount: badge.points,
              reason: 'badge',
              description: `¡Badge desbloqueado: ${badge.name}!`
            }
          });

          console.log(`   🏅 ¡Badge desbloqueado! ${badge.name} (+${badge.points} pts)`);
        }
      }
    }
  }
}
