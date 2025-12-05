// API: CONSOLIDACIONES - GET y POST CORREGIDO
// Ubicacion: app/api/consolidaciones/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Obtener consolidaciones de usuario
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Obtener consolidaciones del usuario
    const consolidaciones = await prisma.consolidacion.findMany({
      where: { userId },
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
      },
      orderBy: { enviadoAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      consolidaciones
    });

  } catch (error) {
    console.error('Error obteniendo consolidaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST: Crear nueva consolidacion
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, pedidoIds } = body;

    // Validaciones
    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    if (!pedidoIds || !Array.isArray(pedidoIds) || pedidoIds.length === 0) {
      return NextResponse.json(
        { error: 'pedidoIds debe ser un array con al menos un pedido' },
        { status: 400 }
      );
    }

    // Obtener pedidos para calcular totales
    const pedidos = await prisma.pedido.findMany({
      where: {
        id: { in: pedidoIds },
        userId: userId
      },
      include: {
        lineas: true
      }
    });

    if (pedidos.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron pedidos para consolidar' },
        { status: 404 }
      );
    }

    if (pedidos.length !== pedidoIds.length) {
      return NextResponse.json(
        { error: 'Algunos pedidos no existen o no pertenecen al usuario' },
        { status: 400 }
      );
    }

    // Calcular totales
    let totalMayorista = 0;
    let totalVenta = 0;

    pedidos.forEach(pedido => {
      pedido.lineas.forEach(linea => {
        totalMayorista += linea.mayorista * linea.qty;
        totalVenta += linea.venta * linea.qty;
      });
    });

    const ganancia = totalVenta - totalMayorista;

    // Crear consolidacion
    const consolidacion = await prisma.consolidacion.create({
      data: {
        userId,
        pedidoIds: JSON.stringify(pedidoIds), // ✅ Guardar como JSON string
        totalMayorista,
        totalVenta,
        ganancia,
        descuentoTotal: 0,
        formaPago: 'pendiente',
        tipoEnvio: 'pendiente',
        estado: 'enviado',
        enviadoAt: new Date()
      }
    });

    // ✅ CORREGIDO: Solo actualizar orderStatus (consolidacionId NO existe)
    await prisma.pedido.updateMany({
      where: {
        id: { in: pedidoIds }
      },
      data: {
        orderStatus: 'sent_to_nadin',
        sentToNadinAt: new Date() // ✅ Marcar fecha de envío
      }
    });

    // TODO: Enviar email a Nadin con los detalles
    // await enviarEmailConsolidacion(consolidacion, pedidos);

    return NextResponse.json({
      success: true,
      consolidacion,
      message: 'Consolidacion creada exitosamente'
    });

  } catch (error) {
    console.error('Error creando consolidacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
