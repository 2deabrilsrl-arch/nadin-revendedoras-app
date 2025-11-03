import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/tiendanube';

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}
