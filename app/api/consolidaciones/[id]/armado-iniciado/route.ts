// API: MARCAR ARMADO INICIADO
// Ubicacion: app/api/consolidaciones/[id]/armado-iniciado/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('🔧 Marcando armado iniciado para consolidación:', id);

    // Actualizar consolidación
    await prisma.consolidacion.update({
      where: { id },
      data: {
        armadoIniciadoAt: new Date(),
        estado: 'armando'
      }
    });

    console.log('✅ Armado iniciado marcado');

    return NextResponse.json({
      success: true,
      message: 'Armado iniciado marcado'
    });

  } catch (error) {
    console.error('❌ Error marcando armado iniciado:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
