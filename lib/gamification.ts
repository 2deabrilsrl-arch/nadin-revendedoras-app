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

    // 8. 🎖️ NUEVO: Trackear ventas por marca y verificar badges de embajadora
    await trackBrandSales(userId);

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
 * IMPORTANTE: Revoca badges y recalcula puntos basándose SOLO en pedidos NO cancelados
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

      // Si bajó de nivel, informar
      if (oldLevel.currentLevel !== newLevel) {
        console.log(`   ⚠️ Cambio de nivel: ${oldLevel.currentLevel} → ${newLevel}`);
      }
    }

    // 5. 🔥 REVOCAR BADGES que ya no califican
    await revokeBadgesIfNeeded(userId, pedidosCompletados);

    // 6. 🔥 RECALCULAR PUNTOS TOTALES desde cero
    await recalculateTotalPoints(userId, pedidosCompletados);

    // 7. 🎖️ NUEVO: Recalcular ventas por marca y revocar badges si es necesario
    await trackBrandSales(userId);

    // 8. Agregar registro de cancelación
    await prisma.point.create({
      data: {
        userId,
        amount: 0,
        reason: 'cancel',
        description: 'Pedido cancelado - gamificación recalculada automáticamente'
      }
    });

    console.log(`   ✅ Recálculo completado`);
    console.log(`🔄 ========================================\n`);

    return { success: true, level: newLevel, salesCount: pedidosCompletados };
  } catch (error) {
    console.error('❌ Error recalculando gamificación:', error);
    return { success: false, error };
  }
}

/**
 * Revoca badges que el usuario ya no debería tener según sus ventas actuales
 */
async function revokeBadgesIfNeeded(userId: string, currentSales: number) {
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
    // Si el usuario YA NO cumple el requisito
    if (currentSales < minSales) {
      const badge = await prisma.badge.findUnique({
        where: { slug }
      });

      if (badge) {
        const userBadge = await prisma.userBadge.findUnique({
          where: {
            userId_badgeId: {
              userId,
              badgeId: badge.id
            }
          }
        });

        // Si tiene el badge pero ya no califica, REVOCARLO
        if (userBadge) {
          await prisma.userBadge.delete({
            where: {
              id: userBadge.id
            }
          });

          console.log(`   🚫 Badge revocado: ${badge.name} (necesita ${minSales} ventas, tiene ${currentSales})`);
        }
      }
    }
  }
}

/**
 * Recalcula los puntos totales del usuario desde cero
 * Borra todos los puntos antiguos y los regenera basándose en pedidos válidos
 */
async function recalculateTotalPoints(userId: string, currentSales: number) {
  const { prisma } = await import('@/lib/prisma');

  // 1. Obtener todos los pedidos completados NO cancelados
  const pedidosValidos = await prisma.pedido.findMany({
    where: {
      userId,
      estado: {
        in: ['entregado']
      },
      paidByClient: true,
      NOT: {
        estado: 'cancelado'
      }
    },
    include: {
      lineas: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // 2. Borrar TODOS los puntos anteriores (excepto los de cancelación)
  await prisma.point.deleteMany({
    where: {
      userId,
      reason: {
        in: ['sale', 'badge', 'level_up']
      }
    }
  });

  console.log(`   🗑️ Puntos anteriores eliminados, recalculando...`);

  // 3. Recalcular puntos por cada venta válida
  let totalPuntosRecalculados = 0;
  
  for (let i = 0; i < pedidosValidos.length; i++) {
    const pedido = pedidosValidos[i];
    const isFirstSale = (i === 0);
    
    // Calcular monto total del pedido
    const montoVenta = pedido.lineas.reduce((sum, linea) => {
      return sum + (linea.venta * linea.qty);
    }, 0);

    const puntos = calculateSalePoints(montoVenta, isFirstSale);
    
    await prisma.point.create({
      data: {
        userId,
        amount: puntos,
        reason: 'sale',
        description: `Venta de $${montoVenta} (recalculado)`
      }
    });

    totalPuntosRecalculados += puntos;
  }

  // 4. Recalcular puntos por badges VIGENTES
  const badgesVigentes = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true }
  });

  for (const userBadge of badgesVigentes) {
    await prisma.point.create({
      data: {
        userId,
        amount: userBadge.badge.points,
        reason: 'badge',
        description: `Badge: ${userBadge.badge.name} (recalculado)`
      }
    });

    totalPuntosRecalculados += userBadge.badge.points;
  }

  // 5. Recalcular puntos por nivel actual
  const userLevel = await prisma.userLevel.findUnique({
    where: { userId }
  });

  if (userLevel && userLevel.currentLevel !== 'principiante') {
    // Puntos por haber alcanzado este nivel (100 puntos por nivel alcanzado)
    const levelPoints = getLevelPoints(userLevel.currentLevel);
    
    await prisma.point.create({
      data: {
        userId,
        amount: levelPoints,
        reason: 'level_up',
        description: `Nivel ${userLevel.currentLevel} (recalculado)`
      }
    });

    totalPuntosRecalculados += levelPoints;
  }

  console.log(`   ✅ Puntos recalculados: ${totalPuntosRecalculados} pts`);
}

/**
 * Obtiene los puntos correspondientes a un nivel
 */
function getLevelPoints(level: string): number {
  const levelPointsMap: Record<string, number> = {
    'bronce': 100,
    'plata': 200,
    'oro': 300,
    'diamante': 400,
    'leyenda': 500
  };
  
  return levelPointsMap[level] || 0;
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

// ==========================================
// 🎖️ EMBAJADORAS DE MARCAS - FUNCIONES
// ==========================================

/**
 * Configuración de niveles para embajadoras de marca
 */
interface BrandLevelConfig {
  level: 'bronce' | 'plata' | 'oro' | 'diamante';
  minSales: number;
  points: number;
  emoji: string;
}

const BRAND_LEVELS: BrandLevelConfig[] = [
  { level: 'bronce', minSales: 10, points: 150, emoji: '🥉' },
  { level: 'plata', minSales: 25, points: 300, emoji: '🥈' },
  { level: 'oro', minSales: 50, points: 500, emoji: '🥇' },
  { level: 'diamante', minSales: 100, points: 1000, emoji: '💎' }
];

/**
 * Trackea ventas por marca y asigna/revoca badges de embajadora automáticamente
 * Se ejecuta después de cada venta completada o cancelación
 */
async function trackBrandSales(userId: string) {
  const { prisma } = await import('@/lib/prisma');

  try {
    console.log(`\n🎖️  ========================================`);
    console.log(`🎖️  TRACKING EMBAJADORAS DE MARCAS`);
    console.log(`🎖️  ========================================`);

    // 1. Obtener todas las marcas activas
    const activeBrands = await prisma.brandAmbassador.findMany({
      where: { isActive: true }
    });

    if (activeBrands.length === 0) {
      console.log(`   ℹ️  No hay marcas activas en el programa`);
      return;
    }

    console.log(`   📊 ${activeBrands.length} marcas activas`);

    // 2. Para cada marca, contar ventas completadas del usuario
    for (const brand of activeBrands) {
      // Contar ventas SOLO de pedidos completados NO cancelados
      const brandSalesCount = await prisma.linea.count({
        where: {
          brand: brand.brandName, // Comparar con el nombre de marca en Linea
          pedido: {
            userId,
            estado: {
              in: ['entregado']
            },
            paidByClient: true,
            NOT: {
              estado: 'cancelado'
            }
          }
        }
      });

      console.log(`   🏷️  ${brand.brandName}: ${brandSalesCount} ventas`);

      // 3. Actualizar o crear registro de ventas por marca
      await prisma.userBrandSales.upsert({
        where: {
          userId_brandSlug: {
            userId,
            brandSlug: brand.brandSlug
          }
        },
        create: {
          userId,
          brandSlug: brand.brandSlug,
          salesCount: brandSalesCount
        },
        update: {
          salesCount: brandSalesCount
        }
      });

      // 4. Verificar y asignar/revocar badges de embajadora para esta marca
      await checkBrandAmbassadorBadges(userId, brand, brandSalesCount);
    }

    console.log(`   ✅ Tracking de marcas completado`);
    console.log(`🎖️  ========================================\n`);

  } catch (error) {
    console.error('❌ Error trackeando ventas por marca:', error);
  }
}

/**
 * Verifica y asigna/revoca badges de embajadora para una marca específica
 */
async function checkBrandAmbassadorBadges(
  userId: string,
  brand: any,
  currentSales: number
) {
  const { prisma } = await import('@/lib/prisma');

  for (const levelConfig of BRAND_LEVELS) {
    const badgeSlug = `embajadora-${brand.brandSlug}-${levelConfig.level}`;

    // Buscar si existe el badge (puede no existir aún si la marca es nueva)
    const badge = await prisma.badge.findUnique({
      where: { slug: badgeSlug }
    });

    if (!badge) {
      // Si el badge no existe, lo creamos automáticamente
      // Usar logoUrl si existe, sino emoji como fallback
      const badgeIcon = brand.logoUrl 
        ? `${brand.logoUrl}|${levelConfig.emoji}`  // Formato: "/logos/marca.jpg|🥉"
        : `${brand.logoEmoji}${levelConfig.emoji}`; // Fallback: "💋🥉"
      
      const newBadge = await prisma.badge.create({
        data: {
          slug: badgeSlug,
          name: `Embajadora ${brand.brandName} ${levelConfig.emoji}`,
          description: `Alcanzaste ${levelConfig.minSales} ventas de ${brand.brandName}`,
          icon: badgeIcon,
          category: 'embajadora',
          condition: JSON.stringify({
            type: 'brand_sales',
            brandSlug: brand.brandSlug,
            minSales: levelConfig.minSales
          }),
          points: levelConfig.points,
          rarity: levelConfig.level === 'diamante' ? 'legendary' : 
                  levelConfig.level === 'oro' ? 'epic' : 
                  levelConfig.level === 'plata' ? 'rare' : 'common'
        }
      });

      console.log(`      🆕 Badge creado: ${newBadge.name}`);
      
      // Ahora verificamos si el usuario califica
      await assignOrRevokeBrandBadge(userId, newBadge, levelConfig, currentSales);
    } else {
      // Badge existe, verificar si asignar o revocar
      await assignOrRevokeBrandBadge(userId, badge, levelConfig, currentSales);
    }
  }
}

/**
 * Asigna o revoca un badge de embajadora según las ventas actuales
 */
async function assignOrRevokeBrandBadge(
  userId: string,
  badge: any,
  levelConfig: BrandLevelConfig,
  currentSales: number
) {
  const { prisma } = await import('@/lib/prisma');

  const userBadge = await prisma.userBadge.findUnique({
    where: {
      userId_badgeId: {
        userId,
        badgeId: badge.id
      }
    }
  });

  // Si cumple el requisito y NO tiene el badge → ASIGNAR
  if (currentSales >= levelConfig.minSales && !userBadge) {
    await prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id
      }
    });

    await prisma.point.create({
      data: {
        userId,
        amount: levelConfig.points,
        reason: 'badge',
        description: `¡Embajadora ${levelConfig.level} desbloqueada! ${badge.name}`
      }
    });

    console.log(`      🎖️  ¡Badge asignado! ${badge.name} (+${levelConfig.points} pts)`);
  }

  // Si NO cumple el requisito y SÍ tiene el badge → REVOCAR
  if (currentSales < levelConfig.minSales && userBadge) {
    await prisma.userBadge.delete({
      where: {
        id: userBadge.id
      }
    });

    console.log(`      🚫 Badge revocado: ${badge.name} (necesita ${levelConfig.minSales}, tiene ${currentSales})`);
  }
}
