// 🔄 FORZAR SINCRONIZACIÓN COMPLETA
// Guarda esto como: app/api/admin/force-sync/route.ts

import { NextResponse } from 'next/server';
import { syncCatalogWithFullCategories } from '@/lib/catalog-sync';

export async function POST(request: Request) {
  try {
    console.log('\n');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  🔄 SINCRONIZACIÓN FORZADA INICIADA       ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('\n');
    
    const startTime = Date.now();
    
    // Ejecutar sincronización completa
    const result = await syncCatalogWithFullCategories();
    
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const durationSeconds = (durationMs / 1000).toFixed(2);
    
    console.log('\n');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  ✅ SINCRONIZACIÓN COMPLETADA             ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('\n');
    console.log('📊 RESUMEN:');
    console.log(`   Productos sincronizados: ${result.count}`);
    console.log(`   Duración: ${durationSeconds}s`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log('\n');
    
    return NextResponse.json({
      success: true,
      count: result.count,
      duration: {
        ms: durationMs,
        seconds: parseFloat(durationSeconds)
      },
      timestamp: new Date().toISOString(),
      message: `✅ ${result.count} productos sincronizados exitosamente en ${durationSeconds}s`
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
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// También permitir GET para poder ejecutar desde el navegador
export async function GET(request: Request) {
  return POST(request);
}

// 📝 CÓMO USAR:
// 1. Guarda este archivo como: app/api/admin/force-sync/route.ts
// 2. Ejecuta: npm run dev
// 3. OPCIÓN A - Desde el navegador:
//    Visita: http://localhost:3000/api/admin/force-sync
// 4. OPCIÓN B - Desde Postman/curl:
//    POST http://localhost:3000/api/admin/force-sync

// 🎯 QUÉ HACE:
// 1. Trae TODOS los productos de Tiendanube (con la nueva función optimizada)
// 2. Construye la jerarquía completa de categorías
// 3. Formatea productos con todas las imágenes y variantes
// 4. Limpia el cache anterior
// 5. Guarda los nuevos productos en catalogoCache

// ⚡ RESULTADO ESPERADO:
// {
//   "success": true,
//   "count": 1734,
//   "duration": {
//     "seconds": 12.5
//   },
//   "message": "✅ 1734 productos sincronizados exitosamente en 12.5s"
// }
