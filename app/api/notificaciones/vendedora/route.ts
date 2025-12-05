// API: Obtener notificaciones de vendedora (SIN AUTH)
// Ubicacion: app/api/notificaciones/vendedora/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Buscar vendedora (asumimos que solo hay una con rol vendedora)
    const vendedora = await prisma.user.findFirst({
      where: { rol: 'vendedora' }
    });

    if (!vendedora) {
      return NextResponse.json({ 
        success: false, 
        notificaciones: [] 
      });
    }

    // Obtener notificaciones de la vendedora
    const notificaciones = await prisma.notificacion.findMany({
      where: {
        userId: vendedora.id
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
    console.error('Error obteniendo notificaciones vendedora:', error);
    return NextResponse.json(
      { success: false, notificaciones: [], error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
