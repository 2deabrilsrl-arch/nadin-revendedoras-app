// API: OBTENER O CREAR ACCESS TOKEN DE CONSOLIDACION
// Ubicacion: app/api/consolidaciones/[id]/access-token/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar que existe la consolidación
    const consolidacion = await prisma.consolidacion.findUnique({
      where: { id }
    });

    if (!consolidacion) {
      return NextResponse.json(
        { success: false, error: 'Consolidación no encontrada' },
        { status: 404 }
      );
    }

    // Buscar token existente
    let accessToken = await prisma.consolidacionAccessToken.findUnique({
      where: { consolidacionId: id }
    });

    // Si no existe o expiró, crear uno nuevo
    if (!accessToken || new Date() > accessToken.expiresAt) {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 días

      accessToken = await prisma.consolidacionAccessToken.upsert({
        where: { consolidacionId: id },
        create: {
          consolidacionId: id,
          token,
          expiresAt
        },
        update: {
          token,
          expiresAt
        }
      });

      console.log('✅ Token creado/renovado para consolidación:', id);
    }

    return NextResponse.json({
      success: true,
      token: accessToken.token
    });

  } catch (error) {
    console.error('Error obteniendo access token:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
