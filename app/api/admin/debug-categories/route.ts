// 🔍 DIAGNÓSTICO DE CATEGORÍAS
// Guarda esto como: app/api/admin/debug-categories/route.ts

import { NextResponse } from 'next/server';
import { getAllProducts, getCategories } from '@/lib/tiendanube';

export async function GET(request: Request) {
  try {
    console.log('\n🔍 DIAGNÓSTICO DE CATEGORÍAS\n');
    
    // Obtener todos los productos
    const products = await getAllProducts({
      onlyPublished: true,
      maxPages: 1 // Solo primera página para diagnóstico rápido
    });
    
    // Obtener todas las categorías
    const allCategories = await getCategories();
    
    // Crear mapa de categorías para búsqueda rápida
    const categoriesMap = new Map();
    allCategories.forEach((cat: any) => {
      categoriesMap.set(cat.id, {
        id: cat.id,
        name: cat.name?.es || cat.name,
        parent: cat.parent && cat.parent > 0 ? cat.parent : null,
        subcategories: cat.subcategories || []
      });
    });
    
    // Buscar productos de ropa interior de mujer
    const ropaInteriorKeywords = ['bombacha', 'body', 'corpiño', 'conjunto', 'babucha', 'boxer'];
    
    const ejemplosRopaInterior = products
      .filter((p: any) => {
        const name = (p.name?.es || p.name || '').toLowerCase();
        return ropaInteriorKeywords.some(keyword => name.includes(keyword));
      })
      .slice(0, 5); // Primeros 5 ejemplos
    
    // Analizar cada producto
    const analisis = ejemplosRopaInterior.map((product: any) => {
      const productName = product.name?.es || product.name || 'Sin nombre';
      
      console.log(`\n📦 PRODUCTO: "${productName}" (ID: ${product.id})`);
      console.log('Categories field:', JSON.stringify(product.categories, null, 2));
      
      if (!product.categories || product.categories.length === 0) {
        return {
          id: product.id,
          name: productName,
          problema: 'No tiene categorías asignadas',
          categories: []
        };
      }
      
      // Analizar cada categoría del producto
      const categoriasDelProducto = product.categories.map((cat: any) => {
        // Construir path completo
        const path = [];
        let currentId = cat.id;
        let depth = 0;
        const visited = new Set();
        
        while (currentId && depth < 10 && !visited.has(currentId)) {
          visited.add(currentId);
          const categoryData = categoriesMap.get(currentId);
          
          if (!categoryData) break;
          
          path.unshift(categoryData.name);
          currentId = categoryData.parent;
          depth++;
        }
        
        return {
          id: cat.id,
          name: cat.name?.es || cat.name,
          parent: cat.parent,
          depth: depth,
          fullPath: path.join(' > ')
        };
      });
      
      // Ordenar por profundidad (mayor primero)
      categoriasDelProducto.sort((a, b) => b.depth - a.depth);
      
      console.log('Categorías analizadas:');
      categoriasDelProducto.forEach(c => {
        console.log(`  - ${c.fullPath} (depth: ${c.depth})`);
      });
      
      return {
        id: product.id,
        name: productName,
        totalCategorias: product.categories.length,
        categorias: categoriasDelProducto,
        categoriaSeleccionada: categoriasDelProducto[0]?.fullPath || 'Sin categoría'
      };
    });
    
    // Mostrar resumen
    console.log('\n📊 RESUMEN:');
    analisis.forEach(a => {
      console.log(`\n"${a.name}"`);
      console.log(`  Total categorías: ${a.totalCategorias}`);
      console.log(`  Categoría seleccionada: ${a.categoriaSeleccionada}`);
    });
    
    return NextResponse.json({
      success: true,
      totalProductosAnalizados: ejemplosRopaInterior.length,
      analisis,
      // También enviar estructura completa de categorías para referencia
      categorias: {
        total: allCategories.length,
        ejemplos: Array.from(categoriesMap.values())
          .filter(c => {
            const name = c.name.toLowerCase();
            return name.includes('ropa') || name.includes('mujer');
          })
          .map(c => ({
            id: c.id,
            name: c.name,
            parent: c.parent,
            parentName: c.parent ? categoriesMap.get(c.parent)?.name : null
          }))
      }
    });
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 });
  }
}

// 📝 CÓMO USAR:
// 1. Guarda este archivo como: app/api/admin/debug-categories/route.ts
// 2. Ejecuta: npm run dev
// 3. Visita: http://localhost:3000/api/admin/debug-categories
// 4. Verás en la terminal y en JSON todos los detalles de las categorías
