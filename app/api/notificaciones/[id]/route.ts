// API: Marcar notificación como leída y eliminar (SIN AUTH) - CORREGIDO
// Ubicacion: app/api/notificaciones/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH - Marcar como leída
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // ✅ Usar updateMany que no falla si no existe
    const result = await prisma.notificacion.updateMany({
      where: { id },
      data: { leida: true }
    });

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar notificación
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // ✅ CORRECCIÓN: Usar deleteMany en lugar de delete
    // deleteMany no falla si el registro no existe
    const result = await prisma.notificacion.deleteMany({
      where: { id }
    });

    if (result.count === 0) {
      // La notificación ya no existe, pero NO es un error
      // Simplemente devolver éxito porque el objetivo se cumplió
      console.log(`⚠️ Notificación ${id} ya estaba eliminada`);
      return NextResponse.json({ 
        success: true,
        message: 'Notificación ya estaba eliminada'
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error eliminando notificación:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
