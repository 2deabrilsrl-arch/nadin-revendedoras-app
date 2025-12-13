// API: Consolidaciones - COMPLETO con GET y POST
// Ubicación: app/api/consolidaciones/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendConsolidacionEmail } from '@/lib/email';

/**
 * GET - Listar consolidaciones de un usuario
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requerido' },
        { status: 400 }
      );
    }

    const consolidaciones = await prisma.consolidacion.findMany({
      where: {
        userId
      },
      orderBy: {
        enviadoAt: 'desc'
      },
      select: {
        id: true,
        enviadoAt: true,
        armadoEn: true,
        pagadoEn: true,
        completadoEn: true,
        estado: true,
        cerrado: true,
        totalMayorista: true,
        totalVenta: true
      }
    });

    return NextResponse.json({
      success: true,
      consolidaciones
    });

  } catch (error) {
    console.error('Error obteniendo consolidaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener consolidaciones' },
      { status: 500 }
    );
  }
}

/**
 * POST - Crear nueva consolidación
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      pedidoIds,
      formaPago,
      tipoEnvio,
      transporteNombre,
      totalMayorista,
      totalVenta,
      ganancia,
      descuentoTotal
    } = body;

    // Validaciones
    if (!userId || !pedidoIds || !formaPago || !tipoEnvio) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    if (!Array.isArray(pedidoIds) || pedidoIds.length === 0) {
      return NextResponse.json(
        { error: 'pedidoIds debe ser un array con al menos un pedido' },
        { status: 400 }
      );
    }

    console.log('📦 Creando consolidación...');
    console.log('   Usuario:', userId);
    console.log('   Pedidos:', pedidoIds.length);
    console.log('   Total mayorista:', totalMayorista);

    // Crear consolidación
    const consolidacion = await prisma.consolidacion.create({
      data: {
        userId,
        pedidoIds: JSON.stringify(pedidoIds),
        formaPago,
        tipoEnvio,
        transporteNombre: transporteNombre || null,
        totalMayorista: parseFloat(totalMayorista) || 0,
        totalVenta: parseFloat(totalVenta) || 0,
        ganancia: parseFloat(ganancia) || 0,
        descuentoTotal: parseFloat(descuentoTotal) || 0,
        estado: 'enviado',
        cerrado: false
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            telefono: true
          }
        }
      }
    });

    console.log('✅ Consolidación creada:', consolidacion.id);

    // Actualizar pedidos con consolidacionId y cambiar estado
    await prisma.pedido.updateMany({
      where: {
        id: {
          in: pedidoIds
        }
      },
      data: {
        consolidacionId: consolidacion.id,
        estado: 'enviado',
        orderStatus: 'enviado',
        sentToNadinAt: new Date()
      }
    });

    console.log('✅ Pedidos actualizados con consolidacionId');

    // Generar token de acceso
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Expira en 30 días

    await prisma.consolidacionAccessToken.create({
      data: {
        consolidacionId: consolidacion.id,
        token,
        expiresAt
      }
    });

    console.log('✅ Token de acceso generado');

    // Enviar email a Nadin
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
      const armarUrl = `${baseUrl}/armar-consolidacion/${token}`;

      await sendConsolidacionEmail({
        userName: consolidacion.user.name,
        userEmail: consolidacion.user.email || '',
        userTelefono: consolidacion.user.telefono || '',
        consolidacionId: consolidacion.id,
        cantidadPedidos: pedidoIds.length,
        totalMayorista: consolidacion.totalMayorista,
        formaPago: consolidacion.formaPago,
        tipoEnvio: consolidacion.tipoEnvio,
        transporteNombre: consolidacion.transporteNombre,
        armarUrl
      });

      console.log('✅ Email enviado a Nadin');
    } catch (emailError) {
      console.error('⚠️ Error enviando email (continuando):', emailError);
    }

    return NextResponse.json({
      success: true,
      consolidacion: {
        id: consolidacion.id,
        estado: consolidacion.estado,
        totalMayorista: consolidacion.totalMayorista,
        totalVenta: consolidacion.totalVenta,
        ganancia: consolidacion.ganancia
      }
    });

  } catch (error) {
    console.error('❌ Error creando consolidación:', error);
    return NextResponse.json(
      { error: 'Error al crear consolidación' },
      { status: 500 }
    );
  }
}
