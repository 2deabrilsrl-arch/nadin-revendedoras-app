import { NextRequest, NextResponse } from 'next/server';
import { getCachedBestSellers } from '@/lib/catalog-sync';

// ✅ CRÍTICO: Configuración para evitar caché
export const maxDuration = 60; // 1 minuto es suficiente (lectura rápida del cache)
export const dynamic = 'force-dynamic'; // Deshabilitar cache
export const revalidate = 0; // NO cachear

export async function GET(req: NextRequest) {
  try {
    const ahora = new Date();
    console.log('\n🔥 ========================================');
    console.log('🔥 BEST SELLERS - LECTURA DESDE CACHE');
    console.log('🔥 ========================================');
    console.log('📅 Timestamp:', ahora.toISOString());
    console.log('🔥 ========================================\n');

    // Leer los productos más vendidos desde el cache
    // Estos se actualizan automáticamente cada 15 min por el cron job
    const products = await getCachedBestSellers(200);
    
    if (!products || products.length === 0) {
      console.log('⚠️ No hay best sellers en cache');
      console.log('💡 Esperá a que el cron job sincronice (cada 15 min)\n');
      
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    console.log(`📦 ${products.length} productos más vendidos obtenidos del cache`);
    
    // Mostrar algunos ejemplos
    if (products.length > 0) {
      console.log('\n📋 TOP 10 Productos más vendidos:');
      products.slice(0, 10).forEach((p, idx) => {
        console.log(`  ${idx + 1}° "${p.name}" - ${p.category}`);
      });
    }

    const fin = new Date();
    console.log('\n✅ ========================================');
    console.log('✅ BEST SELLERS COMPLETADO (desde cache)');
    console.log('✅ ========================================');
    console.log('📊 Total productos:', products.length);
    console.log('📅 Fin:', fin.toISOString());
    console.log('⚡ Lectura ultra rápida desde cache');
    console.log('🔄 Próxima actualización: automática cada 15 min');
    console.log('✅ ========================================\n');

    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('❌ Error en API de más vendidos:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos más vendidos' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
        }
      }
    );
  }
}
