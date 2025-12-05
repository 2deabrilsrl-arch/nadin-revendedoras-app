import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || 'month';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Calcular fechas para filtro mensual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 🔥 OPTIMIZACIÓN: Una sola query con agregaciones
    // En lugar de hacer Promise.all con múltiples queries por usuario
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
        },
        // Incluir relaciones necesarias
        _count: {
          select: {
            badges: true
          }
        }
      }
    });

    // 🔥 OPTIMIZACIÓN: Obtener todos los puntos de una vez
    const allPoints = await prisma.point.groupBy({
      by: ['userId'],
      _sum: {
        amount: true
      }
    });

    const pointsMap = new Map(
      allPoints.map(p => [p.userId, p._sum.amount || 0])
    );

    // 🔥 OPTIMIZACIÓN: Obtener pedidos agrupados por usuario
    const whereCondition: any = {
      estado: 'entregado',
      paidByClient: true,
      NOT: {
        estado: 'cancelado'
      }
    };

    if (period === 'month') {
      whereCondition.createdAt = {
        gte: startOfMonth
      };
    }

    const pedidosAgrupados = await prisma.pedido.groupBy({
      by: ['userId'],
      where: whereCondition,
      _count: {
        id: true
      }
    });

    const salesMap = new Map(
      pedidosAgrupados.map(p => [p.userId, p._count.id])
    );

    // Construir ranking con datos pre-cargados
    const rankingData = users.map(user => ({
      userId: user.id,
      userName: user.name,
      userHandle: user.handle,
      level: user.level?.currentLevel || 'principiante',
      totalSales: salesMap.get(user.id) || 0,
      totalPoints: pointsMap.get(user.id) || 0,
      badgesCount: user._count.badges,
      isCurrentUser: user.id === userId
    }));

    // Ordenar por ventas y puntos
    rankingData.sort((a, b) => {
      if (b.totalSales !== a.totalSales) {
        return b.totalSales - a.totalSales;
      }
      return b.totalPoints - a.totalPoints;
    });

    // Asignar posiciones
    const ranking = rankingData.map((entry, index) => ({
      ...entry,
      position: index + 1
    }));

    // Top 50 + usuario actual si está fuera
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
