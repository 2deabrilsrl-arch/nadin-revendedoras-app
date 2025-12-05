// API: OBTENER CONSOLIDACION POR ID
// Ubicacion: app/api/consolidaciones/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const consolidacion = await prisma.consolidacion.findUnique({
      where: { id },
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
      }
    });

    if (!consolidacion) {
      return NextResponse.json(
        { error: 'Consolidación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      consolidacion
    });

  } catch (error) {
    console.error('Error obteniendo consolidación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
