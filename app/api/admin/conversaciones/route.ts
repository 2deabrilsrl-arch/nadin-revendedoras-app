// API: ADMIN CONVERSACIONES ARCHIVADAS
// Ubicacion: app/api/admin/conversaciones/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ✅ CRÍTICO: Forzar ruta dinámica para evitar ISR oversized error
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Obtener parámetros de paginación
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50'); // Límite por defecto: 50
    const skip = (page - 1) * limit;

    // Obtener total de conversaciones
    const total = await prisma.consolidacion.count({
      where: {
        ConsolidacionMensaje: {
          some: {}
        }
      }
    });

    // Obtener conversaciones con paginación
    const conversaciones = await prisma.consolidacion.findMany({
      where: {
        ConsolidacionMensaje: {
          some: {}
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            handle: true
          }
        },
        ConsolidacionMensaje: {
          select: {
            id: true
          }
        }
      },
      orderBy: { enviadoAt: 'desc' },
      skip,
      take: limit
    });

    // Formatear respuesta con contador de mensajes
    const conversacionesFormateadas = conversaciones.map(c => ({
      id: c.id,
      userId: c.userId,
      pedidoIds: c.pedidoIds, // ✅ AGREGADO: necesario para el frontend
      estado: c.estado,
      enviadoAt: c.enviadoAt,
      armadoIniciadoAt: c.armadoIniciadoAt,
      cerrado: c.cerrado,
      user: c.user,
      cantidadMensajes: c.ConsolidacionMensaje.length
    }));

    return NextResponse.json({
      success: true,
      conversaciones: conversacionesFormateadas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total
      }
    });

  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
