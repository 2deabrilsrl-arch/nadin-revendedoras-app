import { NextRequest, NextResponse } from 'next/server';
import { getCachedProducts } from '@/lib/catalog-sync';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Obtener filtros aplicados
    const brand = searchParams.get('brand') || undefined;
    const category = searchParams.get('category') || undefined;
    const subcategory = searchParams.get('subcategory') || undefined;
    const productType = searchParams.get('productType') || undefined;

    console.log('🎯 [FILTROS API] Filtros recibidos:', { brand, category, subcategory, productType });

    // Construir categoría completa si existe
    let fullCategory: string | undefined = undefined;

    if (productType && subcategory && category) {
      fullCategory = `${category} > ${subcategory} > ${productType}`;
    } else if (subcategory && category) {
      fullCategory = `${category} > ${subcategory}`;
    } else if (category) {
      fullCategory = category;
    }

    console.log('🎯 [FILTROS API] Categoría construida:', fullCategory || 'TODAS');

    // Obtener productos filtrados (o todos si no hay filtros)
    const products = await getCachedProducts({
      brand,
      category: fullCategory
    });

    console.log(`📦 [FILTROS API] Productos obtenidos: ${products.length}`);

    if (products.length === 0) {
      console.log('⚠️ [FILTROS API] No hay productos, retornando arrays vacíos');
      return NextResponse.json({
        talles: [],
        colores: []
      });
    }

    // Extraer talles y colores únicos de las variantes con stock
    const tallesSet = new Set<string>();
    const coloresSet = new Set<string>();

    products.forEach((product: any) => {
      if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach((variant: any) => {
          // Solo incluir si tiene stock
          if (variant.stock > 0) {
            if (variant.talle && variant.talle.trim() !== '') {
              tallesSet.add(variant.talle.trim());
            }
            if (variant.color && variant.color.trim() !== '') {
              coloresSet.add(variant.color.trim());
            }
          }
        });
      }
    });

    // Convertir a arrays y ordenar
    const talles: string[] = Array.from(tallesSet)
      .filter((t): t is string => !!t)
      .sort((a, b) => {
        // Intentar ordenar numéricamente si son números
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        // Sino orden alfabético
        return a.localeCompare(b);
      });

    const colores: string[] = Array.from(coloresSet)
      .filter((c): c is string => !!c)
      .sort();

    console.log(`✅ [FILTROS API] Talles disponibles: ${talles.length}`, talles.slice(0, 10));
    console.log(`✅ [FILTROS API] Colores disponibles: ${colores.length}`, colores.slice(0, 10));

    return NextResponse.json({
      talles,
      colores
    });
  } catch (error) {
    console.error('❌ [FILTROS API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener filtros', 
        details: error instanceof Error ? error.message : 'Unknown error',
        talles: [],
        colores: []
      },
      { status: 500 }
    );
  }
}
