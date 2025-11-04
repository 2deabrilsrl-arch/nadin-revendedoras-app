import { NextRequest, NextResponse } from 'next/server';
import { getBestSellingProducts, formatProductsForFrontend } from '@/lib/tiendanube';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Obtener los productos más vendidos de Tiendanube
    const products = await getBestSellingProducts(limit);
    const formatted = formatProductsForFrontend(products);

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error en API de más vendidos:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos más vendidos' },
      { status: 500 }
    );
  }
}
