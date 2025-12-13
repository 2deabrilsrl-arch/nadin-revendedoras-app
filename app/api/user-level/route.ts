// API: USER LEVEL - COMPATIBLE CON SISTEMA EXISTENTE
// Ubicacion: app/api/user-level/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requerido' },
        { status: 400 }
      );
    }

    console.log(`\n📊 ========================================`);
    console.log(`📊 CONSULTANDO NIVEL DE USUARIO`);
    console.log(`📊 UserId: ${userId}`);
    console.log(`📊 ========================================`);

    // Obtener UserLevel
    let userLevel = await prisma.userLevel.findUnique({
      where: { userId }
    });

    // Si no existe, crear uno nuevo
    if (!userLevel) {
      console.log('⚠️ Usuario sin nivel, creando...');
      
      // Contar pedidos completados del usuario
      const pedidosCompletados = await prisma.pedido.count({
        where: {
          userId,
          estado: 'entregado',
          paidByClient: true,
          NOT: {
            estado: 'cancelado'
          }
        }
      });

      const nivelInicial = calcularNivel(pedidosCompletados);

      userLevel = await prisma.userLevel.create({
        data: {
          userId,
          currentLevel: nivelInicial,
          currentXP: pedidosCompletados,
          totalSales: pedidosCompletados
        }
      });
      
      console.log(`✅ Nivel creado: ${nivelInicial} (${pedidosCompletados} ventas)`);
    }

    // Obtener historial de puntos
    const points = await prisma.point.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Últimos 50
    });

    // Calcular puntos totales
    const totalPuntos = points.reduce((sum, p) => sum + p.amount, 0);

    console.log('✅ Nivel cargado:');
    console.log(`   - Nivel: ${userLevel.currentLevel}`);
    console.log(`   - Ventas completadas: ${userLevel.totalSales}`);
    console.log(`   - XP: ${userLevel.currentXP}`);
    console.log(`   - Puntos totales: ${totalPuntos}`);
    console.log(`   - Puntos en historial: ${points.length}`);

    // Calcular nivel basado en ventas
    const niveles = [
      { nombre: 'Principiante', min: 0, max: 9 },
      { nombre: 'Bronce', min: 10, max: 49 },
      { nombre: 'Plata', min: 50, max: 99 },
      { nombre: 'Oro', min: 100, max: 199 },
      { nombre: 'Platino', min: 200, max: 499 },
      { nombre: 'Diamante', min: 500, max: 999 },
      { nombre: 'Leyenda', min: 1000, max: Infinity }
    ];

    const nivelActual = niveles.find(n => 
      userLevel!.totalSales >= n.min && userLevel!.totalSales <= n.max
    ) || niveles[0];

    const siguienteNivel = niveles[niveles.indexOf(nivelActual) + 1] || null;

    console.log(`📊 ========================================\n`);

    return NextResponse.json({
      success: true,
      userLevel: {
        ...userLevel,
        nivelNombre: nivelActual.nombre,
        siguienteNivel: siguienteNivel ? {
          nombre: siguienteNivel.nombre,
          ventasRequeridas: siguienteNivel.min,
          ventasFaltantes: siguienteNivel.min - userLevel.totalSales
        } : null,
        progreso: siguienteNivel ? 
          ((userLevel.totalSales - nivelActual.min) / (siguienteNivel.min - nivelActual.min)) * 100 : 
          100
      },
      points,
      stats: {
        totalPuntos: totalPuntos,
        ventasCompletadas: userLevel.totalSales,
        nivelActual: nivelActual.nombre,
        proximoNivel: siguienteNivel?.nombre || 'Máximo nivel alcanzado'
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo nivel:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}

function calcularNivel(ventas: number): string {
  if (ventas >= 500) return 'leyenda';
  if (ventas >= 200) return 'diamante';
  if (ventas >= 100) return 'platino';
  if (ventas >= 50) return 'oro';
  if (ventas >= 10) return 'plata';
  return 'bronce';
}
