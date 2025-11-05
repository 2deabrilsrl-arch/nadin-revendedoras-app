import { NextRequest, NextResponse } from 'next/server';
import { getBestSellingProducts, formatProductsForFrontend } from '@/lib/tiendanube';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log(`🔥 Obteniendo ${limit} productos más vendidos...`);

    // Obtener los productos más vendidos de Tiendanube
    const products = await getBestSellingProducts(limit);
    
    if (!products || products.length === 0) {
      console.log('⚠️ No se obtuvieron productos de Tiendanube');
      return NextResponse.json([]);
    }

    const formatted = formatProductsForFrontend(products);
    
    console.log(`✅ ${formatted.length} productos más vendidos obtenidos`);

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('❌ Error en API de más vendidos:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos más vendidos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
