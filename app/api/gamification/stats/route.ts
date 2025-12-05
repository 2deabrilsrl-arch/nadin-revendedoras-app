import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // 1. Obtener nivel del usuario
    let userLevel = await prisma.userLevel.findUnique({
      where: { userId }
    });

    // Si no tiene nivel, crearlo
    if (!userLevel) {
      userLevel = await prisma.userLevel.create({
        data: {
          userId,
          currentLevel: 'principiante',
          currentXP: 0,
          totalSales: 0
        }
      });
    }

    // 2. Calcular total de puntos
    const points = await prisma.point.findMany({
      where: { userId }
    });
    const totalPoints = points.reduce((sum, p) => sum + p.amount, 0);

    // 3. Obtener todos los badges del sistema
    const allBadges = await prisma.badge.findMany({
      orderBy: [
        { category: 'asc' },
        { points: 'asc' }
      ]
    });

    // 4. Obtener badges desbloqueados por el usuario
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true
      }
    });

    // 5. Mapear badges con estado de desbloqueo
    const badgesWithStatus = allBadges.map(badge => {
      const unlocked = userBadges.find(ub => ub.badgeId === badge.id);
      return {
        id: badge.id,
        slug: badge.slug,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        points: badge.points,
        rarity: badge.rarity,
        unlocked: !!unlocked,
        unlockedAt: unlocked?.unlockedAt?.toISOString()
      };
    });

    // 6. Construir respuesta
    const stats = {
      totalPoints,
      badgesUnlocked: userBadges.length,
      totalBadges: allBadges.length,
      level: {
        currentLevel: userLevel.currentLevel,
        currentXP: userLevel.currentXP,
        totalSales: userLevel.totalSales
      },
      badges: badgesWithStatus
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
