// API: Obtener notificaciones de revendedora
// Ubicacion: app/api/notificaciones/revendedora/[userId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { success: false, notificaciones: [] },
        { status: 400 }
      );
    }

    // Obtener notificaciones de la revendedora
    const notificaciones = await prisma.notificacion.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Últimas 50 notificaciones
    });

    return NextResponse.json({
      success: true,
      notificaciones
    });

  } catch (error) {
    console.error('Error obteniendo notificaciones revendedora:', error);
    return NextResponse.json(
      { success: false, notificaciones: [], error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
