import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/tiendanube';

export async function GET() {
  try {
    const categories = await getCategories();
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error en API de categorías:', error);
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}
