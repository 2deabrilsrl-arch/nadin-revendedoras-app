import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    console.log('🔥 Obteniendo productos más vendidos desde el cache...');

    // Obtener productos del cache ordenados por ventas
    const cached = await prisma.catalogoCache.findMany({
      orderBy: [
        { salesCount: 'desc' }, // Más vendidos primero
        { updatedAt: 'desc' }
      ],
      take: 200 // Traer suficientes para filtrado
    });

    // Parsear los productos
    const products = cached.map(item => JSON.parse(item.data));

    console.log(`✅ ${products.length} productos más vendidos obtenidos del cache`);

    // Mostrar algunos ejemplos de categorías para debug
    if (products.length > 0) {
      console.log('📋 Ejemplos de categorías en best-sellers:');
      products.slice(0, 5).forEach(p => {
        console.log(`  - "${p.name}": "${p.category}"`);
      });
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('❌ Error en API de más vendidos:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos más vendidos' },
      { status: 500 }
    );
  }
}
