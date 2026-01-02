// VERIFICADOR DE PEDIDO DE ANGELES - USA paidToNadin
// Ubicación: app/api/admin/verificar-pedido-angeles/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processGamificationAfterSale } from '@/lib/gamification';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'ver' o 'corregir'

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
        error: 'Usuario no encontrado'
      }, { status: 404 });
    }

    // 2. Buscar TODOS sus pedidos (no cancelados)
    const pedidos = await prisma.pedido.findMany({
      where: {
        userId: usuario.id,
        NOT: {
          estado: 'cancelado'
        }
      },
      include: {
        lineas: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📦 Total pedidos de ${usuario.name}: ${pedidos.length}`);

    // 3. Analizar cada pedido
    const analisisPedidos = pedidos.map(pedido => {
      const montoVenta = pedido.lineas.reduce((sum, linea) => {
        return sum + (linea.venta * linea.qty);
      }, 0);

      const montoMayorista = pedido.lineas.reduce((sum, linea) => {
        return sum + (linea.mayorista * linea.qty);
      }, 0);

      return {
        id: pedido.id,
        fecha: pedido.createdAt,
        cliente: pedido.cliente,
        
        // Estados
        estado: pedido.estado,
        orderStatus: pedido.orderStatus,
        
        // Pagos
        paidToNadin: pedido.paidToNadin,  // ← LO QUE IMPORTA PARA GAMIFICACIÓN
        paidByClient: pedido.paidByClient,
        
        // Fechas
        paidToNadinAt: pedido.paidToNadinAt,
        paidByClientAt: pedido.paidByClientAt,
        
        // Montos
        montoVenta,
        montoMayorista,
        ganancia: montoVenta - montoMayorista,
        
        // Productos
        productos: pedido.lineas.map(l => ({
          nombre: l.name,
          talle: l.talle,
          color: l.color,
          cantidad: l.qty,
          precioVenta: l.venta
        })),
        
        // ¿Cuenta para gamificación?
        cuentaParaGamificacion: pedido.paidToNadin === true
      };
    });

    // 4. Separar pedidos por categoría
    const pedidosPagadosANadin = analisisPedidos.filter(p => p.paidToNadin === true);
    const pedidosSinPagar = analisisPedidos.filter(p => p.paidToNadin === false);

    // 5. Calcular puntos que DEBERÍA tener
    let puntosEsperados = 0;
    
    pedidosPagadosANadin.forEach((pedido, index) => {
      const isFirstSale = (index === 0);
      const basePoints = Math.floor(pedido.montoVenta / 1000) * 10;
      const firstSaleBonus = isFirstSale ? 50 : 0;
      const puntos = basePoints + firstSaleBonus;
      
      puntosEsperados += puntos;
    });

    // 6. Obtener puntos REALES
    const puntosReales = await prisma.point.findMany({
      where: { userId: usuario.id }
    });

    const totalPuntosReales = puntosReales.reduce((sum, p) => sum + p.amount, 0);

    // 7. Obtener nivel actual
    const nivel = await prisma.userLevel.findUnique({
      where: { userId: usuario.id }
    });

    // 8. Si la acción es "corregir", procesar gamificación
    if (action === 'corregir') {
      console.log('\n🔧 CORRIGIENDO GAMIFICACIÓN...');

      // Para cada pedido pagado a Nadin, procesar gamificación
      for (const pedido of pedidosPagadosANadin) {
        console.log(`   Procesando pedido ${pedido.id.substring(0, 8)}...`);
        
        await processGamificationAfterSale(usuario.id, pedido.montoVenta);
      }

      // Obtener datos actualizados
      const puntosActualizados = await prisma.point.findMany({
        where: { userId: usuario.id }
      });

      const totalPuntosActualizados = puntosActualizados.reduce((sum, p) => sum + p.amount, 0);

      const nivelActualizado = await prisma.userLevel.findUnique({
        where: { userId: usuario.id }
      });

      return NextResponse.json({
        success: true,
        mensaje: '✅ Gamificación corregida',
        usuario: {
          nombre: usuario.name,
          email: usuario.email,
          handle: usuario.handle
        },
        antes: {
          puntos: totalPuntosReales,
          nivel: nivel?.currentLevel || 'sin nivel'
        },
        despues: {
          puntos: totalPuntosActualizados,
          nivel: nivelActualizado?.currentLevel || 'sin nivel'
        },
        pedidosPagadosANadin: pedidosPagadosANadin.length
      });
    }

    // 9. Si solo es "ver", retornar análisis completo
    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.name,
        email: usuario.email,
        dni: usuario.dni,
        handle: usuario.handle
      },
      resumen: {
        totalPedidos: pedidos.length,
        pedidosPagadosANadin: pedidosPagadosANadin.length,
        pedidosSinPagar: pedidosSinPagar.length,
        puntosEsperados,
        puntosReales: totalPuntosReales,
        diferencia: totalPuntosReales - puntosEsperados
      },
      nivel: nivel ? {
        nivel: nivel.currentLevel,
        xp: nivel.currentXP,
        totalVentas: nivel.totalSales
      } : null,
      pedidos: {
        pagadosANadin: pedidosPagadosANadin,
        sinPagar: pedidosSinPagar
      },
      diagnostico: {
        problema: pedidosPagadosANadin.length > 0 && totalPuntosReales < puntosEsperados
          ? 'Tiene pedidos pagados pero le faltan puntos'
          : pedidosSinPagar.length > 0 && pedidosPagadosANadin.length === 0
          ? 'Tiene pedidos pero ninguno está marcado como pagado a Nadin'
          : 'Todo parece estar correcto',
        accion: pedidosPagadosANadin.length > 0 && totalPuntosReales < puntosEsperados
          ? 'Ejecutar con ?action=corregir para recalcular puntos'
          : pedidosSinPagar.length > 0 && pedidosPagadosANadin.length === 0
          ? 'Necesita que marques los pedidos como pagados a Nadin primero'
          : 'No se requiere acción'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      error: 'Error al procesar solicitud',
      detalle: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
