// API: Buscar Productos en CatalogoCache
// Ubicación: app/api/productos/buscar/route.ts
// VERSIÓN: DEFINITIVA FLEXIBLE - Maneja diferentes formatos de JSON

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    console.log('\n🔍 Búsqueda:', query);

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    // Buscar en CatalogoCache por brand o contenido del JSON
    const catalogos = await prisma.catalogoCache.findMany({
      where: {
        OR: [
          { brand: { contains: query, mode: 'insensitive' } },
          { data: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 20,
      orderBy: { salesCount: 'desc' }
    });

    console.log(`   ✅ ${catalogos.length} encontrados en cache`);

    // Procesar cada producto
    const productos = catalogos.map(cat => {
      try {
        const productData = JSON.parse(cat.data);
        
        // Obtener nombre (puede estar en diferentes formatos)
        const nombre = productData.name?.es || productData.name || productData.nombre || 'Sin nombre';
        
        // Obtener SKU
        const sku = productData.sku || productData.SKU || cat.productId.substring(0, 10);
        
        // Obtener precio base
        const precioBase = parseFloat(productData.price || productData.precio || 0);
        
        // Procesar variantes
        let variantes = [];
        
        if (productData.variants && Array.isArray(productData.variants)) {
          variantes = productData.variants
            .filter((v: any) => v.stock > 0) // Solo variantes con stock
            .map((variant: any) => {
              // Tiendanube tiene talle y color directamente en la variante
              const talle = variant.talle || variant.size || 'Único';
              const color = variant.color || variant.colour || 'Único';
              
              return {
                id: variant.id || variant.variant_id || cat.productId,
                sku: variant.sku || `${sku}-${talle}-${color}`,
                talle,
                color,
                stock: parseInt(variant.stock) || 0,
                precio: parseFloat(variant.price || precioBase)
              };
            });
        }
        
        // Si no hay variantes o todas tienen stock 0, crear una variante genérica
        if (variantes.length === 0) {
          const stockTotal = parseInt(productData.stock || 0);
          if (stockTotal > 0) {
            variantes.push({
              id: cat.productId,
              sku: sku,
              talle: 'Único',
              color: 'Único',
              stock: stockTotal,
              precio: precioBase
            });
          }
        }

        console.log(`   📦 ${nombre}: ${variantes.length} variantes con stock`);

        return {
          id: cat.productId,
          sku: sku,
          name: nombre,
          brand: cat.brand || productData.brand || '',
          precio: precioBase,
          variantes: variantes
        };
        
      } catch (parseError: any) {
        console.error(`   ⚠️  Error parseando ${cat.productId}:`, parseError.message);
        return null;
      }
    }).filter(p => p !== null && p.variantes.length > 0); // Solo productos con variantes con stock

    console.log(`   ✨ ${productos.length} productos procesados\n`);

    return NextResponse.json(productos);

  } catch (error: any) {
    console.error('\n❌ ERROR EN BÚSQUEDA:');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    console.error('\n');
    
    return NextResponse.json(
      { error: 'Error al buscar productos', details: error.message },
      { status: 500 }
    );
  }
}
