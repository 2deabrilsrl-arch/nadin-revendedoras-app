import { NextRequest, NextResponse } from 'next/server';
import { getCachedProducts, forceSyncCatalog, getCacheStats } from '@/lib/catalog-sync';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Verificar si es una petición de sincronización forzada
    if (searchParams.get('sync') === 'true') {
      await forceSyncCatalog();
      return NextResponse.json({ 
        message: 'Sincronización completada',
        stats: await getCacheStats()
      });
    }

    // Verificar si es una petición de estadísticas
    if (searchParams.get('stats') === 'true') {
      const stats = await getCacheStats();
      return NextResponse.json(stats);
    }

    // Obtener filtros
    const filters = {
      brand: searchParams.get('brand') || undefined,
      category: searchParams.get('category') || undefined,
      sex: searchParams.get('sex') || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Obtener productos del cache (con actualización automática si es necesario)
    const products = await getCachedProducts(filters);

    return NextResponse.json({
      products,
      count: products.length,
      filters
    });
  } catch (error) {
    console.error('Error en API de catálogo:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Endpoint para forzar sincronización
export async function POST(req: NextRequest) {
  try {
    await forceSyncCatalog();
    const stats = await getCacheStats();
    
    return NextResponse.json({
      success: true,
      message: 'Catálogo sincronizado correctamente',
      stats
    });
  } catch (error) {
    console.error('Error sincronizando catálogo:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar catálogo' },
      { status: 500 }
    );
  }
}
