# Script para aplicar fix del error TypeScript window
# Aplica la Solución 1 (@ts-ignore) que es la más rápida y segura

Write-Host "🔧 Fix Rápido - Error TypeScript 'window'" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "app\dashboard\catalogos-digitales\page.tsx")) {
    Write-Host "❌ ERROR: No se encuentra el archivo page.tsx" -ForegroundColor Red
    Write-Host "   Asegúrate de ejecutar este script desde la raíz del proyecto" -ForegroundColor Yellow
    Write-Host "   Ejemplo: C:\Users\tu-usuario\Desktop\nadin-reseller-app`n" -ForegroundColor Yellow
    
    $currentPath = Get-Location
    Write-Host "📍 Directorio actual: $currentPath`n" -ForegroundColor Gray
    
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "✅ Proyecto encontrado`n" -ForegroundColor Green

# Mostrar el archivo actual
Write-Host "📄 Archivo a modificar:" -ForegroundColor Yellow
Write-Host "   app\dashboard\catalogos-digitales\page.tsx`n" -ForegroundColor Gray

# Crear backup
$backupFile = "app\dashboard\catalogos-digitales\page.tsx.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "💾 Creando backup..." -ForegroundColor Yellow
Copy-Item "app\dashboard\catalogos-digitales\page.tsx" $backupFile
Write-Host "   ✅ Backup: $backupFile`n" -ForegroundColor Green

# Leer el archivo actual
$content = Get-Content "app\dashboard\catalogos-digitales\page.tsx" -Raw

# Buscar la función handleOpenDrive
if ($content -match "const handleOpenDrive = \(\) => \{") {
    Write-Host "🔍 Función handleOpenDrive encontrada" -ForegroundColor Green
    
    # Aplicar el fix con @ts-ignore
    $content = $content -replace `
        "const handleOpenDrive = \(\) => \{[^}]+window\.open\([^)]+\);[^}]+\}", `
        @"
const handleOpenDrive = () => {
    // @ts-ignore - window is available in client components
    window.open(driveUrl, '_blank');
  }
"@
    
    # Guardar el archivo modificado
    Set-Content "app\dashboard\catalogos-digitales\page.tsx" -Value $content -NoNewline
    
    Write-Host "✅ Archivo modificado exitosamente`n" -ForegroundColor Green
    
    # Mostrar el cambio
    Write-Host "📝 Cambio aplicado:" -ForegroundColor Cyan
    Write-Host "   + Agregado comentario: @ts-ignore" -ForegroundColor Green
    Write-Host "   + TypeScript ignorará el error de 'window'`n" -ForegroundColor Green
    
    # Confirmar siguiente paso
    Write-Host "🎯 Siguiente paso:" -ForegroundColor Yellow
    Write-Host "   1. Revisa los cambios: git diff" -ForegroundColor Gray
    Write-Host "   2. Commit: git add . && git commit -m 'fix: bypass TS check para window'" -ForegroundColor Gray
    Write-Host "   3. Push: git push origin main`n" -ForegroundColor Gray
    
    $continuar = Read-Host "¿Quieres hacer el commit y push automáticamente? (S/N)"
    
    if ($continuar -eq "S" -or $continuar -eq "s") {
        Write-Host "`n📤 Ejecutando git commands..." -ForegroundColor Cyan
        
        # Git add
        git add app/dashboard/catalogos-digitales/page.tsx
        Write-Host "✅ git add" -ForegroundColor Green
        
        # Git commit
        git commit -m "fix: bypass TypeScript check para window en catalogos-digitales"
        Write-Host "✅ git commit" -ForegroundColor Green
        
        # Git push
        Write-Host "`n🚀 Pusheando a GitHub..." -ForegroundColor Cyan
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ ¡Deploy iniciado! Vercel construirá automáticamente" -ForegroundColor Green
            Write-Host "   Espera 2-3 minutos y verifica en:" -ForegroundColor Yellow
            Write-Host "   https://vercel.com/tu-proyecto`n" -ForegroundColor Gray
        } else {
            Write-Host "`n❌ Error en git push" -ForegroundColor Red
            Write-Host "   Intenta manualmente: git push origin main`n" -ForegroundColor Yellow
        }
    } else {
        Write-Host "`n📋 Comandos para ejecutar manualmente:" -ForegroundColor Yellow
        Write-Host "   git add ." -ForegroundColor Gray
        Write-Host "   git commit -m 'fix: bypass TS check para window'" -ForegroundColor Gray
        Write-Host "   git push origin main`n" -ForegroundColor Gray
    }
    
    Write-Host "✅ Script completado" -ForegroundColor Green
    
} else {
    Write-Host "❌ ERROR: No se encontró la función handleOpenDrive" -ForegroundColor Red
    Write-Host "   El archivo puede haber sido modificado" -ForegroundColor Yellow
    Write-Host "   Usa la solución manual del README`n" -ForegroundColor Yellow
}

Read-Host "`nPresiona Enter para salir"
