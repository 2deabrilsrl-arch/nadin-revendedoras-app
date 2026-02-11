import { NextRequest, NextResponse } from 'next/server';
import { getBestSellingProducts } from '@/lib/tiendanube';
import { formatProductsWithFullCategories } from '@/lib/catalog-sync';

// ✅ CRÍTICO: Configuración para evitar caché
export const maxDuration = 300; // 5 minutos
export const dynamic = 'force-dynamic'; // Deshabilitar cache
export const revalidate = 0; // NO cachear

export async function GET(req: NextRequest) {
  try {
    const ahora = new Date();
    console.log('\n🔥 ========================================');
    console.log('🔥 BEST SELLERS - CONSULTA A TIENDANUBE');
    console.log('🔥 ========================================');
    console.log('📅 Timestamp:', ahora.toISOString());
    console.log('🔥 ========================================\n');

    // Traer productos de TN con sort_by: 'best-selling'
    // La API de TN usa su propio algoritmo (probablemente trimestral/anual)
    const products = await getBestSellingProducts(200);
    
    if (!products || products.length === 0) {
      console.log('⚠️ No se obtuvieron productos de Tiendanube');
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    console.log(`📦 ${products.length} productos más vendidos obtenidos de TN`);
    
    // Formatear con categorías completas para que funcionen los filtros
    const formatted = await formatProductsWithFullCategories(products);
    
    console.log(`✅ ${formatted.length} productos formateados con categorías completas`);
    
    // Mostrar algunos ejemplos
    if (formatted.length > 0) {
      console.log('\n📋 Ejemplos de productos más vendidos:');
      formatted.slice(0, 5).forEach((p, idx) => {
        console.log(`  ${idx + 1}. "${p.name}" - ${p.category}`);
      });
    }

    const fin = new Date();
    console.log('\n✅ ========================================');
    console.log('✅ BEST SELLERS COMPLETADO');
    console.log('✅ ========================================');
    console.log('📊 Total productos:', formatted.length);
    console.log('📅 Fin:', fin.toISOString());
    console.log('✅ ========================================\n');

    return NextResponse.json(formatted, {
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