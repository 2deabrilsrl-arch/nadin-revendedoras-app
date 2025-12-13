// API: ADMIN CONSOLIDACIONES CON FILTROS - CORREGIDO
// Ubicacion: app/api/admin/consolidaciones/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pendientesArmado = searchParams.get('pendientesArmado') === 'true';
    const pendientesPago = searchParams.get('pendientesPago') === 'true';
    const pendientesEntrega = searchParams.get('pendientesEntrega') === 'true';

    let where: any = {};

    if (pendientesArmado) {
      // 🔥 Consolidaciones enviadas pero NO armadas
      where = {
        estado: 'enviado',
        armadoEn: null,
        completadoEn: null
      };
      console.log('🔍 Filtrando pendientes de ARMADO');
      
    } else if (pendientesPago) {
      // ✅ CORREGIDO: Consolidaciones armadas pero NO pagadas
      where = {
        estado: 'armado',  // ✅ Buscar estado armado
        armadoEn: { not: null },  // ✅ Que tengan fecha de armado
        pagadoEn: null  // ✅ Que NO estén pagadas
      };
      console.log('🔍 Filtrando pendientes de PAGO');
      
    } else if (pendientesEntrega) {
      // Consolidaciones pagadas pero no entregadas
      where = {
        pagadoEn: { not: null },
        cerrado: false
      };
      console.log('🔍 Filtrando pendientes de ENTREGA');
    }

    const consolidaciones = await prisma.consolidacion.findMany({
      where,
      include: {
        user: true,
        accessTokens: true
      },
      orderBy: { enviadoAt: 'desc' }
    });

    console.log(`✅ Encontradas ${consolidaciones.length} consolidaciones`);
    if (consolidaciones.length > 0) {
      console.log('📋 Consolidaciones:');
      consolidaciones.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.id.slice(-8)} - Estado: ${c.estado} - Usuario: ${c.user.name}`);
      });
    }

    return NextResponse.json({ success: true, consolidaciones });

  } catch (error) {
    console.error('Error obteniendo consolidaciones:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
