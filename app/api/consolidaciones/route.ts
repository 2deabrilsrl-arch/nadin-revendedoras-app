// API: CONSOLIDACIONES - GET y POST CORREGIDO
// Ubicacion: app/api/consolidaciones/route.ts
// CORRECCION: URL de producción hardcodeada

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendConsolidacionEmail } from '@/lib/email';
import { dragonfishActivo } from '@/lib/consolidacion';
import { usuarioEfectivo } from '@/lib/auth-api';

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
    const body = await req.json() as any;
    body.userId = usuarioEfectivo(req, body.userId);
    const { 
      userId, 
      pedidoIds, 
      totalMayorista, 
      totalVenta, 
      ganancia,
      formaPago,
      tipoEnvio,
      transporteNombre
    } = body;

    console.log('📦 Creando consolidación...');

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

    const pedidos = await prisma.pedido.findMany({
      where: {
        id: { in: pedidoIds },
        userId: userId
      },
      include: {
        lineas: true,
        user: true
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

    void totalMayorista; void totalVenta; void ganancia;
    const tot = pedidos.reduce((a, p) => {
      for (const l of p.lineas) { a.mayorista += l.mayorista * l.qty; a.venta += l.venta * l.qty; }
      return a;
    }, { mayorista: 0, venta: 0 });

    const consolidacion = await prisma.consolidacion.create({
      data: {
        userId,
        pedidoIds: JSON.stringify(pedidoIds),
        // Totales calculados con las líneas guardadas (no con lo que manda el navegador)
        totalMayorista: tot.mayorista,
        totalVenta: tot.venta,
        ganancia: tot.venta - tot.mayorista,
        descuentoTotal: 0,
        formaPago: formaPago || 'pendiente',
        tipoEnvio: tipoEnvio || 'pendiente',
        transporteNombre: transporteNombre || null,
        estado: 'enviado',
        enviadoAt: new Date(),
        // Si está activo el puente con Dragonfish, queda en cola para generar el remito
        ...(dragonfishActivo() ? { dfEstado: 'pendiente' } : {}),
      }
    });

    console.log('✅ Consolidación creada:', consolidacion.id);

    await prisma.pedido.updateMany({
      where: {
        id: { in: pedidoIds }
      },
      data: {
        consolidacionId: consolidacion.id,
        orderStatus: 'sent_to_nadin',
        estado: 'enviado',
        sentToNadinAt: new Date()
      }
    });

    console.log(`✅ ${pedidoIds.length} pedidos actualizados`);

    // ✅ CORREGIDO: URL de producción hardcodeada
    const linkMagico = 'https://nadin-revendedoras-app.vercel.app/admin/dashboard';

    try {
      await sendConsolidacionEmail({
        revendedora: pedidos[0].user,
        pedidos,
        totales: {
          mayorista: totalMayorista || 0,
          venta: totalVenta || 0,
          descuento: 0,
          ventaFinal: totalVenta || 0,
          ganancia: ganancia || 0
        },
        formaPago: formaPago || 'pendiente',
        tipoEnvio: tipoEnvio || 'pendiente',
        transporteNombre: transporteNombre || null,
        linkMagico
      });
      
      console.log('✅ Email enviado correctamente a Nadin');
      
    } catch (emailError) {
      console.error('⚠️ Error enviando email (continuando):', emailError);
    }

    return NextResponse.json({
      success: true,
      consolidacion,
      message: 'Consolidación creada exitosamente',
      email: {
        enviado: true,
        destinatario: 'nadinlenceria@gmail.com'
      }
    });

  } catch (error) {
    console.error('❌ Error creando consolidacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
