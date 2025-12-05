// 🔍 VERIFICACIÓN RÁPIDA - CHILL OUT
// Ejecutar: node check-chill-out.js
// (Renombrar a .js si da error con .ts)

require('dotenv').config({ path: '.env.local' });

const TN_STORE_ID = '6566743';
const TN_ACCESS_TOKEN = process.env.TN_ACCESS_TOKEN;
const TN_API_BASE = 'https://api.tiendanube.com/v1';

async function checkChillOut() {
  console.log('\n🔍 Verificando marca "Chill Out"...\n');

  try {
    // Buscar productos de Chill Out
    const url = `${TN_API_BASE}/${TN_STORE_ID}/products?brand=Chill Out&per_page=50`;
    
    console.log('🌐 Consultando:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authentication': `bearer ${TN_ACCESS_TOKEN}`,
        'User-Agent': 'Nadin App Check',
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    const products = await response.json();
    
    console.log(`\n📦 Productos encontrados: ${products.length}\n`);
    
    if (products.length === 0) {
      console.log('❌ NO SE ENCONTRARON PRODUCTOS DE "CHILL OUT"');
      console.log('\n💡 Posibles razones:');
      console.log('   1. La marca no existe en Tiendanube');
      console.log('   2. La marca se escribe diferente (ej: "ChillOut", "Chill-Out")');
      console.log('   3. No hay productos con esa marca\n');
      return;
    }

    // Analizar productos encontrados
    let publicados = 0;
    let noPublicados = 0;
    
    console.log('📋 LISTA DE PRODUCTOS CHILL OUT:\n');
    console.log('ID'.padEnd(10) + 'NOMBRE'.padEnd(40) + 'PUBLICADO');
    console.log('─'.repeat(70));
    
    products.forEach(p => {
      const nombre = (p.name?.es || p.name || 'Sin nombre').substring(0, 38);
      const pub = p.published ? '✅ Sí' : '❌ No';
      console.log(`${p.id.toString().padEnd(10)}${nombre.padEnd(40)}${pub}`);
      
      if (p.published) {
        publicados++;
      } else {
        noPublicados++;
      }
    });
    
    console.log('\n📊 RESUMEN:');
    console.log(`   Total: ${products.length}`);
    console.log(`   Publicados: ${publicados}`);
    console.log(`   No publicados: ${noPublicados}\n`);
    
    if (noPublicados > 0) {
      console.log('⚠️ HAY PRODUCTOS NO PUBLICADOS');
      console.log('   Estos NO aparecerán en la app');
      console.log('   Publicarlos en Tiendanube para que aparezcan\n');
    }
    
    if (publicados > 0) {
      console.log('✅ HAY PRODUCTOS PUBLICADOS');
      console.log('   Deberían aparecer en la app después de sincronizar\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\n💡 Verificá:');
    console.error('   1. Que TN_ACCESS_TOKEN esté en .env.local');
    console.error('   2. Que el token sea válido');
    console.error('   3. Tu conexión a internet\n');
  }
}

// Ejecutar
checkChillOut();
