// API: NOTIFICACIONES REVENDEDORA
// Ubicación: app/api/notificaciones/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Obtener notificaciones de un usuario
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
    }

    const notificaciones = await prisma.notificacion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Últimas 50
    });

    return NextResponse.json({ success: true, notificaciones });

  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PATCH: Marcar notificación(es) como leída(s)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { notificacionId, userId, markAllAsRead } = body;

    if (markAllAsRead && userId) {
      // Marcar todas como leídas
      await prisma.notificacion.updateMany({
        where: {
          userId,
          leida: false
        },
        data: { leida: true }
      });

      return NextResponse.json({ success: true, message: 'Todas marcadas como leídas' });
    }

    if (notificacionId) {
      // Marcar una como leída
      await prisma.notificacion.update({
        where: { id: notificacionId },
        data: { leida: true }
      });

      return NextResponse.json({ success: true, message: 'Notificación marcada como leída' });
    }

    return NextResponse.json({ error: 'Falta notificacionId o markAllAsRead' }, { status: 400 });

  } catch (error) {
    console.error('Error actualizando notificación:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
