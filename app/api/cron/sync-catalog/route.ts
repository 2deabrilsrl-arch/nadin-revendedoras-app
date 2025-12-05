import { NextResponse } from 'next/server';
import { syncCatalogWithFullCategories } from '@/lib/catalog-sync';

export const maxDuration = 300; // 5 minutos

export async function GET(request: Request) {
  try {
    console.log('⏰ Cron job iniciado');
    
    const result = await syncCatalogWithFullCategories();
    
    console.log('✅ Cron job completado:', result.count);
    
    return NextResponse.json({
      success: true,
      count: result.count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error en cron:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error' 
    }, { status: 500 });
  }
}