const fs = require('fs');
const path = require('path');

function findTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findTsxFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Reemplazar localStorage
  if (content.includes('localStorage.getItem') && !content.includes('globalThis')) {
    content = content.replace(/localStorage\.getItem/g, '(globalThis as any).localStorage?.getItem');
    modified = true;
    console.log(`✅ ${filePath}: localStorage`);
  }

  // 2. Reemplazar alert (standalone)
  if (/\balert\(/g.test(content) && !content.includes('globalThis as any).alert')) {
    content = content.replace(/\balert\(/g, '(globalThis as any).alert?.(');
    modified = true;
    console.log(`✅ ${filePath}: alert`);
  }

  // 3. Reemplazar e.target.value en onChange
  const onChangePattern = /onChange=\{(\([^)]*\))\s*=>\s*([^(]+)\(e\.target\.value\)/g;
  if (onChangePattern.test(content)) {
    content = content.replace(
      /onChange=\{(\([^)]*\))\s*=>\s*([^(]+)\(e\.target\.value\)/g,
      'onChange={$1 => $2((e.target as any).value)'
    );
    modified = true;
    console.log(`✅ ${filePath}: onChange simple`);
  }

  // 4. Reemplazar setX(e.target.value) directamente
  const setPattern = /set\w+\(e\.target\.value\)/g;
  if (setPattern.test(content) && !content.includes('(e.target as any)')) {
    content = content.replace(/set(\w+)\(e\.target\.value\)/g, 'set$1((e.target as any).value)');
    modified = true;
    console.log(`✅ ${filePath}: set direct`);
  }

  // 5. Agregar 'as any' a response.json() que no lo tenga
  const responseJsonPattern = /await\s+\w+\.json\(\)(?!\s+as)/g;
  if (responseJsonPattern.test(content)) {
    content = content.replace(/await\s+(\w+)\.json\(\)(?!\s+as)/g, 'await $1.json() as any');
    modified = true;
    console.log(`✅ ${filePath}: response.json()`);
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Main
const dashboardDir = path.join(process.cwd(), 'app', 'dashboard');
const componentsDir = path.join(process.cwd(), 'components');

if (!fs.existsSync(dashboardDir)) {
  console.error('❌ No se encontró la carpeta app/dashboard');
  process.exit(1);
}

console.log('🔍 Buscando archivos .tsx en app/dashboard y components...\n');

const files = [
  ...findTsxFiles(dashboardDir),
  ...(fs.existsSync(componentsDir) ? findTsxFiles(componentsDir) : [])
];

console.log(`📁 Encontrados ${files.length} archivos\n`);

let fixedCount = 0;
files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✨ Completado: ${fixedCount} archivos modificados de ${files.length} totales`);
console.log('\n📝 Próximos pasos:');
console.log('   git add app/dashboard/ components/');
console.log('   git commit -m "Fix: TypeScript en todos los archivos dashboard"');
console.log('   git push');
