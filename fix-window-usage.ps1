# Script para corregir uso de window en archivos TypeScript/JavaScript
# Busca archivos con window.open, window.location, etc y añade verificación

Write-Host "🔍 Buscando archivos con uso de 'window'..." -ForegroundColor Cyan

# Patrones a buscar
$patterns = @(
    "window\.open\(",
    "window\.location",
    "window\.localStorage",
    "window\.sessionStorage",
    "window\.scrollTo",
    "window\.print\("
)

# Directorios a buscar
$directories = @(
    "app",
    "components",
    "lib"
)

$filesToFix = @()

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        $files = Get-ChildItem -Path $dir -Recurse -Include *.tsx,*.ts,*.jsx,*.js
        
        foreach ($file in $files) {
            $content = Get-Content $file.FullName -Raw
            
            foreach ($pattern in $patterns) {
                if ($content -match $pattern) {
                    # Verificar si ya tiene la validación
                    if ($content -notmatch "typeof window !== 'undefined'") {
                        $filesToFix += $file.FullName
                        break
                    }
                }
            }
        }
    }
}

$filesToFix = $filesToFix | Select-Object -Unique

if ($filesToFix.Count -eq 0) {
    Write-Host "✅ No se encontraron archivos que necesiten corrección" -ForegroundColor Green
    exit 0
}

Write-Host "`n📝 Archivos que necesitan corrección:" -ForegroundColor Yellow
$filesToFix | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }

Write-Host "`n⚠️  IMPORTANTE: Este script hará cambios en los archivos" -ForegroundColor Yellow
Write-Host "Se recomienda hacer commit antes de ejecutar" -ForegroundColor Yellow
$confirm = Read-Host "`n¿Deseas continuar? (S/N)"

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "❌ Operación cancelada" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔧 Aplicando correcciones..." -ForegroundColor Cyan

foreach ($file in $filesToFix) {
    Write-Host "  Corrigiendo: $file" -ForegroundColor Gray
    
    $content = Get-Content $file -Raw
    
    # Patrón 1: window.open
    $content = $content -replace '(\s+)(window\.open\([^)]+\);)', '$1if (typeof window !== ''undefined'') {$1  $2$1}'
    
    # Patrón 2: window.location = 
    $content = $content -replace '(\s+)(window\.location\s*=\s*[^;]+;)', '$1if (typeof window !== ''undefined'') {$1  $2$1}'
    
    # Patrón 3: window.location.href =
    $content = $content -replace '(\s+)(window\.location\.href\s*=\s*[^;]+;)', '$1if (typeof window !== ''undefined'') {$1  $2$1}'
    
    Set-Content $file -Value $content -NoNewline
}

Write-Host "`n✅ Correcciones aplicadas exitosamente!" -ForegroundColor Green
Write-Host "📋 Total de archivos corregidos: $($filesToFix.Count)" -ForegroundColor Cyan
Write-Host "`n⚠️  Recomendación: Revisar los cambios con 'git diff' antes de hacer commit" -ForegroundColor Yellow
