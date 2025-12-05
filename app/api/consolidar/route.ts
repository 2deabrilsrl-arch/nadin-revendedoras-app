// API: CONSOLIDAR PEDIDOS - FINAL CON AUTH CUSTOM
// Ubicación: app/api/consolidar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendConsolidacionEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pedidoIds, formaPago, tipoEnvio, transporteNombre, userId } = body;

    // Validar userId
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado - userId requerido' }, { status: 401 });
    }

    if (!pedidoIds || pedidoIds.length === 0) {
      return NextResponse.json({ error: 'No hay pedidos seleccionados' }, { status: 400 });
    }

    // Obtener pedidos con sus lineas
    const pedidos = await prisma.pedido.findMany({
      where: {
        id: { in: pedidoIds },
        userId: userId
      },
      include: { lineas: true }
    });

    if (pedidos.length !== pedidoIds.length) {
      return NextResponse.json({ error: 'Algunos pedidos no existen' }, { status: 404 });
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

    // Crear consolidación
    const consolidacion = await prisma.consolidacion.create({
      data: {
        userId: userId,
        pedidoIds: JSON.stringify(pedidoIds),
        formaPago: formaPago || 'Efectivo',
        tipoEnvio: tipoEnvio || 'Retiro',
        transporteNombre: transporteNombre || null,
        totalMayorista,
        totalVenta,
        ganancia,
        estado: 'enviado'
      }
    });

    // ✅ ACTUALIZAR ESTADOS AUTOMÁTICAMENTE
    const ahora = new Date();
    await prisma.pedido.updateMany({
      where: { id: { in: pedidoIds } },
      data: {
        estado: 'enviado',
        orderStatus: 'sent_to_nadin',
        sentToNadinAt: ahora
      }
    });

    console.log(`✅ ${pedidoIds.length} pedidos actualizados a estado: sent_to_nadin`);

    // Obtener usuario con todos los datos
    const usuario = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Generar token de acceso para armar consolidación
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 días de validez

    await prisma.consolidacionAccessToken.create({
      data: {
        consolidacionId: consolidacion.id,
        token,
        expiresAt
      }
    });

    // Link mágico
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const linkMagico = `${baseUrl}/armar-consolidacion/${token}`;

    console.log('🔗 Link mágico generado:', linkMagico);
    console.log('📧 Enviando email a nadinlenceria@gmail.com...');

    // Enviar email a Nadin
    await sendConsolidacionEmail({
      revendedora: {
        name: usuario.name,
        handle: usuario.handle,
        email: usuario.email,
        dni: usuario.dni,
        telefono: usuario.telefono
      },
      pedidos: pedidos.map(p => ({
        id: p.id,
        cliente: p.cliente,
        telefono: p.telefono || '',
        lineas: p.lineas
      })),
      totales: {
        mayorista: totalMayorista,
        venta: totalVenta,
        ganancia
      },
      formaPago: formaPago || 'Efectivo',
      tipoEnvio: tipoEnvio || 'Retiro',
      transporteNombre: transporteNombre || null,
      linkMagico
    });

    return NextResponse.json({
      success: true,
      consolidacion,
      linkMagico
    });

  } catch (error) {
    console.error('Error en consolidación:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PATCH: Marcar consolidación como pagada
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { consolidacionId, pagado, userEmail } = body;

    // Validar que es vendedora
    if (!userEmail || userEmail !== 'nadinlenceria@gmail.com') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!consolidacionId) {
      return NextResponse.json({ error: 'Falta consolidacionId' }, { status: 400 });
    }

    const consolidacion = await prisma.consolidacion.findUnique({
      where: { id: consolidacionId }
    });

    if (!consolidacion) {
      return NextResponse.json({ error: 'Consolidación no encontrada' }, { status: 404 });
    }

    const pedidoIds = JSON.parse(consolidacion.pedidoIds);
    const ahora = new Date();

    // Actualizar consolidación
    await prisma.consolidacion.update({
      where: { id: consolidacionId },
      data: {
        pagadoEn: pagado ? ahora : null
      }
    });

    // ✅ ACTUALIZAR PEDIDOS AUTOMÁTICAMENTE
    await prisma.pedido.updateMany({
      where: { id: { in: pedidoIds } },
      data: {
        paidToNadin: pagado,
        paidToNadinAt: pagado ? ahora : null,
        orderStatus: pagado ? 'pagado' : 'armado_completo'
      }
    });

    console.log(`✅ Consolidación ${pagado ? 'pagada' : 'despagada'}: ${pedidoIds.length} pedidos actualizados`);

    return NextResponse.json({
      success: true,
      message: pagado ? 'Consolidación marcada como pagada' : 'Consolidación marcada como no pagada'
    });

  } catch (error) {
    console.error('Error marcando pago:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
