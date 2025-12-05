// API: Armar Consolidación - CORREGIDO SEGÚN SCHEMA
// Ubicación: app/api/armar-consolidacion/[token]/route.ts

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

    // ✅ Buscar consolidación con relaciones correctas según schema
    const consolidacion = await prisma.consolidacion.findFirst({
      where: {
        accessTokens: {
          token: token,
          expiresAt: {
            gt: new Date()
          }
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
      return NextResponse.json(
        { error: 'Consolidación no encontrada o token expirado' },
        { status: 404 }
      );
    }

    // ✅ Parsear pedidoIds (es un string JSON con array de IDs)
    let pedidoIds: string[] = [];
    try {
      pedidoIds = JSON.parse(consolidacion.pedidoIds);
    } catch (error) {
      console.error('Error parseando pedidoIds:', error);
      return NextResponse.json(
        { error: 'Error en formato de pedidos' },
        { status: 500 }
      );
    }

    // ✅ Buscar los pedidos con sus líneas (items)
    const pedidos = await prisma.pedido.findMany({
      where: {
        id: {
          in: pedidoIds
        }
      },
      include: {
        lineas: true  // ✅ Incluir lineas (items del pedido)
      }
    });

    // ✅ Calcular total correctamente
    const total = pedidos.reduce((sum, pedido) => {
      const pedidoTotal = pedido.lineas.reduce((itemSum, linea) => {
        return itemSum + (linea.mayorista * linea.qty);
      }, 0);
      return sum + pedidoTotal;
    }, 0);

    // ✅ Transformar estructura para el frontend
    const pedidosConItems = pedidos.map(pedido => ({
      id: pedido.id,
      cliente: pedido.cliente,
      estado: pedido.estado,
      createdAt: pedido.createdAt,
      // Renombrar "lineas" a "items" para mantener compatibilidad con frontend
      items: pedido.lineas.map(linea => ({
        id: linea.id,
        cantidad: linea.qty,
        precioUnitario: linea.mayorista,
        // Crear objeto "producto" con los datos que están en la linea
        producto: {
          id: linea.productId,
          name: linea.name,
          brand: linea.brand,
          price: linea.mayorista,
          // Agregar talle y color como variante
          talle: linea.talle,
          color: linea.color
        }
      }))
    }));

    // ✅ Agregar pedidos y total a la consolidación
    const consolidacionConPedidos = {
      ...consolidacion,
      pedidos: pedidosConItems,
      total
    };

    return NextResponse.json(
      { 
        consolidacion: consolidacionConPedidos,
        success: true
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error en GET /api/armar-consolidacion/[token]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
