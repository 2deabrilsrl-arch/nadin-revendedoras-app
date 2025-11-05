import { NextRequest, NextResponse } from 'next/server';
import { getBestSellingProducts, formatProductsForFrontend } from '@/lib/tiendanube';

export async function GET(req: NextRequest) {
  try {
    console.log('🔥 Obteniendo TODOS los productos más vendidos de Tiendanube...');

    // IMPORTANTE: Traer TODOS los productos (sin límite) ordenados por ventas
    // El frontend se encargará de mostrar solo el TOP 10
    // Pero necesitamos todos para que los filtros funcionen correctamente
    const products = await getBestSellingProducts(200); // Traer 200 (más que suficiente)
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
