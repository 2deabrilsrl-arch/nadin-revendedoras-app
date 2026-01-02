# SCRIPT MASIVO: Corregir todos los errores TypeScript en APIs
# Ejecutar desde la raiz del proyecto

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CORRIGIENDO TODOS LOS ARCHIVOS DE API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Buscar todos los route.ts en app/api/
$archivos = Get-ChildItem -Path "app\api" -Filter "route.ts" -Recurse

$contador = 0

foreach ($archivo in $archivos) {
    Write-Host "Procesando: $($archivo.FullName)" -ForegroundColor Yellow
    
    # Leer contenido
    $content = Get-Content $archivo.FullName -Raw
    
    # Guardar contenido original para comparar
    $original = $content
    
    # Reemplazar TODOS los patrones
    $content = $content -replace "= await req\.json\(\);", "= await req.json() as any;"
    $content = $content -replace "= await request\.json\(\);", "= await request.json() as any;"
    
    # Si hubo cambios, guardar
    if ($content -ne $original) {
        Set-Content $archivo.FullName $content -NoNewline
        Write-Host "  [OK] Corregido" -ForegroundColor Green
        $contador++
    } else {
        Write-Host "  [SKIP] Ya estaba correcto" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total archivos encontrados: $($archivos.Count)" -ForegroundColor White
Write-Host "Total archivos corregidos:  $contador" -ForegroundColor Green
Write-Host ""
Write-Host "SIGUIENTE PASO:" -ForegroundColor Yellow
Write-Host "git add app/api/" -ForegroundColor White
Write-Host "git commit -m `"Fix all TypeScript errors in API routes`"" -ForegroundColor White
Write-Host "git push prod main" -ForegroundColor White
Write-Host ""
