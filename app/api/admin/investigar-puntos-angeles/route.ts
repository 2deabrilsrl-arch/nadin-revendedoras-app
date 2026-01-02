// API para investigar puntos de Angeles Brun
// app/api/admin/investigar-puntos-angeles/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Función auxiliar para calcular puntos según la lógica actual
function calculateSalePoints(amount: number, isFirstSale: boolean): number {
  const basePoints = Math.floor(amount / 1000) * 10; // 10 puntos por cada $1000
  const firstSaleBonus = isFirstSale ? 50 : 0;
  return basePoints + firstSaleBonus;
}

export async function GET() {
  try {
    const resultado: any = {
      timestamp: new Date().toISOString(),
      usuario: null,
      pedidosCompletados: [],
      puntosEsperados: 0,
      puntosReales: 0,
      puntosPorCategoria: {},
      badges: [],
      nivel: null,
      problemas: [],
      resumen: ''
    };

    // 1. Buscar el usuario
    const usuario = await prisma.user.findFirst({
      where: {
        OR: [
          { dni: '41407893' },
          { email: 'angelestaianabrun@gmail.com' }
        ]
      }
    });

    if (!usuario) {
      return NextResponse.json({
        error: 'Usuario no encontrado',
        buscado: {
          dni: '41407893',
          email: 'angelestaianabrun@gmail.com'
        }
      }, { status: 404 });
    }

    resultado.usuario = {
      id: usuario.id,
      nombre: usuario.name,
      email: usuario.email,
      dni: usuario.dni,
      handle: usuario.handle
    };

    // 2. Buscar pedidos COMPLETADOS (entregado + paidByClient)
    const pedidosCompletados = await prisma.pedido.findMany({
      where: {
        userId: usuario.id,
        estado: 'entregado',
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

    // Si no tiene pedidos completados, ver todos sus pedidos
    if (pedidosCompletados.length === 0) {
      const todosPedidos = await prisma.pedido.findMany({
        where: { userId: usuario.id },
        select: {
          id: true,
          estado: true,
          paidByClient: true,
          createdAt: true
        }
      });

      resultado.problemas.push({
        tipo: 'sin_pedidos_completados',
        mensaje: 'No tiene pedidos con estado "entregado" y paidByClient=true',
        pedidosEnOtrosEstados: todosPedidos.map(p => ({
          id: p.id.substring(0, 8) + '...',
          estado: p.estado,
          pagado: p.paidByClient,
          fecha: p.createdAt
        }))
      });
    }

    // 3. Calcular puntos que DEBERÍA tener
    let puntosEsperados = 0;

    pedidosCompletados.forEach((pedido, index) => {
      const montoVenta = pedido.lineas.reduce((sum, linea) => {
        return sum + (linea.venta * linea.qty);
      }, 0);

      const isFirstSale = (index === 0);
      const puntosPorVenta = calculateSalePoints(montoVenta, isFirstSale);
      puntosEsperados += puntosPorVenta;

      resultado.pedidosCompletados.push({
        pedidoId: pedido.id.substring(0, 8) + '...',
        fecha: pedido.createdAt,
        monto: montoVenta,
        productos: pedido.lineas.length,
        puntos: puntosPorVenta,
        esLaPrimera: isFirstSale,
        bonusPrimeraVenta: isFirstSale ? 50 : 0
      });
    });

    resultado.puntosEsperados = puntosEsperados;

    // 4. Ver puntos REALES en la tabla Point
    const puntosReales = await prisma.point.findMany({
      where: { userId: usuario.id },
      orderBy: { createdAt: 'asc' }
    });

    let totalPuntosReales = 0;
    const puntosPorCategoria: { [key: string]: number } = {};
    const registrosPuntos: any[] = [];

    puntosReales.forEach(punto => {
      totalPuntosReales += punto.amount;
      puntosPorCategoria[punto.reason] = (puntosPorCategoria[punto.reason] || 0) + punto.amount;

      registrosPuntos.push({
        fecha: punto.createdAt,
        puntos: punto.amount,
        razon: punto.reason,
        descripcion: punto.description
      });
    });

    resultado.puntosReales = totalPuntosReales;
    resultado.puntosPorCategoria = puntosPorCategoria;
    resultado.registrosPuntos = registrosPuntos;

    // 5. Ver badges desbloqueados
    const badges = await prisma.userBadge.findMany({
      where: { userId: usuario.id },
      include: { badge: true }
    });

    resultado.badges = badges.map(ub => ({
      nombre: ub.badge.name,
      puntos: ub.badge.points,
      fecha: ub.unlockedAt,
      slug: ub.badge.slug
    }));

    // 6. Ver nivel actual
    const nivel = await prisma.userLevel.findUnique({
      where: { userId: usuario.id }
    });

    resultado.nivel = nivel ? {
      nivel: nivel.currentLevel,
      xp: nivel.currentXP,
      totalVentas: nivel.totalSales,
      actualizado: nivel.updatedAt
    } : null;

    // 7. Detectar problemas
    const diferenciaPuntos = totalPuntosReales - puntosEsperados;

    if (totalPuntosReales < puntosEsperados) {
      resultado.problemas.push({
        tipo: 'faltan_puntos',
        mensaje: `Le faltan ${puntosEsperados - totalPuntosReales} puntos`,
        detalles: {
          deberiaTener: puntosEsperados,
          tiene: totalPuntosReales,
          faltan: puntosEsperados - totalPuntosReales
        }
      });
    }

    // Verificar pedidos sin puntos registrados
    const pedidosSinPuntos = pedidosCompletados.filter(pedido => {
      const tieneRegistroPuntos = puntosReales.some(p => 
        p.description?.includes(pedido.id)
      );
      return !tieneRegistroPuntos;
    });

    if (pedidosSinPuntos.length > 0) {
      resultado.problemas.push({
        tipo: 'pedidos_sin_puntos',
        mensaje: `Hay ${pedidosSinPuntos.length} pedidos completados sin puntos registrados`,
        pedidos: pedidosSinPuntos.map(p => ({
          id: p.id.substring(0, 8) + '...',
          fecha: p.createdAt
        }))
      });
    }

    // 8. Generar resumen
    resultado.resumen = `
Usuario: ${usuario.name} (@${usuario.handle})
Pedidos completados: ${pedidosCompletados.length}
Puntos esperados (solo ventas): ${puntosEsperados}
Puntos reales (total en DB): ${totalPuntosReales}
Diferencia: ${diferenciaPuntos >= 0 ? '+' : ''}${diferenciaPuntos}
Badges desbloqueados: ${badges.length}
Nivel actual: ${nivel?.currentLevel || 'Sin nivel'}

${resultado.problemas.length > 0 ? `⚠️ PROBLEMAS DETECTADOS: ${resultado.problemas.length}` : '✅ Todo parece correcto'}
    `.trim();

    return NextResponse.json(resultado, { status: 200 });

  } catch (error) {
    console.error('Error investigando puntos:', error);
    return NextResponse.json({
      error: 'Error al investigar puntos',
      detalle: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
