// ENDPOINT: VALIDAR STOCK
// Ubicacion: app/api/pedidos/validar-stock/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json() as any;
    const productos = (body as any).productos || [];

    console.log('Validando stock de', productos.length, 'productos...');

    const resultados = await Promise.all(
      productos.map(async (item: any) => {
        try {
          console.log('\n--- Validando producto ---');
          console.log('ProductID:', item.productId, '(tipo:', typeof item.productId, ')');
          console.log('VariantID:', item.variantId, '(tipo:', typeof item.variantId, ')');
          console.log('Nombre:', item.nombre);
          console.log('Cantidad pedida:', item.cantidad);
          
          // Buscar producto en cache (refleja TN en tiempo real)
          const productoCache = await prisma.catalogoCache.findUnique({
            where: { productId: item.productId.toString() }
          });

          if (!productoCache) {
            console.log('Producto NO encontrado en cache');
            return {
              ...item,
              disponible: false,
              stockActual: 0,
              mensaje: 'Producto no encontrado',
              cliente: item.cliente || '',
              telefono: item.telefono || ''
            };
          }

          console.log('Producto encontrado en cache');
          const producto = JSON.parse(productoCache.data);
          console.log('Variantes disponibles:', producto.variants?.length || 0);
          
          const variant = producto.variants.find((v: any) => {
            const match = v.id.toString() === item.variantId.toString();
            if (!match) {
              console.log('Comparando variante:', v.id, 'con', item.variantId, '-> NO match');
            }
            return match;
          });

          if (!variant) {
            console.log('Variante NO encontrada');
            console.log('Variantes en producto:', producto.variants?.map((v: any) => `ID:${v.id} (${v.talle}/${v.color})`));
            return {
              ...item,
              disponible: false,
              stockActual: 0,
              mensaje: 'Variante no encontrada',
              cliente: item.cliente || '',
              telefono: item.telefono || ''
            };
          }

          console.log('Variante encontrada - Stock:', variant.stock);

          const stockDisponible = variant.stock >= item.cantidad;

          return {
            productId: item.productId,
            variantId: item.variantId,
            nombre: item.nombre || producto.name,
            talle: item.talle || variant.talle,
            color: item.color || variant.color,
            cantidad: item.cantidad,
            stockActual: variant.stock,
            disponible: stockDisponible,
            mensaje: stockDisponible
              ? 'Stock disponible'
              : variant.stock === 0
              ? 'Sin stock'
              : `Solo hay ${variant.stock} unidades`,
            cliente: item.cliente || '',
            telefono: item.telefono || '',
            precio: variant.price
          };
        } catch (error) {
          console.error('Error validando producto:', item.productId, error);
          return {
            ...item,
            disponible: false,
            stockActual: 0,
            mensaje: 'Error al validar',
            cliente: item.cliente || '',
            telefono: item.telefono || ''
          };
        }
      })
    );

    const conStock = resultados.filter((r: any) => r.disponible);
    const sinStock = resultados.filter((r: any) => !r.disponible);

    console.log('Validacion completada:');
    console.log('   Con stock:', conStock.length);
    console.log('   Sin stock:', sinStock.length);

    return NextResponse.json({
      success: true,
      conStock,
      sinStock,
      todosDisponibles: sinStock.length === 0,
      resumen: {
        total: resultados.length,
        disponibles: conStock.length,
        noDisponibles: sinStock.length
      }
    });

  } catch (error) {
    console.error('Error en validar-stock:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
