import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Ver productos con "ROPA" en la categoría
    const conRopa = await prisma.catalogoCache.findMany({
      where: {
        category: {
          contains: 'ROPA'
        }
      },
      select: {
        productId: true,
        category: true
      },
      take: 20
    });

    // 2. Ver productos con categoría EXACTA "MUJER > ROPA"
    const exactaRopa = await prisma.catalogoCache.findMany({
      where: {
        category: 'MUJER > ROPA'
      },
      select: {
        productId: true,
        category: true
      },
      take: 10
    });

    // 3. Ver productos con categoría EXACTA "MUJER > ROPA INTERIOR MUJER"
    const exactaRopaInterior = await prisma.catalogoCache.findMany({
      where: {
        category: 'MUJER > ROPA INTERIOR MUJER'
      },
      select: {
        productId: true,
        category: true
      },
      take: 10
    });

    // 4. Buscar un producto BOMBACHA específico
    const bombacha = await prisma.catalogoCache.findFirst({
      where: {
        category: {
          contains: 'BOMBACHA'
        }
      },
      select: {
        productId: true,
        category: true,
        data: true
      }
    });

    let bombachaData = null;
    if (bombacha) {
      bombachaData = JSON.parse(bombacha.data);
    }

    return NextResponse.json({
      problema: "Productos con ROPA vs ROPA INTERIOR",
      
      test1_contains_ROPA: {
        descripcion: "Productos que CONTIENEN 'ROPA' (includes)",
        total: conRopa.length,
        ejemplos: conRopa.map(p => ({
          id: p.productId,
          categoria: p.category
        }))
      },

      test2_exacta_ROPA: {
        descripcion: "Productos con categoría EXACTA 'MUJER > ROPA'",
        total: exactaRopa.length,
        ejemplos: exactaRopa.map(p => ({
          id: p.productId,
          categoria: p.category
        }))
      },

      test3_exacta_ROPA_INTERIOR: {
        descripcion: "Productos con categoría EXACTA 'MUJER > ROPA INTERIOR MUJER'",
        total: exactaRopaInterior.length,
        ejemplos: exactaRopaInterior.map(p => ({
          id: p.productId,
          categoria: p.category
        }))
      },

      test4_ejemplo_BOMBACHA: {
        descripcion: "Ejemplo de producto BOMBACHA",
        encontrado: !!bombacha,
        categoria: bombacha?.category || 'No encontrado',
        nombre: bombachaData?.name || 'N/A'
      },

      diagnostico: {
        problema_detectado: conRopa.length > (exactaRopa.length + exactaRopaInterior.length),
        explicacion: "Si contains_ROPA es mayor que la suma de exacta_ROPA + exacta_ROPA_INTERIOR, las categorías están MAL en la base de datos"
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error'
    }, { status: 500 });
  }
}