import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || 'month'; // 'month' o 'all'

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Calcular fechas para filtro mensual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Obtener todos los usuarios con sus niveles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        handle: true,
        level: {
          select: {
            currentLevel: true,
            totalSales: true
          }
        }
      }
    });

    // 2. Para cada usuario, calcular estadísticas según el período
    const rankingData = await Promise.all(
      users.map(async (user) => {
        // Contar ventas completadas NO canceladas según período
        const whereCondition: any = {
          userId: user.id,
          estado: 'entregado',
          paidByClient: true,
          NOT: {
            estado: 'cancelado'
          }
        };

        // Si es período mensual, agregar filtro de fecha
        if (period === 'month') {
          whereCondition.createdAt = {
            gte: startOfMonth
          };
        }

        const totalSales = await prisma.pedido.count({
          where: whereCondition
        });

        // Calcular total de puntos
        const points = await prisma.point.findMany({
          where: { userId: user.id }
        });
        const totalPoints = points.reduce((sum, p) => sum + p.amount, 0);

        // Contar badges
        const badgesCount = await prisma.userBadge.count({
          where: { userId: user.id }
        });

        return {
          userId: user.id,
          userName: user.name,
          userHandle: user.handle,
          level: user.level?.currentLevel || 'principiante',
          totalSales,
          totalPoints,
          badgesCount,
          isCurrentUser: user.id === userId
        };
      })
    );

    // 3. Ordenar por total de ventas (descendente)
    rankingData.sort((a, b) => {
      if (b.totalSales !== a.totalSales) {
        return b.totalSales - a.totalSales;
      }
      // Si tienen las mismas ventas, ordenar por puntos
      return b.totalPoints - a.totalPoints;
    });

    // 4. Asignar posiciones
    const ranking = rankingData.map((entry, index) => ({
      ...entry,
      position: index + 1
    }));

    // 5. Retornar solo top 50 (pero asegurar que el usuario actual esté incluido)
    let finalRanking = ranking.slice(0, 50);
    
    const currentUserRank = ranking.find(r => r.isCurrentUser);
    if (currentUserRank && currentUserRank.position > 50) {
      finalRanking.push(currentUserRank);
    }

    return NextResponse.json(finalRanking);

  } catch (error) {
    console.error('❌ Error obteniendo ranking:', error);
    return NextResponse.json(
      { error: 'Error al obtener ranking' },
      { status: 500 }
    );
  }
}
