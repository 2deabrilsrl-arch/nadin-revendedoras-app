// API: CONTADORES DE MENSAJES SIN LEER
// Ubicacion: app/api/admin/mensajes-sin-leer/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Obtener todos los mensajes de revendedoras que no han sido leídos
    const mensajesSinLeer = await prisma.consolidacionMensaje.findMany({
      where: {
        autorTipo: 'revendedora',
        leido: false
      },
      select: {
        consolidacionId: true
      }
    });

    // Agrupar por consolidación
    const contadores: Record<string, number> = {};
    mensajesSinLeer.forEach(msg => {
      contadores[msg.consolidacionId] = (contadores[msg.consolidacionId] || 0) + 1;
    });

    console.log('📊 Mensajes sin leer:', contadores);

    return NextResponse.json({
      success: true,
      contadores
    });

  } catch (error) {
    console.error('Error obteniendo contadores:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
