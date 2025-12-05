// API: ADMIN CONVERSACIONES ARCHIVADAS
// Ubicacion: app/api/admin/conversaciones/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Obtener todas las consolidaciones con mensajes
    const conversaciones = await prisma.consolidacion.findMany({
      where: {
        ConsolidacionMensaje: {
          some: {}
        }
      },
      include: {
        user: true,
        ConsolidacionMensaje: {
          select: {
            id: true
          }
        }
      },
      orderBy: { enviadoAt: 'desc' }
    });

    // Formatear respuesta con contador de mensajes
    const conversacionesFormateadas = conversaciones.map(c => ({
      ...c,
      cantidadMensajes: c.ConsolidacionMensaje.length,
      ConsolidacionMensaje: undefined // No enviar todos los mensajes, solo el contador
    }));

    return NextResponse.json({
      success: true,
      conversaciones: conversacionesFormateadas
    });

  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
