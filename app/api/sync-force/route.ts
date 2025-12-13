// API: Sincronización FORZADA del catálogo (sin cache)
// Ubicación: app/api/sync-force/route.ts
// Uso: Ejecutar una vez para forzar actualización

import { NextResponse } from 'next/server';
import { syncCatalogWithFullCategories } from '@/lib/catalog-sync';

export const maxDuration = 300; // 5 minutos
export const dynamic = 'force-dynamic'; // IMPORTANTE: Deshabilitar cache
export const revalidate = 0; // NO cachear

export async function GET(request: Request) {
  const startTime = Date.now();
  const ahora = new Date();
  
  console.log('\n🔥 ========================================');
  console.log('🔥 SINCRONIZACIÓN FORZADA - SIN CACHE');
  console.log('🔥 ========================================');
  console.log('📅 Fecha servidor:', ahora.toISOString());
  console.log('📅 Fecha legible:', ahora.toLocaleString('es-AR'));
  console.log('🔥 ========================================\n');
  
  try {
    // Verificar que la fecha del servidor sea correcta
    const serverDate = new Date();
    console.log('🕐 Verificación de fecha:');
    console.log('   Server Date:', serverDate.toISOString());
    console.log('   Year:', serverDate.getFullYear());
    console.log('   Month:', serverDate.getMonth() + 1);
    console.log('   Day:', serverDate.getDate());
    console.log('   Hours:', serverDate.getHours());
    console.log('   Minutes:', serverDate.getMinutes());
    console.log('   Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    console.log('\n⏳ Iniciando sincronización...\n');
    
    const result = await syncCatalogWithFullCategories();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    const finalTime = new Date();
    
    console.log('\n✅ ========================================');
    console.log('✅ SINCRONIZACIÓN COMPLETADA');
    console.log('✅ ========================================');
    console.log('📦 Productos:', result.count);
    console.log('⏱️  Duración:', duration, 'segundos');
    console.log('📅 Fin:', finalTime.toISOString());
    console.log('✅ ========================================\n');
    
    return NextResponse.json({
      success: true,
      productos: result.count,
      duracion: `${duration}s`,
      inicioTimestamp: ahora.toISOString(),
      finTimestamp: finalTime.toISOString(),
      inicioLegible: ahora.toLocaleString('es-AR'),
      finLegible: finalTime.toLocaleString('es-AR'),
      servidor: {
        año: finalTime.getFullYear(),
        mes: finalTime.getMonth() + 1,
        dia: finalTime.getDate(),
        hora: finalTime.getHours(),
        minutos: finalTime.getMinutes(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      mensaje: `✅ ${result.count} productos sincronizados en ${duration}s`
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error: any) {
    console.error('\n❌ ========================================');
    console.error('❌ ERROR EN SINCRONIZACIÓN');
    console.error('❌ ========================================');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    console.error('❌ ========================================\n');
    
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  }
}
