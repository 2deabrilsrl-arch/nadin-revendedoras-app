import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 });

    const consolidaciones = await prisma.consolidacion.findMany({
      where: { userId },
      orderBy: { enviadoAt: 'desc' },
    });

    const totalPedidos = consolidaciones.length;
    const totalGanancia = consolidaciones.reduce((sum, c) => sum + c.ganancia, 0);
    const totalVentas = consolidaciones.reduce((sum, c) => sum + c.totalVenta, 0);

    return NextResponse.json({ totalPedidos, totalGanancia, totalVentas, consolidaciones });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener analytics' }, { status: 500 });
  }
}
