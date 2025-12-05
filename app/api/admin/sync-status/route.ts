// 📊 ENDPOINT DE MONITOREO DE SINCRONIZACIÓN
// Guardar como: app/api/admin/sync-status/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Última sincronización
    const ultimaSync = await prisma.catalogoCache.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { 
        updatedAt: true,
        brand: true,
        category: true
      }
    });

    // 2. Total de productos
    const total = await prisma.catalogoCache.count();

    // 3. Contar marcas únicas
    const marcas = await prisma.catalogoCache.groupBy({
      by: ['brand'],
      _count: { brand: true }
    });

    // 4. Calcular tiempo desde última sync
    const ahora = Date.now();
    const ultimaSyncTime = ultimaSync?.updatedAt.getTime() || 0;
    const msDesdeSync = ahora - ultimaSyncTime;
    
    const minutosDesdeSync = Math.floor(msDesdeSync / 60000);
    const horasDesdeSync = Math.floor(msDesdeSync / 3600000);
    const diasDesdeSync = Math.floor(msDesdeSync / 86400000);

    // 5. Determinar estado
    let estado = 'ok';
    let mensaje = 'Sincronización reciente';
    let color = 'green';

    if (minutosDesdeSync > 30) {
      estado = 'warning';
      mensaje = 'Hace más de 30 minutos desde última sincronización';
      color = 'yellow';
    }

    if (horasDesdeSync > 2) {
      estado = 'error';
      mensaje = 'Hace más de 2 horas - Revisar cron job';
      color = 'red';
    }

    // 6. Verificar si Chill Out existe
    const chillOutCount = await prisma.catalogoCache.count({
      where: { brand: 'Chill Out' }
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      estado,
      mensaje,
      color,
      sincronizacion: {
        ultima: ultimaSync?.updatedAt || null,
        minutosAtras: minutosDesdeSync,
        horasAtras: horasDesdeSync,
        diasAtras: diasDesdeSync,
        tiempoLegible: diasDesdeSync > 0 
          ? `${diasDesdeSync} días`
          : horasDesdeSync > 0 
            ? `${horasDesdeSync} horas`
            : `${minutosDesdeSync} minutos`
      },
      productos: {
        total,
        marcasUnicas: marcas.length,
        chillOutPresente: chillOutCount > 0,
        chillOutCantidad: chillOutCount
      },
      topMarcas: marcas
        .sort((a, b) => b._count.brand - a._count.brand)
        .slice(0, 10)
        .map(m => ({
          marca: m.brand,
          cantidad: m._count.brand
        })),
      recomendaciones: [
        ...(horasDesdeSync > 2 ? [
          '⚠️ Verificar que el cron job esté configurado en Vercel',
          '⚠️ Revisar logs de Vercel para ver errores',
          '⚠️ Considerar sincronización manual'
        ] : []),
        ...(chillOutCount === 0 ? [
          '❌ Marca "Chill Out" no encontrada - verificar en Tiendanube'
        ] : []),
        ...(total < 1700 ? [
          '⚠️ Menos de 1700 productos - puede faltar sincronización'
        ] : [])
      ]
    });

  } catch (error) {
    console.error('❌ Error en sync-status:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// Permitir CORS para que puedas monitorear desde otras apps
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
