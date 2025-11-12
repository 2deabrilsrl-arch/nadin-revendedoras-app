import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener analytics general del usuario
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || 'all'; // all, month, year

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Calcular fecha de inicio según período
    let startDate: Date | undefined;
    const now = new Date();
    
    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // Obtener todos los pedidos del usuario (filtrados por fecha si aplica)
    // EXCLUIR pedidos cancelados de las estadísticas
    const pedidos = await prisma.pedido.findMany({
      where: {
        userId,
        estado: { not: 'cancelado' },
        ...(startDate && { createdAt: { gte: startDate } })
      },
      include: {
        lineas: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calcular métricas generales
    const totalPedidos = pedidos.length;
    
    const totalVentas = pedidos.reduce((sum, p) => {
      return sum + p.lineas.reduce((lineSum, l) => lineSum + (l.venta * l.qty), 0);
    }, 0);
    
    // 💰 GANANCIA ESTIMADA: Usar costos mayoristas
    // (Las ganancias reales se calculan en el frontend desde Consolidaciones)
    const totalGanancia = pedidos.reduce((sum, p) => {
      const totalVentaPedido = p.lineas.reduce((lineSum, l) => lineSum + (l.venta * l.qty), 0);
      const costoPedido = p.lineas.reduce((lineSum, l) => lineSum + (l.mayorista * l.qty), 0);
      const gananciaPedido = totalVentaPedido - costoPedido;
      return sum + gananciaPedido;
    }, 0);

    // Clientas únicas
    const clientasUnicas = new Set(pedidos.map(p => p.cliente.toLowerCase().trim()));
    const totalClientas = clientasUnicas.size;

    // Ticket promedio
    const ticketPromedio = totalPedidos > 0 ? totalVentas / totalPedidos : 0;

    // Top 10 clientas por monto
    const clientasMap = new Map<string, { 
      nombre: string;
      totalCompras: number;
      cantidadPedidos: number;
      ultimaCompra: Date;
    }>();

    pedidos.forEach(pedido => {
      const clienteKey = pedido.cliente.toLowerCase().trim();
      const montoTotal = pedido.lineas.reduce((sum, l) => sum + (l.venta * l.qty), 0);
      
      if (clientasMap.has(clienteKey)) {
        const existing = clientasMap.get(clienteKey)!;
        existing.totalCompras += montoTotal;
        existing.cantidadPedidos += 1;
        if (pedido.createdAt > existing.ultimaCompra) {
          existing.ultimaCompra = pedido.createdAt;
        }
      } else {
        clientasMap.set(clienteKey, {
          nombre: pedido.cliente,
          totalCompras: montoTotal,
          cantidadPedidos: 1,
          ultimaCompra: pedido.createdAt
        });
      }
    });

    const topClientas = Array.from(clientasMap.values())
      .sort((a, b) => b.totalCompras - a.totalCompras)
      .slice(0, 10);

    // Ventas por mes (últimos 6 meses)
    const ventasPorMes = new Map<string, number>();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return date.toISOString().substring(0, 7); // YYYY-MM
    }).reverse();

    last6Months.forEach(month => ventasPorMes.set(month, 0));

    pedidos.forEach(pedido => {
      const month = pedido.createdAt.toISOString().substring(0, 7);
      if (ventasPorMes.has(month)) {
        const monto = pedido.lineas.reduce((sum, l) => sum + (l.venta * l.qty), 0);
        ventasPorMes.set(month, ventasPorMes.get(month)! + monto);
      }
    });

    const ventasMensuales = Array.from(ventasPorMes.entries()).map(([mes, total]) => ({
      mes,
      total: Math.round(total)
    }));

    // Productos más vendidos
    const productosMap = new Map<string, {
      nombre: string;
      brand: string;
      cantidadVendida: number;
      totalVentas: number;
    }>();

    pedidos.forEach(pedido => {
      pedido.lineas.forEach(linea => {
        const key = `${linea.productId}-${linea.variantId}`;
        if (productosMap.has(key)) {
          const existing = productosMap.get(key)!;
          existing.cantidadVendida += linea.qty;
          existing.totalVentas += linea.venta * linea.qty;
        } else {
          productosMap.set(key, {
            nombre: linea.name,
            brand: linea.brand || 'Sin marca',
            cantidadVendida: linea.qty,
            totalVentas: linea.venta * linea.qty
          });
        }
      });
    });

    const topProductos = Array.from(productosMap.values())
      .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
      .slice(0, 10);

    // Estados de pedidos
    const pedidosPorEstado = pedidos.reduce((acc, p) => {
      const estado = p.estado;
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Response
    const analytics = {
      metricas: {
        totalPedidos,
        totalVentas: Math.round(totalVentas),
        totalGanancia: Math.round(totalGanancia),
        totalClientas,
        ticketPromedio: Math.round(ticketPromedio)
      },
      topClientas,
      ventasMensuales,
      topProductos,
      pedidosPorEstado,
      periodo: period
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('❌ Error obteniendo analytics:', error);
    return NextResponse.json(
      { error: 'Error al obtener analytics' },
      { status: 500 }
    );
  }
}
