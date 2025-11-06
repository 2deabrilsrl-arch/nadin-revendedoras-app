import { NextRequest, NextResponse } from 'next/server';
import { syncCatalogWithFullCategories } from '@/lib/catalog-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutos máximo

/**
 * Endpoint para sincronización automática via Cron Job
 * Vercel lo llamará automáticamente cada 15 minutos
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar que la petición venga de Vercel Cron
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('⚠️ Intento de acceso no autorizado al cron de sincronización');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('⏰ CRON JOB: Iniciando sincronización automática...');
    console.log('⏰ Timestamp:', new Date().toISOString());

    // Ejecutar sincronización
    const result = await syncCatalogWithFullCategories();

    console.log('✅ CRON JOB: Sincronización completada');
    console.log('✅ Productos sincronizados:', result.count);

    return NextResponse.json({
      success: true,
      message: 'Sincronización automática completada',
      timestamp: new Date().toISOString(),
      productsCount: result.count
    });
  } catch (error) {
    console.error('❌ CRON JOB: Error en sincronización automática:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error en sincronización',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// También permitir POST para testing manual
export async function POST(req: NextRequest) {
  return GET(req);
}
