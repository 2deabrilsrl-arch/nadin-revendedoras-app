# Script para corregir TODOS los archivos con next-auth automáticamente
# Ejecutar desde la raíz del proyecto

Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  CORRECCIÓN AUTOMÁTICA DE IMPORTS next-auth" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Buscar todos los archivos con import de next-auth
Write-Host "Buscando archivos con next-auth..." -ForegroundColor Yellow

$archivos = Get-ChildItem -Path "app" -Filter "*.tsx" -Recurse | 
    Where-Object { 
        $content = Get-Content $_.FullName -Raw
        $content -match "from 'next-auth/react'"
    }

if ($archivos.Count -eq 0) {
    Write-Host "✓ No se encontraron archivos con next-auth/react" -ForegroundColor Green
    Write-Host ""
    Write-Host "Todos los imports ya están correctos." -ForegroundColor Green
    exit 0
}

Write-Host "Encontrados $($archivos.Count) archivo(s):" -ForegroundColor Yellow
Write-Host ""

foreach ($archivo in $archivos) {
    $relativePath = $archivo.FullName -replace [regex]::Escape($PWD.Path + '\'), ''
    Write-Host "  - $relativePath" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Corrigiendo imports..." -ForegroundColor Yellow
Write-Host ""

$corregidos = 0
$errores = 0

foreach ($archivo in $archivos) {
    $relativePath = $archivo.FullName -replace [regex]::Escape($PWD.Path + '\'), ''
    
    try {
        # Leer contenido
        $content = Get-Content $archivo.FullName -Raw
        
        # Reemplazar import
        $newContent = $content -replace "from 'next-auth/react'", "from '@/lib/useSession'"
        
        # Guardar
        Set-Content -Path $archivo.FullName -Value $newContent -Encoding UTF8 -NoNewline
        
        Write-Host "  ✓ $relativePath" -ForegroundColor Green
        $corregidos++
    }
    catch {
        Write-Host "  ✗ $relativePath - Error: $_" -ForegroundColor Red
        $errores++
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  RESUMEN" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Archivos corregidos: $corregidos" -ForegroundColor Green
if ($errores -gt 0) {
    Write-Host "Errores: $errores" -ForegroundColor Red
}
Write-Host ""
Write-Host "SIGUIENTE PASO:" -ForegroundColor Yellow
Write-Host "1. Verificar que lib\useSession.ts existe" -ForegroundColor Cyan
Write-Host "2. Si no existe, ejecutar: powershell -ExecutionPolicy Bypass -File .\crear-useSession.ps1" -ForegroundColor Cyan
Write-Host "3. Limpiar build: rmdir /s /q .next" -ForegroundColor Cyan
Write-Host "4. Reiniciar: npm run dev" -ForegroundColor Cyan
Write-Host ""
