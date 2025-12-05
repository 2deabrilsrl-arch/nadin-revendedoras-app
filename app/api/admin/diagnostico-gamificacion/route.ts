import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Contar badges
    const badgesCount = await prisma.badge.count();
    
    // Obtener todos los badges
    const allBadges = await prisma.badge.findMany({
      orderBy: { category: 'asc' }
    });

    // Contar badges por categoría
    const byCategory = await prisma.badge.groupBy({
      by: ['category'],
      _count: true
    });

    // Contar usuarios con badges
    const usersWithBadges = await prisma.userBadge.groupBy({
      by: ['userId'],
      _count: true
    });

    // Contar niveles de usuarios
    const userLevels = await prisma.userLevel.findMany({
      include: {
        user: {
          select: {
            name: true,
            handle: true
          }
        }
      }
    });

    // Total de puntos en el sistema
    const totalPoints = await prisma.point.aggregate({
      _sum: {
        amount: true
      }
    });

    return NextResponse.json({
      badges: {
        total: badgesCount,
        byCategory: byCategory.map(c => ({
          category: c.category,
          count: c._count
        })),
        list: allBadges.map(b => ({
          slug: b.slug,
          name: b.name,
          category: b.category,
          rarity: b.rarity,
          points: b.points
        }))
      },
      users: {
        withBadges: usersWithBadges.length,
        levels: userLevels.map(ul => ({
          user: ul.user.name,
          handle: ul.user.handle,
          level: ul.currentLevel,
          xp: ul.currentXP,
          sales: ul.totalSales
        }))
      },
      points: {
        total: totalPoints._sum.amount || 0
      }
    });
  } catch (error) {
    console.error('Error en diagnóstico:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error'
    }, { status: 500 });
  }
}