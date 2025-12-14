// API: ACTUALIZAR GANANCIA NETA DE CONSOLIDACION
// Ubicacion: app/api/admin/consolidaciones/actualizar-ganancia/route.ts
// CREAR CARPETA: app/api/admin/consolidaciones/actualizar-ganancia/

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as any;
    const { consolidacionId, costoReal } = body;

    // Validar datos
    if (!consolidacionId || !costoReal) {
      return NextResponse.json(
        { error: 'Faltan datos: consolidacionId y costoReal son requeridos' },
        { status: 400 }
      );
    }

    if (typeof costoReal !== 'number' || costoReal < 0) {
      return NextResponse.json(
        { error: 'costoReal debe ser un número positivo' },
        { status: 400 }
      );
    }

    // Obtener consolidación
    const consolidacion = await prisma.consolidacion.findUnique({
      where: { id: consolidacionId }
    });

    if (!consolidacion) {
      return NextResponse.json(
        { error: 'Consolidación no encontrada' },
        { status: 404 }
      );
    }

    // Calcular ganancia neta
    // totalVenta = lo que la revendedora cobró a sus clientas
    // costoReal = lo que la revendedora pagó a Nadin (puede ser menos por descuentos)
    // gananciaNeta = totalVenta - costoReal
    const gananciaNeta = consolidacion.totalVenta - costoReal;

    // Actualizar consolidación
    const actualizada = await prisma.consolidacion.update({
      where: { id: consolidacionId },
      data: {
        costoReal,
        gananciaNeta
      }
    });

    console.log(`✅ Ganancia neta actualizada para consolidación ${consolidacionId}:`);
    console.log(`   Total venta: $${consolidacion.totalVenta}`);
    console.log(`   Costo real: $${costoReal}`);
    console.log(`   Ganancia neta: $${gananciaNeta}`);

    return NextResponse.json({
      success: true,
      consolidacion: actualizada,
      detalles: {
        totalVenta: consolidacion.totalVenta,
        totalMayorista: consolidacion.totalMayorista,
        costoReal,
        gananciaNeta,
        descuentoAplicado: consolidacion.totalMayorista - costoReal
      }
    });

  } catch (error) {
    console.error('Error actualizando ganancia neta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
