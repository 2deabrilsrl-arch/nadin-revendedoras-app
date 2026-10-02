// API: CONSOLIDAR PEDIDOS - FINAL CON AUTH CUSTOM
// Ubicación: app/api/consolidar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { crearConsolidacion } from '@/lib/consolidacion';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as any;
    const { pedidoIds, formaPago, tipoEnvio, transporteNombre, userId } = body;

    // Validar userId
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado - userId requerido' }, { status: 401 });
    }

    if (!pedidoIds || pedidoIds.length === 0) {
      return NextResponse.json({ error: 'No hay pedidos seleccionados' }, { status: 400 });
    }

    // Lógica compartida con Tiendas Nadin (lib/consolidacion.ts)
    try {
      const { consolidacion, linkMagico } = await crearConsolidacion({ userId, pedidoIds, formaPago, tipoEnvio, transporteNombre });
      return NextResponse.json({ success: true, consolidacion, linkMagico });
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg === 'Algunos pedidos no existen' || msg === 'Usuario no encontrado') {
        return NextResponse.json({ error: msg }, { status: 404 });
      }
      throw e;
    }

  } catch (error) {
    console.error('Error en consolidación:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PATCH: Marcar consolidación como pagada
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as any;
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
