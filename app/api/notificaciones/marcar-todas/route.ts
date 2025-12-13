// API: MARCAR TODAS LAS NOTIFICACIONES
// Ubicacion: app/api/notificaciones/marcar-todas/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body as any;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requerido' },
        { status: 400 }
      );
    }

    await prisma.notificacion.updateMany({
      where: {
        usuarioId: userId,
        leida: false
      } as any,
      data: {
        leida: true
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error marcando todas:', error);
    return NextResponse.json(
      { error: 'Error al marcar notificaciones' },
      { status: 500 }
    );
  }
}
