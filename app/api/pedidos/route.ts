import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Obtener pedidos del usuario con sus líneas
    const pedidos = await prisma.pedido.findMany({
      where: {
        userId: userId
      },
      include: {
        lineas: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(pedidos);

  } catch (error) {
    console.error('❌ Error obteniendo pedidos:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener pedidos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
