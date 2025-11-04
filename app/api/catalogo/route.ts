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
    const brand = searchParams.get('brand') || undefined;
    const category = searchParams.get('category') || undefined;
    const subcategory = searchParams.get('subcategory') || undefined;
    const productType = searchParams.get('productType') || undefined;
    const search = searchParams.get('search') || undefined;

    // Obtener productos del cache
    const allProducts = await getCachedProducts({
      brand,
      search
    });

    // Filtrar por categorías jerárquicas
    let filteredProducts = allProducts;

    if (category || subcategory || productType) {
      filteredProducts = allProducts.filter((p: any) => {
        if (!p.category) return false;

        const categoryParts = p.category.split(' > ').map((part: string) => part.trim());

        // Filtro por categoría principal (nivel 1)
        if (category && !categoryParts[0]?.includes(category)) {
          return false;
        }

        // Filtro por subcategoría (nivel 2)
        if (subcategory && !categoryParts[1]?.includes(subcategory)) {
          return false;
        }

        // Filtro por tipo de producto (nivel 3)
        if (productType && !categoryParts[2]?.includes(productType)) {
          return false;
        }

        return true;
      });
    }

    return NextResponse.json(filteredProducts);
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
