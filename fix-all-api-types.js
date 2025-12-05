const fs = require('fs');
const path = require('path');

// Buscar todos los archivos route.ts en app/api/
function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.ts') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Corregir archivo agregando tipado
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Patrón 1: await req.json() sin tipado
  if (content.includes('await req.json()') && !content.includes('await req.json() as')) {
    content = content.replace(/await req\.json\(\)/g, 'await req.json() as any');
    modified = true;
    console.log(`✅ Corregido: ${filePath} (req.json)`);
  }
  
  // Patrón 2: await request.json() sin tipado
  if (content.includes('await request.json()') && !content.includes('await request.json() as')) {
    content = content.replace(/await request\.json\(\)/g, 'await request.json() as any');
    modified = true;
    console.log(`✅ Corregido: ${filePath} (request.json)`);
  }
  
  // Patrón 3: const body = await req.json() 
  const bodyPattern = /const\s+(\w+)\s*=\s*await\s+req\.json\(\);/g;
  if (bodyPattern.test(content) && !content.includes('as any')) {
    content = content.replace(
      /const\s+(\w+)\s*=\s*await\s+req\.json\(\);/g,
      'const $1 = await req.json() as any;'
    );
    modified = true;
    console.log(`✅ Corregido: ${filePath} (const body)`);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Main
const apiDir = path.join(process.cwd(), 'app', 'api');

if (!fs.existsSync(apiDir)) {
  console.error('❌ No se encontró la carpeta app/api');
  process.exit(1);
}

console.log('🔍 Buscando archivos route.ts en app/api/...\n');

const routeFiles = findRouteFiles(apiDir);
console.log(`📁 Encontrados ${routeFiles.length} archivos\n`);

let fixedCount = 0;

routeFiles.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✨ Completado: ${fixedCount} archivos corregidos de ${routeFiles.length} totales`);
console.log('\n📝 Próximos pasos:');
console.log('   git add app/api/');
console.log('   git commit -m "Fix: Agregar tipado a todos los archivos API"');
console.log('   git push');
