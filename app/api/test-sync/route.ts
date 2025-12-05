// 🧪 ARCHIVO DE PRUEBA
// Guarda esto como: app/api/test-sync/route.ts

import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/tiendanube';

export async function GET() {
  try {
    console.log('\n');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  🧪 PRUEBA DE SINCRONIZACIÓN INICIADA     ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('\n');
    
    const startTime = Date.now();
    
    // ✅ Probar con solo publicados (default)
    console.log('📋 Configuración de prueba:');
    console.log('   - Solo publicados: true');
    console.log('   - Máximo de páginas: 100');
    console.log('   - Timeout de Vercel: 5 minutos\n');
    
    const products = await getAllProducts({
      onlyPublished: true,
      maxPages: 100  // Máximo 100 páginas = 20,000 productos
    });
    
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const durationSeconds = (durationMs / 1000).toFixed(2);
    const durationMinutes = (durationMs / 60000).toFixed(2);
    
    // Análisis de los productos
    const publishedCount = products.filter(p => p.published).length;
    const notPublishedCount = products.filter(p => !p.published).length;
    const withImages = products.filter(p => p.images && p.images.length > 0).length;
    const withVariants = products.filter(p => p.variants && p.variants.length > 0).length;
    
    // Ejemplos de productos
    const ejemplos = products.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name?.es || 'Sin nombre',
      published: p.published,
      variantsCount: p.variants?.length || 0,
      imagesCount: p.images?.length || 0
    }));
    
    console.log('\n');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  ✅ SINCRONIZACIÓN EXITOSA                ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('\n');
    console.log('📊 RESUMEN:');
    console.log(`   Total de productos: ${products.length}`);
    console.log(`   Publicados: ${publishedCount}`);
    console.log(`   No publicados: ${notPublishedCount}`);
    console.log(`   Con imágenes: ${withImages}`);
    console.log(`   Con variantes: ${withVariants}`);
    console.log('\n');
    console.log('⏱️  TIEMPO:');
    console.log(`   Duración: ${durationSeconds}s (${durationMinutes} minutos)`);
    console.log(`   Promedio: ${(durationMs / products.length).toFixed(0)}ms por producto`);
    console.log('\n');
    console.log('🔍 EJEMPLOS (primeros 5 productos):');
    ejemplos.forEach((p, i) => {
      console.log(`   ${i + 1}. ID ${p.id}: "${p.name}"`);
      console.log(`      Published: ${p.published}, Variants: ${p.variantsCount}, Images: ${p.imagesCount}`);
    });
    console.log('\n');
    
    return NextResponse.json({
      success: true,
      sync: {
        totalProducts: products.length,
        published: publishedCount,
        notPublished: notPublishedCount,
        withImages,
        withVariants
      },
      performance: {
        durationMs,
        durationSeconds: parseFloat(durationSeconds),
        durationMinutes: parseFloat(durationMinutes),
        avgMsPerProduct: Math.round(durationMs / products.length)
      },
      examples: ejemplos,
      message: `✅ Sincronización exitosa: ${products.length} productos en ${durationSeconds}s`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('\n');
    console.error('╔════════════════════════════════════════════╗');
    console.error('║  ❌ ERROR EN SINCRONIZACIÓN               ║');
    console.error('╚════════════════════════════════════════════╝');
    console.error('\n');
    console.error('Error details:', error);
    console.error('\n');
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// 📝 CÓMO USAR:
// 1. Guarda este archivo como: app/api/test-sync/route.ts
// 2. Ejecuta: npm run dev
// 3. Visita: http://localhost:3000/api/test-sync
// 4. Verás los logs en la terminal y el JSON en el navegador

// 🎯 RESULTADO ESPERADO:
// {
//   "success": true,
//   "sync": {
//     "totalProducts": 1734,
//     "published": 1720,
//     "notPublished": 14,
//     ...
//   },
//   "performance": {
//     "durationSeconds": 8.5,
//     ...
//   }
// }
