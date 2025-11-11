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
    const talle = searchParams.get('talle') || undefined;
    const color = searchParams.get('color') || undefined;

    console.log('📦 Filtros recibidos:', { brand, category, subcategory, productType, search, talle, color });

    // ✅ CONSTRUIR CATEGORÍA COMPLETA
    let fullCategory: string | undefined = undefined;

    if (productType && subcategory && category) {
      // Nivel 3: Categoría completa
      fullCategory = `${category} > ${subcategory} > ${productType}`;
    } else if (subcategory && category) {
      // Nivel 2: Categoría + Subcategoría
      fullCategory = `${category} > ${subcategory}`;
    } else if (category) {
      // Nivel 1: Solo categoría
      fullCategory = category;
    }

    console.log('🎯 Categoría construida:', fullCategory);

    // ✅ USAR EL FILTRO CORRECTO DE getCachedProducts
    let products = await getCachedProducts({
      brand,
      category: fullCategory,
      search
    });

    console.log(`📦 Productos antes de filtrar por talle/color: ${products.length}`);

    // ✅ FILTRAR POR TALLE Y COLOR (EN VARIANTES)
    if (talle || color) {
      products = products.filter((product: any) => {
        if (!product.variants || !Array.isArray(product.variants)) {
          return false;
        }

        // El producto debe tener al menos 1 variante que cumpla con los filtros
        return product.variants.some((variant: any) => {
          // Debe tener stock
          if (variant.stock <= 0) return false;

          // Si hay filtro de talle, debe coincidir
          if (talle && variant.talle !== talle) return false;

          // Si hay filtro de color, debe coincidir
          if (color && variant.color !== color) return false;

          return true;
        });
      });

      console.log(`📦 Productos después de filtrar por talle/color: ${products.length}`);
    }

    console.log(`✅ Productos finales: ${products.length}`);

    return NextResponse.json(products);
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
