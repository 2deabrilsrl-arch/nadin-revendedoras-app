import { NextResponse } from 'next/server';
import { syncCatalogWithFullCategories } from '@/lib/catalog-sync';

export const maxDuration = 300; // 5 minutos
export const dynamic = 'force-dynamic'; // IMPORTANTE: Deshabilitar cache
export const revalidate = 0; // NO cachear

export async function GET(request: Request) {
  try {
    const ahora = new Date();
    console.log('\n⏰ ========================================');
    console.log('⏰ CRON JOB INICIADO');
    console.log('⏰ ========================================');
    console.log('📅 Timestamp:', ahora.toISOString());
    console.log('⏰ ========================================\n');
    
    const result = await syncCatalogWithFullCategories();
    
    const fin = new Date();
    console.log('\n✅ Cron job completado');
    console.log('📦 Productos:', result.count);
    console.log('📅 Fin:', fin.toISOString());
    
    return NextResponse.json({
      success: true,
      count: result.count,
      timestamp: fin.toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  } catch (error) {
    console.error('❌ Error en cron:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error' 
    }, { status: 500 });
  }
}
