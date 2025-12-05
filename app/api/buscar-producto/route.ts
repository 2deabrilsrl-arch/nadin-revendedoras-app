// 🔍 BUSCAR PRODUCTO ESPECÍFICO Y VER SUS CATEGORÍAS
// Guarda esto como: app/api/buscar-producto/route.ts

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface Product {
  id: number;
  name: any;
  categories: any[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get('q') || 'bombacha';
    
    const TN_STORE_ID = process.env.TN_STORE_ID;
    const TN_ACCESS_TOKEN = process.env.TN_ACCESS_TOKEN;
    const TN_USER_AGENT = process.env.TN_USER_AGENT;

    if (!TN_STORE_ID || !TN_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Variables de entorno faltantes' },
        { status: 500 }
      );
    }

    console.log(`\n🔍 Buscando productos con: "${busqueda}"\n`);

    // Buscar productos
    const url = `https://api.tiendanube.com/v1/${TN_STORE_ID}/products?q=${encodeURIComponent(busqueda)}&per_page=10`;
    
    const response = await fetch(url, {
      headers: {
        'Authentication': `bearer ${TN_ACCESS_TOKEN}`,
        'User-Agent': TN_USER_AGENT || 'Nadin App',
      },
    });

    if (!response.ok) {
      throw new Error(`TN API error: ${response.status}`);
    }

    const products = await response.json() as Product[];
    console.log(`✅ ${products.length} productos encontrados`);

    // Obtener TODAS las categorías para hacer el mapeo
    let allCategories: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 5) {
      const catUrl = `https://api.tiendanube.com/v1/${TN_STORE_ID}/categories?page=${page}&per_page=200`;
      const catResponse = await fetch(catUrl, {
        headers: {
          'Authentication': `bearer ${TN_ACCESS_TOKEN}`,
          'User-Agent': TN_USER_AGENT || 'Nadin App',
        },
      });
      
      const data = await catResponse.json() as any[];
      allCategories = [...allCategories, ...data];
      
      if (data.length < 200) hasMore = false;
      else page++;
    }

    console.log(`✅ ${allCategories.length} categorías totales obtenidas`);

    // Crear mapa de categorías
    const catMap = new Map();
    allCategories.forEach(cat => {
      catMap.set(cat.id, {
        id: cat.id,
        name: cat.name?.es || cat.name,
        parent: cat.parent && cat.parent > 0 ? cat.parent : null
      });
    });

    // Función para construir path
    const buildPath = (catId: number): string => {
      const path = [];
      let currentId: number | null = catId;
      let depth = 0;
      const visited = new Set();

      while (currentId && depth < 10 && !visited.has(currentId)) {
        visited.add(currentId);
        const cat = catMap.get(currentId);
        if (!cat) break;
        
        path.unshift(cat.name);
        currentId = cat.parent;
        depth++;
      }

      return path.join(' > ');
    };

    // Analizar cada producto
    const analisis = products.map((product: any) => {
      console.log(`\n📦 PRODUCTO: "${product.name?.es || product.name}" (ID: ${product.id})`);
      console.log('Categories field RAW:', JSON.stringify(product.categories, null, 2));

      if (!product.categories || product.categories.length === 0) {
        return {
          id: product.id,
          name: product.name?.es || product.name,
          problema: '❌ No tiene categorías asignadas',
          categories: []
        };
      }

      // Analizar cada categoría
      const categoriasAnalisis = product.categories.map((cat: any) => {
        const fullPath = buildPath(cat.id);
        
        // Calcular profundidad real
        let depth = 0;
        let currentId: number | null = cat.id;
        const visited = new Set();
        
        while (currentId && depth < 10 && !visited.has(currentId)) {
          visited.add(currentId);
          const catData = catMap.get(currentId);
          if (!catData) break;
          currentId = catData.parent;
          depth++;
        }

        return {
          id: cat.id,
          name: cat.name?.es || cat.name,
          parent: cat.parent,
          depth: depth,
          fullPath: fullPath
        };
      });

      // Ordenar por profundidad (mayor primero = más específica)
      categoriasAnalisis.sort((a, b) => b.depth - a.depth);

      console.log('Categorías del producto (ordenadas por profundidad):');
      categoriasAnalisis.forEach(c => {
        console.log(`  [depth ${c.depth}] ${c.fullPath}`);
      });

      const categoriaSeleccionada = categoriasAnalisis[0]?.fullPath || 'Sin categoría';
      console.log(`✅ Categoría seleccionada: ${categoriaSeleccionada}`);

      return {
        id: product.id,
        name: product.name?.es || product.name,
        totalCategorias: product.categories.length,
        categorias: categoriasAnalisis,
        categoriaSeleccionada: categoriaSeleccionada,
        // Detectar si tiene conflicto ROPA vs ROPA INTERIOR
        tieneConflicto: categoriasAnalisis.some(c => c.fullPath.includes('ROPA >')) && 
                        categoriasAnalisis.some(c => c.fullPath.includes('ROPA INTERIOR'))
      };
    });

    // Detectar problemas
    const productosConConflicto = analisis.filter(a => a.tieneConflicto);
    const productosSinCategorias = analisis.filter(a => a.categories.length === 0);

    return NextResponse.json({
      busqueda: busqueda,
      totalProductos: products.length,
      analisis: analisis,
      diagnostico: {
        productosConConflicto: productosConConflicto.length,
        productosSinCategorias: productosSinCategorias.length,
        problema: productosConConflicto.length > 0 
          ? `⚠️ ${productosConConflicto.length} productos tienen conflicto ROPA vs ROPA INTERIOR`
          : '✅ No hay conflictos detectados'
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

// 🔍 CÓMO USAR:
// http://localhost:3000/api/buscar-producto?q=bombacha
// http://localhost:3000/api/buscar-producto?q=body
// http://localhost:3000/api/buscar-producto?q=corpiño
