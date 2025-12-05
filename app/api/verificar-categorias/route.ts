import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const TN_STORE_ID = process.env.TN_STORE_ID;
    const TN_ACCESS_TOKEN = process.env.TN_ACCESS_TOKEN;
    const TN_USER_AGENT = process.env.TN_USER_AGENT;

    if (!TN_STORE_ID || !TN_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Variables de entorno faltantes' },
        { status: 500 }
      );
    }

    console.log('🔍 Consultando categorías con parent...');

    // Consultar TODAS las categorías con paginación
    let allCategories: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const url = `https://api.tiendanube.com/v1/${TN_STORE_ID}/categories?page=${page}&per_page=200&fields=id,name,parent`;
      
      console.log(`🔥 Página ${page}: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authentication': `bearer ${TN_ACCESS_TOKEN}`,
          'User-Agent': TN_USER_AGENT || 'Nadin App',
        },
      });

      if (!response.ok) {
        throw new Error(`TN API error: ${response.status}`);
      }

      const data = await response.json() as any[];
      allCategories = [...allCategories, ...data];
      
      console.log(`✅ Página ${page}: ${data.length} categorías`);
      
      // Si trajo menos de 200, ya no hay más
      if (data.length < 200) {
        hasMore = false;
      } else {
        page++;
      }
    }

    console.log(`✅ Total categorías obtenidas: ${allCategories.length}`);

    // Analizar las categorías
    // En TN, parent=0 significa "sin parent" (categoría raíz)
    const conParent = allCategories.filter(c => c.parent && c.parent > 0);
    const sinParent = allCategories.filter(c => !c.parent || c.parent === 0);

    // Construir jerarquías de ejemplo
    const ejemplosJerarquia: string[] = [];
    
    for (const cat of conParent.slice(0, 5)) {
      let path = [cat.name.es || cat.name];
      let currentId = cat.parent;
      let depth = 0;
      
      // Construir jerarquía hacia arriba
      // En TN, parent=0 significa "sin parent"
      while (currentId && currentId > 0 && depth < 5) {
        const parentCat = allCategories.find(c => c.id === currentId);
        if (!parentCat) break;
        path.unshift(parentCat.name.es || parentCat.name);
        currentId = (parentCat.parent && parentCat.parent > 0) ? parentCat.parent : null;
        depth++;
      }
      
      ejemplosJerarquia.push(path.join(' > '));
    }

    const resultado = {
      resumen: {
        totalCategorias: allCategories.length,
        conParent: conParent.length,
        sinParent: sinParent.length,
        porcentajeConParent: ((conParent.length / allCategories.length) * 100).toFixed(1) + '%'
      },
      ejemplosConParent: conParent.slice(0, 5).map(c => {
        const parentCat = allCategories.find(p => p.id === c.parent);
        return {
          id: c.id,
          nombre: c.name.es || c.name,
          parentId: c.parent,
          parentNombre: parentCat ? (parentCat.name.es || parentCat.name) : 'desconocido'
        };
      }),
      ejemplosSinParent: sinParent.slice(0, 5).map(c => ({
        id: c.id,
        nombre: c.name.es || c.name,
        parentId: c.parent || null
      })),
      ejemplosJerarquiaCompleta: ejemplosJerarquia,
      diagnostico: conParent.length === 0 
        ? '❌ PROBLEMA: Ninguna categoría tiene parent configurado. Las categorías están todas en nivel raíz.'
        : conParent.length < allCategories.length * 0.5
        ? '⚠️ PARCIAL: Solo algunas categorías tienen parent. Puede que no todas las jerarquías estén configuradas.'
        : '✅ OK: La mayoría de las categorías tienen parent configurado. Las jerarquías existen.',
      solucion: conParent.length === 0
        ? 'Necesitas configurar el campo "parent" de las subcategorías en Tiendanube para establecer la jerarquía.'
        : 'Las categorías tienen jerarquía configurada. El código debería funcionar.'
    };

    console.log('\n📊 RESULTADO:');
    console.log(JSON.stringify(resultado, null, 2));

    return NextResponse.json(resultado);

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
