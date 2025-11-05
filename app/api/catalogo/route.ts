import { NextRequest, NextResponse } from 'next/server';
import { getCachedProducts, forceSyncCatalog, getCacheStats } from '@/lib/catalog-sync';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Verificar si es una petición de sincronización forzada
    if (searchParams.get('sync') === 'true') {
      console.log('🔄 Sincronización manual solicitada...');
      await forceSyncCatalog();
      const stats = await getCacheStats();
      return NextResponse.json({ 
        message: 'Sincronización completada',
        stats
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

    console.log('📦 Filtros recibidos:', { brand, category, subcategory, productType, search });

    // Obtener productos del cache
    const allProducts = await getCachedProducts({
      brand,
      search
    });

    console.log(`📊 Productos obtenidos del cache: ${allProducts.length}`);

    // Filtrar por categorías jerárquicas
    let filteredProducts = allProducts;

    if (category || subcategory || productType) {
      filteredProducts = allProducts.filter((p: any) => {
        if (!p.category) return false;

        const categoryParts = p.category.split(' > ').map((part: string) => part.trim());

        // Filtro por categoría principal (nivel 1)
        if (category) {
          const matchesCategory = categoryParts[0] === category || 
                                 categoryParts[0]?.includes(category) ||
                                 category.includes(categoryParts[0]);
          
          if (!matchesCategory) return false;
        }

        // Filtro por subcategoría (nivel 2)
        if (subcategory) {
          if (!categoryParts[1]) return false;
          
          const matchesSubcategory = categoryParts[1] === subcategory ||
                                    categoryParts[1]?.includes(subcategory) ||
                                    subcategory.includes(categoryParts[1]);
          
          if (!matchesSubcategory) return false;
        }

        // Filtro por tipo de producto (nivel 3)
        if (productType) {
          if (!categoryParts[2]) return false;
          
          const matchesType = categoryParts[2] === productType ||
                             categoryParts[2]?.includes(productType) ||
                             productType.includes(categoryParts[2]);
          
          if (!matchesType) return false;
        }

        return true;
      });
    }

    console.log(`✅ Productos filtrados: ${filteredProducts.length}`);

    return NextResponse.json(filteredProducts);
  } catch (error) {
    console.error('❌ Error en API de catálogo:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener productos', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Endpoint para forzar sincronización
export async function POST(req: NextRequest) {
  try {
    console.log('🔄 POST: Sincronización forzada solicitada');
    await forceSyncCatalog();
    const stats = await getCacheStats();
    
    return NextResponse.json({
      success: true,
      message: 'Catálogo sincronizado correctamente',
      stats
    });
  } catch (error) {
    console.error('❌ Error sincronizando catálogo:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar catálogo' },
      { status: 500 }
    );
  }
}
