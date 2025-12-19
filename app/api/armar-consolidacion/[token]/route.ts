// API: Armar Consolidación - PRECIOS CORREGIDOS
// Ubicación: app/api/armar-consolidacion/[token]/route.ts
// FIX: Ahora envía mayorista Y venta correctamente

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token requerido' },
        { status: 400 }
      );
    }

    console.log('\n📦 ========================================');
    console.log('📦 CARGANDO CONSOLIDACIÓN PARA ARMADO');
    console.log('📦 ========================================');
    console.log(`🔑 Token: ${token}`);

    // ✅ Buscar consolidación con relaciones correctas
    const consolidacion = await prisma.consolidacion.findFirst({
      where: {
        accessTokens: {
          token: token,
          expiresAt: { gt: new Date() }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            telefono: true
          }
        },
        accessTokens: {
          select: {
            token: true,
            expiresAt: true
          }
        }
      }
    });

    if (!consolidacion) {
      console.log('❌ Consolidación no encontrada o token expirado');
      return NextResponse.json(
        { error: 'Consolidación no encontrada o token expirado' },
        { status: 404 }
      );
    }

    console.log(`✅ Consolidación encontrada: ${consolidacion.id}`);

    // ✅ Parsear pedidoIds
    let pedidoIds: string[] = [];
    try {
      pedidoIds = JSON.parse(consolidacion.pedidoIds);
      console.log(`📋 Pedidos incluidos: ${pedidoIds.length}`);
    } catch (error) {
      console.error('❌ Error parseando pedidoIds:', error);
      return NextResponse.json(
        { error: 'Error en formato de pedidos' },
        { status: 500 }
      );
    }

    // ✅ Buscar los pedidos con sus líneas
    const pedidos = await prisma.pedido.findMany({
      where: { id: { in: pedidoIds } },
      include: { lineas: true }
    });

    console.log(`✅ Pedidos cargados: ${pedidos.length}`);

    // ✅ Calcular total
    const total = pedidos.reduce((sum, pedido) => {
      const pedidoTotal = pedido.lineas.reduce((itemSum, linea) => {
        return itemSum + (linea.mayorista * linea.qty);
      }, 0);
      return sum + pedidoTotal;
    }, 0);

    console.log(`💰 Total consolidación: $${total}`);

    // ✅ CORREGIDO: Transformar estructura para el frontend con AMBOS precios
    const pedidosConItems = pedidos.map(pedido => {
      const items = pedido.lineas.map(linea => {
        // Log para debugging
        console.log(`   📦 Producto: ${linea.name}`);
        console.log(`      💵 Mayorista: $${linea.mayorista}`);
        console.log(`      💵 Venta: $${linea.venta}`);
        
        return {
          id: linea.id,
          cantidad: linea.qty,
          // ✅ Precios en el nivel del item
          mayorista: linea.mayorista,
          venta: linea.venta,
          // ✅ Objeto producto con todos los datos
          producto: {
            id: linea.productId,
            name: linea.name,
            brand: linea.brand,
            sku: linea.sku,
            // ✅ AMBOS precios incluidos
            mayorista: linea.mayorista,
            venta: linea.venta,
            talle: linea.talle,
            color: linea.color
          }
        };
      });

      return {
        id: pedido.id,
        cliente: pedido.cliente,
        telefono: pedido.telefono,    // ✅ AGREGADO: Teléfono del cliente
        nota: pedido.nota,              // ✅ AGREGADO: Nota del pedido
        estado: pedido.estado,
        createdAt: pedido.createdAt,
        items
      };
    });

    // ✅ Consolidación completa para el frontend
    const consolidacionConPedidos = {
      ...consolidacion,
      pedidos: pedidosConItems,
      total
    };

    console.log('✅ Consolidación preparada para frontend');
    console.log('📦 ========================================\n');

    return NextResponse.json(
      { 
        consolidacion: consolidacionConPedidos,
        success: true
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error en GET /api/armar-consolidacion/[token]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
