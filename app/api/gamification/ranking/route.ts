// RANKING CORREGIDO - USA paidToNadin en lugar de estado: 'entregado'
// Ubicación: app/api/gamification/ranking/route.ts

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
        },
        _count: {
          select: {
            badges: true
          }
        }
      }
    });

    // 2. Obtener todos los puntos de una vez
    const allPoints = await prisma.point.groupBy({
      by: ['userId'],
      _sum: {
        amount: true
      }
    });

    const pointsMap = new Map(
      allPoints.map(p => [p.userId, p._sum.amount || 0])
    );

    // 3. ✅ CAMBIO: Obtener pedidos PAGADOS A NADIN (no cancelados)
    const whereCondition: any = {
      paidToNadin: true,  // ← CAMBIO PRINCIPAL
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

    // 4. Construir ranking con datos pre-cargados
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

    // 5. Ordenar por total de ventas (descendente)
    rankingData.sort((a, b) => {
      if (b.totalSales !== a.totalSales) {
        return b.totalSales - a.totalSales;
      }
      // Si tienen las mismas ventas, ordenar por puntos
      return b.totalPoints - a.totalPoints;
    });

    // 6. Asignar posiciones
    const ranking = rankingData.map((entry, index) => ({
      ...entry,
      position: index + 1
    }));

    // 7. Retornar solo top 50 (pero asegurar que el usuario actual esté incluido)
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
