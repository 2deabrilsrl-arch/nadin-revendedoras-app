import { NextRequest, NextResponse } from 'next/server';
import { getBestSellingProducts, formatProductsForFrontend } from '@/lib/tiendanube';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // Por defecto traer solo TOP 10, no 50 ni 100
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log(`🔥 Obteniendo TOP ${limit} productos más vendidos de Tiendanube...`);

    // Obtener los productos más vendidos de Tiendanube
    const products = await getBestSellingProducts(limit);
    const formatted = formatProductsForFrontend(products);

    console.log(`✅ ${formatted.length} productos más vendidos formateados`);

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('❌ Error en API de más vendidos:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos más vendidos' },
      { status: 500 }
    );
  }
}
