// API: ADMIN CONSOLIDACIONES CON FILTROS
// Ubicacion: app/api/admin/consolidaciones/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pendientesPago = searchParams.get('pendientesPago') === 'true';
    const pendientesEntrega = searchParams.get('pendientesEntrega') === 'true';

    let where: any = {};

    if (pendientesPago) {
      // Consolidaciones armadas pero no pagadas
      where = {
        completadoEn: { not: null },
        pagadoEn: null
      };
    } else if (pendientesEntrega) {
      // Consolidaciones pagadas pero no entregadas
      where = {
        pagadoEn: { not: null },
        cerrado: false
      };
    }

    const consolidaciones = await prisma.consolidacion.findMany({
      where,
      include: {
        user: true,
        accessTokens: true
      },
      orderBy: { enviadoAt: 'desc' }
    });

    return NextResponse.json({ success: true, consolidaciones });

  } catch (error) {
    console.error('Error obteniendo consolidaciones:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
