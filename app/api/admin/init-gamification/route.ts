import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateUserLevel, calculateSalePoints } from '@/lib/gamification';

export async function POST() {
  try {
    console.log('\n🎮 ========================================');
    console.log('🎮 INICIALIZANDO GAMIFICACIÓN');
    console.log('🎮 ========================================\n');

    // 1. Obtener todos los usuarios
    const users = await prisma.user.findMany({
      include: {
        pedidos: {
          where: {
            estado: {
              in: ['entregado', 'pagado', 'enviado']
            }
          }
        }
      }
    });

    console.log(`👥 ${users.length} usuarios encontrados\n`);

    let usersProcessed = 0;
    let badgesAssigned = 0;
    let levelsCreated = 0;
    let pointsAdded = 0;

    for (const user of users) {
      console.log(`\n👤 Procesando: ${user.name} (@${user.handle})`);
      
      const totalSales = user.pedidos.length;
      console.log(`   📊 Ventas totales: ${totalSales}`);

      // Calcular nivel
      const level = calculateUserLevel(totalSales);
      console.log(`   🎯 Nivel calculado: ${level}`);

      // Crear o actualizar UserLevel
      const userLevel = await prisma.userLevel.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          currentLevel: level,
          currentXP: totalSales,
          totalSales: totalSales
        },
        update: {
          currentLevel: level,
          currentXP: totalSales,
          totalSales: totalSales
        }
      });
      levelsCreated++;
      console.log(`   ✅ Nivel guardado`);

      // Asignar badges según ventas
      const badgesToAssign = [];
      
      if (totalSales >= 1) badgesToAssign.push('primera-venta');
      if (totalSales >= 10) badgesToAssign.push('10-ventas');
      if (totalSales >= 50) badgesToAssign.push('50-ventas');
      if (totalSales >= 100) badgesToAssign.push('100-ventas');

      console.log(`   🏅 Badges a asignar: ${badgesToAssign.length}`);

      for (const badgeSlug of badgesToAssign) {
        const badge = await prisma.badge.findUnique({
          where: { slug: badgeSlug }
        });

        if (badge) {
          // Verificar si ya tiene el badge
          const existing = await prisma.userBadge.findUnique({
            where: {
              userId_badgeId: {
                userId: user.id,
                badgeId: badge.id
              }
            }
          });

          if (!existing) {
            await prisma.userBadge.create({
              data: {
                userId: user.id,
                badgeId: badge.id
              }
            });

            // Agregar puntos por el badge
            await prisma.point.create({
              data: {
                userId: user.id,
                amount: badge.points,
                reason: 'badge',
                description: `Badge desbloqueado: ${badge.name}`
              }
            });

            badgesAssigned++;
            pointsAdded += badge.points;
            console.log(`      ✅ ${badge.name} (${badge.points} pts)`);
          } else {
            console.log(`      ℹ️ Ya tiene: ${badge.name}`);
          }
        }
      }

      // Agregar puntos por ventas pasadas (10 puntos por venta)
      if (totalSales > 0) {
        const existingPoints = await prisma.point.findFirst({
          where: {
            userId: user.id,
            reason: 'init'
          }
        });

        if (!existingPoints) {
          const salePoints = totalSales * 10;
          await prisma.point.create({
            data: {
              userId: user.id,
              amount: salePoints,
              reason: 'init',
              description: `Puntos iniciales por ${totalSales} ventas`
            }
          });
          pointsAdded += salePoints;
          console.log(`   💎 ${salePoints} puntos por ventas`);
        }
      }

      usersProcessed++;
    }

    console.log('\n🎉 ========================================');
    console.log('🎉 INICIALIZACIÓN COMPLETA');
    console.log('🎉 ========================================');
    console.log(`👥 Usuarios procesados: ${usersProcessed}`);
    console.log(`🏅 Badges asignados: ${badgesAssigned}`);
    console.log(`🎯 Niveles creados: ${levelsCreated}`);
    console.log(`💎 Puntos agregados: ${pointsAdded}`);
    console.log('🎉 ========================================\n');

    return NextResponse.json({
      success: true,
      usersProcessed,
      badgesAssigned,
      levelsCreated,
      pointsAdded
    });

  } catch (error) {
    console.error('❌ Error inicializando gamificación:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error'
    }, { status: 500 });
  }
}