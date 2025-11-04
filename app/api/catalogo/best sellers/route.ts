import { NextResponse } from 'next/server';
import { getBestSellingProducts, formatProductsForFrontend } from '@/lib/tiendanube';

export async function GET() {
  try {
    // Obtener los 50 productos más vendidos de Tiendanube
    const products = await getBestSellingProducts(50);
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
