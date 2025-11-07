import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener lista de clientas con análisis de actividad mejorado
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const clienteNombre = searchParams.get('cliente'); // Para detalle individual

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Si se solicita detalle de una clienta específica
    if (clienteNombre) {
      return getClientaDetail(userId, clienteNombre);
    }

    // Obtener todos los pedidos del usuario
    const pedidos = await prisma.pedido.findMany({
      where: { userId },
      include: {
        lineas: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const now = new Date();
    const hace30Dias = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const hace90Dias = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Agrupar por clienta con análisis mejorado
    const clientasMap = new Map<string, {
      nombre: string;
      telefono: string | null;
      totalCompras: number;
      cantidadPedidos: number;
      primeraCompra: Date;
      ultimaCompra: Date;
      ticketPromedio: number;
      productosComprados: number;
      pedidosPendientes: number;
      pedidosEntregados: number;
      // Nuevas métricas
      comprasUltimos30Dias: number;
      comprasUltimos90Dias: number;
      pedidosUltimos30Dias: number;
      pedidosUltimos90Dias: number;
      diasSinComprar: number;
      estado: 'activa' | 'regular' | 'inactiva' | 'riesgo';
      tendencia: 'subiendo' | 'estable' | 'bajando';
    }>();

    pedidos.forEach(pedido => {
      const clienteKey = pedido.cliente.toLowerCase().trim();
      const montoTotal = pedido.lineas.reduce((sum, l) => sum + (l.venta * l.qty), 0);
      const cantidadProductos = pedido.lineas.reduce((sum, l) => sum + l.qty, 0);
      const fechaPedido = pedido.createdAt;
      
      if (clientasMap.has(clienteKey)) {
        const existing = clientasMap.get(clienteKey)!;
        existing.totalCompras += montoTotal;
        existing.cantidadPedidos += 1;
        existing.productosComprados += cantidadProductos;
        
        // Métricas de tiempo
        if (fechaPedido >= hace30Dias) {
          existing.comprasUltimos30Dias += montoTotal;
          existing.pedidosUltimos30Dias += 1;
        }
        if (fechaPedido >= hace90Dias) {
          existing.comprasUltimos90Dias += montoTotal;
          existing.pedidosUltimos90Dias += 1;
        }
        
        if (pedido.createdAt < existing.primeraCompra) {
          existing.primeraCompra = pedido.createdAt;
        }
        if (pedido.createdAt > existing.ultimaCompra) {
          existing.ultimaCompra = pedido.createdAt;
        }
        
        if (pedido.estado === 'pendiente') existing.pedidosPendientes += 1;
        if (pedido.estado === 'entregado') existing.pedidosEntregados += 1;
        
        if (pedido.telefono && !existing.telefono) {
          existing.telefono = pedido.telefono;
        }
      } else {
        const comprasUltimos30 = fechaPedido >= hace30Dias ? montoTotal : 0;
        const comprasUltimos90 = fechaPedido >= hace90Dias ? montoTotal : 0;
        const pedidosUltimos30 = fechaPedido >= hace30Dias ? 1 : 0;
        const pedidosUltimos90 = fechaPedido >= hace90Dias ? 1 : 0;

        clientasMap.set(clienteKey, {
          nombre: pedido.cliente,
          telefono: pedido.telefono,
          totalCompras: montoTotal,
          cantidadPedidos: 1,
          primeraCompra: pedido.createdAt,
          ultimaCompra: pedido.createdAt,
          ticketPromedio: montoTotal,
          productosComprados: cantidadProductos,
          pedidosPendientes: pedido.estado === 'pendiente' ? 1 : 0,
          pedidosEntregados: pedido.estado === 'entregado' ? 1 : 0,
          comprasUltimos30Dias: comprasUltimos30,
          comprasUltimos90Dias: comprasUltimos90,
          pedidosUltimos30Dias: pedidosUltimos30,
          pedidosUltimos90Dias: pedidosUltimos90,
          diasSinComprar: 0,
          estado: 'activa',
          tendencia: 'estable'
        });
      }
    });

    // Calcular estado, tendencia y días sin comprar
    const clientas = Array.from(clientasMap.values()).map(c => {
      // Días sin comprar
      const diasSinComprar = Math.ceil(
        (now.getTime() - c.ultimaCompra.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Estado de actividad
      let estado: 'activa' | 'regular' | 'inactiva' | 'riesgo';
      if (diasSinComprar <= 15) {
        estado = 'activa';
      } else if (diasSinComprar <= 30) {
        estado = 'regular';
      } else if (diasSinComprar <= 60) {
        estado = 'inactiva';
      } else {
        estado = 'riesgo';
      }

      // Calcular tendencia
      const ticketPromedio = c.totalCompras / c.cantidadPedidos;
      const ticketUltimos30 = c.pedidosUltimos30Dias > 0 
        ? c.comprasUltimos30Dias / c.pedidosUltimos30Dias 
        : 0;
      
      let tendencia: 'subiendo' | 'estable' | 'bajando';
      if (ticketUltimos30 === 0) {
        tendencia = 'bajando'; // No compró nada reciente
      } else if (ticketUltimos30 > ticketPromedio * 1.2) {
        tendencia = 'subiendo'; // Comprando 20% más que su promedio
      } else if (ticketUltimos30 < ticketPromedio * 0.8) {
        tendencia = 'bajando'; // Comprando 20% menos que su promedio
      } else {
        tendencia = 'estable';
      }

      return {
        ...c,
        ticketPromedio: Math.round(ticketPromedio),
        totalCompras: Math.round(c.totalCompras),
        comprasUltimos30Dias: Math.round(c.comprasUltimos30Dias),
        comprasUltimos90Dias: Math.round(c.comprasUltimos90Dias),
        diasSinComprar,
        estado,
        tendencia
      };
    });

    // Ordenar por total de compras (descendente)
    clientas.sort((a, b) => b.totalCompras - a.totalCompras);

    return NextResponse.json({ clientas });

  } catch (error) {
    console.error('❌ Error obteniendo clientas:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientas' },
      { status: 500 }
    );
  }
}

// Función auxiliar para obtener detalle de una clienta
async function getClientaDetail(userId: string, clienteNombre: string) {
  try {
    const cliente = decodeURIComponent(clienteNombre);

    // Obtener todos los pedidos de esta clienta
    const pedidos = await prisma.pedido.findMany({
      where: {
        userId,
        cliente: {
          equals: cliente,
          mode: 'insensitive'
        }
      },
      include: {
        lineas: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (pedidos.length === 0) {
      return NextResponse.json(
        { error: 'Clienta no encontrada' },
        { status: 404 }
      );
    }

    const now = new Date();
    const hace30Dias = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const hace90Dias = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Calcular métricas
    const totalCompras = pedidos.reduce((sum, p) => {
      return sum + p.lineas.reduce((lineSum, l) => lineSum + (l.venta * l.qty), 0);
    }, 0);

    const totalProductos = pedidos.reduce((sum, p) => {
      return sum + p.lineas.reduce((lineSum, l) => lineSum + l.qty, 0);
    }, 0);

    const ticketPromedio = totalCompras / pedidos.length;

    // Métricas de período
    const comprasUltimos30 = pedidos
      .filter(p => p.createdAt >= hace30Dias)
      .reduce((sum, p) => sum + p.lineas.reduce((s, l) => s + (l.venta * l.qty), 0), 0);

    const comprasUltimos90 = pedidos
      .filter(p => p.createdAt >= hace90Dias)
      .reduce((sum, p) => sum + p.lineas.reduce((s, l) => s + (l.venta * l.qty), 0), 0);

    const pedidosUltimos30 = pedidos.filter(p => p.createdAt >= hace30Dias).length;
    const pedidosUltimos90 = pedidos.filter(p => p.createdAt >= hace90Dias).length;

    // Días sin comprar
    const diasSinComprar = Math.ceil(
      (now.getTime() - pedidos[0].createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Estado
    let estado: 'activa' | 'regular' | 'inactiva' | 'riesgo';
    if (diasSinComprar <= 15) estado = 'activa';
    else if (diasSinComprar <= 30) estado = 'regular';
    else if (diasSinComprar <= 60) estado = 'inactiva';
    else estado = 'riesgo';

    // Productos más comprados
    const productosMap = new Map<string, {
      nombre: string;
      brand: string;
      cantidad: number;
      totalGastado: number;
    }>();

    pedidos.forEach(pedido => {
      pedido.lineas.forEach(linea => {
        const key = `${linea.productId}-${linea.variantId}`;
        if (productosMap.has(key)) {
          const existing = productosMap.get(key)!;
          existing.cantidad += linea.qty;
          existing.totalGastado += linea.venta * linea.qty;
        } else {
          productosMap.set(key, {
            nombre: linea.name,
            brand: linea.brand || 'Sin marca',
            cantidad: linea.qty,
            totalGastado: linea.venta * linea.qty
          });
        }
      });
    });

    const productosFavoritos = Array.from(productosMap.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5)
      .map(p => ({
        ...p,
        totalGastado: Math.round(p.totalGastado)
      }));

    // Compras por mes
    const comprasPorMes = new Map<string, number>();
    pedidos.forEach(pedido => {
      const mes = pedido.createdAt.toISOString().substring(0, 7);
      const monto = pedido.lineas.reduce((sum, l) => sum + (l.venta * l.qty), 0);
      comprasPorMes.set(mes, (comprasPorMes.get(mes) || 0) + monto);
    });

    const historialMensual = Array.from(comprasPorMes.entries())
      .map(([mes, total]) => ({ mes, total: Math.round(total) }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    // Calcular frecuencia de compra
    let frecuenciaPromedio = 0;
    if (pedidos.length > 1) {
      const fechas = pedidos.map(p => p.createdAt.getTime()).sort((a, b) => a - b);
      const diferencias = [];
      for (let i = 1; i < fechas.length; i++) {
        const dias = (fechas[i] - fechas[i - 1]) / (1000 * 60 * 60 * 24);
        diferencias.push(dias);
      }
      frecuenciaPromedio = diferencias.reduce((a, b) => a + b, 0) / diferencias.length;
    }

    // Formatear pedidos
    const historialPedidos = pedidos.map(p => ({
      id: p.id,
      fecha: p.createdAt,
      estado: p.estado,
      totalProductos: p.lineas.reduce((sum, l) => sum + l.qty, 0),
      totalVenta: Math.round(p.lineas.reduce((sum, l) => sum + (l.venta * l.qty), 0)),
      productos: p.lineas.map(l => ({
        nombre: l.name,
        talle: l.talle,
        color: l.color,
        cantidad: l.qty,
        precio: l.venta
      }))
    }));

    const clientaDetail = {
      nombre: pedidos[0].cliente,
      telefono: pedidos[0].telefono,
      metricas: {
        totalPedidos: pedidos.length,
        totalCompras: Math.round(totalCompras),
        totalProductos,
        ticketPromedio: Math.round(ticketPromedio),
        primeraCompra: pedidos[pedidos.length - 1].createdAt,
        ultimaCompra: pedidos[0].createdAt,
        frecuenciaPromedio: Math.round(frecuenciaPromedio),
        // Nuevas métricas
        comprasUltimos30Dias: Math.round(comprasUltimos30),
        comprasUltimos90Dias: Math.round(comprasUltimos90),
        pedidosUltimos30Dias: pedidosUltimos30,
        pedidosUltimos90Dias: pedidosUltimos90,
        diasSinComprar,
        estado
      },
      productosFavoritos,
      historialMensual,
      historialPedidos
    };

    return NextResponse.json(clientaDetail);

  } catch (error) {
    console.error('❌ Error obteniendo detalle de clienta:', error);
    return NextResponse.json(
      { error: 'Error al obtener detalle de clienta' },
      { status: 500 }
    );
  }
}
