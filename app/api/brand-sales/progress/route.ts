// app/api/brand-sales/progress/route.ts
// 🎖️ API para obtener progreso de Brand Ambassadors del usuario

import { NextRequest, NextResponse } from 'next/server';
import { getUserBrandProgress } from '@/lib/brand-tracking';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    const progress = await getUserBrandProgress(userId);
    return NextResponse.json(progress);

  } catch (error) {
    console.error('Error obteniendo progreso de marcas:', error);
    return NextResponse.json(
      { error: 'Error al obtener progreso' },
      { status: 500 }
    );
  }
}
