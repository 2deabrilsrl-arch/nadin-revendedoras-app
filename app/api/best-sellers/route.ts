import { NextRequest, NextResponse } from 'next/server';
import { getBestSellingProducts } from '@/lib/tiendanube';
import { formatProductsWithFullCategories } from '@/lib/catalog-sync';

export async function GET(req: NextRequest) {
  try {
    console.log('🔥 Obteniendo productos más vendidos directamente de Tiendanube...');

    // Traer productos de TN con sort_by: 'best-selling'
    // La API de TN usa su propio algoritmo (probablemente trimestral/anual)
    const products = await getBestSellingProducts(200);
    
    if (!products || products.length === 0) {
      console.log('⚠️ No se obtuvieron productos de Tiendanube');
      return NextResponse.json([]);
    }

    console.log(`📦 ${products.length} productos más vendidos obtenidos de TN`);

    // Formatear con categorías completas para que funcionen los filtros
    const formatted = await formatProductsWithFullCategories(products);
    
    console.log(`✅ ${formatted.length} productos formateados con categorías completas`);

    // Mostrar algunos ejemplos
    if (formatted.length > 0) {
      console.log('📋 Ejemplos de productos más vendidos:');
      formatted.slice(0, 5).forEach((p, idx) => {
        console.log(`  ${idx + 1}. "${p.name}" - ${p.category}`);
      });
    }

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('❌ Error en API de más vendidos:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos más vendidos' },
      { status: 500 }
    );
  }
}
