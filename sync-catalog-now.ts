// sync-catalog-now.ts
// Script para sincronizar el catálogo manualmente
// Ejecutar: npm run sync-catalog

const path = require('path');

// Cargar .env.local explícitamente
console.log('📁 Cargando variables de entorno desde .env.local...');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Verificar las variables críticas
const requiredVars = {
  'TN_STORE_ID': process.env.TN_STORE_ID,
  'TN_ACCESS_TOKEN': process.env.TN_ACCESS_TOKEN,
  'TN_API_BASE': process.env.TN_API_BASE,
  'DATABASE_URL': process.env.DATABASE_URL
};

console.log('\n🔧 Variables de entorno cargadas:');
for (const [key, value] of Object.entries(requiredVars)) {
  const status = value ? '✅' : '❌';
  let display = 'NO DEFINIDA';
  if (value) {
    if (key.includes('TOKEN') || key.includes('URL')) {
      display = `${value.substring(0, 30)}...`;
    } else {
      display = value;
    }
  }
  console.log(`  ${status} ${key}: ${display}`);
}

// Si faltan variables críticas, salir
const missingVars = Object.entries(requiredVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('\n❌ FALTAN VARIABLES DE ENTORNO:');
  console.error('Variables faltantes:', missingVars.join(', '));
  console.error('\n💡 Verificá que el archivo .env.local existe y tiene todas las variables.');
  process.exit(1);
}

// Si todo está OK, ejecutar sincronización
const { syncCatalogWithFullCategories } = require('./lib/catalog-sync');

async function main() {
  console.log('\n🔄 Iniciando sincronización del catálogo...');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🏪 Store ID:', process.env.TN_STORE_ID);
  
  try {
    const result = await syncCatalogWithFullCategories();
    
    console.log('\n✅ ¡SINCRONIZACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('📦 Productos sincronizados:', result.count);
    console.log('⏰ Finalizado:', new Date().toISOString());
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR EN SINCRONIZACIÓN:', error);
    console.error('Detalles:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    
    process.exit(1);
  }
}

main();
