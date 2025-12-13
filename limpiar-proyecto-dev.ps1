# ============================================
#   SCRIPT DE LIMPIEZA - NADIN APP DEV
# ============================================
# Ejecutar desde: C:\Users\Nadin Lenceria\OneDrive\Documents\GitHub\nadin-revendedoras-app-dev
# Comando: powershell -ExecutionPolicy Bypass -File limpiar-proyecto-dev.ps1

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🧹 LIMPIEZA AUTOMÁTICA - NADIN REVENDEDORAS DEV" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$currentPath = Get-Location
if ($currentPath.Path -notlike "*nadin-revendedoras-app-dev*") {
    Write-Host "❌ ERROR: Debe ejecutarse desde la carpeta nadin-revendedoras-app-dev" -ForegroundColor Red
    Write-Host "   Directorio actual: $currentPath" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "✅ Directorio correcto: $currentPath" -ForegroundColor Green
Write-Host ""

# Crear backup
Write-Host "💾 PASO 1: Creando backup..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFolder = "backup-$timestamp"

Write-Host "   Creando carpeta: $backupFolder" -ForegroundColor Gray
New-Item -ItemType Directory -Force -Path $backupFolder | Out-Null
Write-Host "   ✅ Backup creado" -ForegroundColor Green
Write-Host ""

# Crear carpeta para scripts de desarrollo
Write-Host "📁 PASO 2: Organizando scripts de desarrollo..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "scripts-dev" | Out-Null

# Mover scripts .bat
$batFiles = Get-ChildItem -Path "." -Filter "*.bat" -File
if ($batFiles.Count -gt 0) {
    foreach ($file in $batFiles) {
        Write-Host "   Moviendo: $($file.Name)" -ForegroundColor Gray
        Copy-Item $file.FullName "$backupFolder\$($file.Name)" -Force
        Move-Item $file.FullName "scripts-dev\" -Force
    }
    Write-Host "   ✅ Movidos $($batFiles.Count) archivos .bat" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No se encontraron archivos .bat" -ForegroundColor Gray
}

# Mover scripts .ps1 (excepto este)
$ps1Files = Get-ChildItem -Path "." -Filter "*.ps1" -File | Where-Object { $_.Name -ne "limpiar-proyecto-dev.ps1" }
if ($ps1Files.Count -gt 0) {
    foreach ($file in $ps1Files) {
        Write-Host "   Moviendo: $($file.Name)" -ForegroundColor Gray
        Copy-Item $file.FullName "$backupFolder\$($file.Name)" -Force
        Move-Item $file.FullName "scripts-dev\" -Force
    }
    Write-Host "   ✅ Movidos $($ps1Files.Count) archivos .ps1" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No se encontraron archivos .ps1 para mover" -ForegroundColor Gray
}

# Mover scripts fix-*.js
$fixFiles = Get-ChildItem -Path "." -Filter "fix-*.js" -File
if ($fixFiles.Count -gt 0) {
    foreach ($file in $fixFiles) {
        Write-Host "   Moviendo: $($file.Name)" -ForegroundColor Gray
        Copy-Item $file.FullName "$backupFolder\$($file.Name)" -Force
        Move-Item $file.FullName "scripts-dev\" -Force
    }
    Write-Host "   ✅ Movidos $($fixFiles.Count) archivos fix-*.js" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No se encontraron archivos fix-*.js" -ForegroundColor Gray
}

Write-Host ""

# Eliminar API duplicada de pedidos
Write-Host "🗑️  PASO 3: Eliminando APIs duplicadas..." -ForegroundColor Yellow

if (Test-Path "app\api\pedidos\create") {
    Write-Host "   Eliminando: app\api\pedidos\create\" -ForegroundColor Gray
    Copy-Item "app\api\pedidos\create\route.ts" "$backupFolder\pedidos-create-route.ts" -Force -ErrorAction SilentlyContinue
    Remove-Item "app\api\pedidos\create" -Recurse -Force
    Write-Host "   ✅ Eliminado: app\api\pedidos\create\" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No existe: app\api\pedidos\create\" -ForegroundColor Gray
}

Write-Host ""

# Eliminar páginas de diagnóstico
Write-Host "🗑️  PASO 4: Eliminando páginas de diagnóstico..." -ForegroundColor Yellow

if (Test-Path "app\dashboard\diagnostico-categorias") {
    Write-Host "   Eliminando: app\dashboard\diagnostico-categorias\" -ForegroundColor Gray
    Copy-Item "app\dashboard\diagnostico-categorias\page.tsx" "$backupFolder\diagnostico-categorias-page.tsx" -Force -ErrorAction SilentlyContinue
    Remove-Item "app\dashboard\diagnostico-categorias" -Recurse -Force
    Write-Host "   ✅ Eliminado: app\dashboard\diagnostico-categorias\" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No existe: app\dashboard\diagnostico-categorias\" -ForegroundColor Gray
}

if (Test-Path "app\api\admin\debug-categories") {
    Write-Host "   Eliminando: app\api\admin\debug-categories\" -ForegroundColor Gray
    Copy-Item "app\api\admin\debug-categories\route.ts" "$backupFolder\debug-categories-route.ts" -Force -ErrorAction SilentlyContinue
    Remove-Item "app\api\admin\debug-categories" -Recurse -Force
    Write-Host "   ✅ Eliminado: app\api\admin\debug-categories\" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No existe: app\api\admin\debug-categories\" -ForegroundColor Gray
}

Write-Host ""

# Actualizar .gitignore
Write-Host "📝 PASO 5: Actualizando .gitignore..." -ForegroundColor Yellow

$gitignoreContent = Get-Content ".gitignore" -Raw -ErrorAction SilentlyContinue

if (-not $gitignoreContent -or $gitignoreContent -notlike "*scripts-dev/*") {
    Add-Content -Path ".gitignore" -Value "`n# Scripts de desarrollo`nscripts-dev/`nbackup-*/`n"
    Write-Host "   ✅ .gitignore actualizado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  .gitignore ya contiene scripts-dev/" -ForegroundColor Gray
}

Write-Host ""

# Resumen
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   ✅ LIMPIEZA COMPLETADA EXITOSAMENTE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 RESUMEN:" -ForegroundColor Yellow
Write-Host "   ✅ Backup creado en: $backupFolder\" -ForegroundColor Green
Write-Host "   ✅ Scripts movidos a: scripts-dev\" -ForegroundColor Green
Write-Host "   ✅ APIs duplicadas eliminadas" -ForegroundColor Green
Write-Host "   ✅ Páginas de diagnóstico eliminadas" -ForegroundColor Green
Write-Host "   ✅ .gitignore actualizado" -ForegroundColor Green
Write-Host ""
Write-Host "📝 PRÓXIMOS PASOS MANUALES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1️⃣  Actualizar app\dashboard\nuevo-pedido\page.tsx" -ForegroundColor Cyan
Write-Host "       Reemplazar con el archivo corregido que Claude te generó" -ForegroundColor Gray
Write-Host ""
Write-Host "   2️⃣  Actualizar app\api\consolidaciones\route.ts" -ForegroundColor Cyan
Write-Host "       Reemplazar con el archivo corregido que Claude te generó" -ForegroundColor Gray
Write-Host ""
Write-Host "   3️⃣  Actualizar app\dashboard\consolidar\page.tsx" -ForegroundColor Cyan
Write-Host "       Reemplazar con el archivo corregido que Claude te generó" -ForegroundColor Gray
Write-Host ""
Write-Host "   4️⃣  Testear todo el flujo" -ForegroundColor Cyan
Write-Host "       npm run dev → Crear pedido → Consolidar → Verificar email" -ForegroundColor Gray
Write-Host ""
Write-Host "   5️⃣  Commit y push" -ForegroundColor Cyan
Write-Host "       git add ." -ForegroundColor Gray
Write-Host "       git commit -m 'feat: limpieza y consolidación de APIs'" -ForegroundColor Gray
Write-Host "       git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 NOTA: Si algo sale mal, restaurá desde la carpeta $backupFolder\" -ForegroundColor Yellow
Write-Host ""

Read-Host "Presiona Enter para cerrar"
