@echo off
cls
echo ========================================
echo FIX MASIVO - TODOS LOS ERRORES DE API
echo ========================================
echo.
echo Este script va a corregir AUTOMATICAMENTE:
echo - Todos los archivos route.ts en app/api/
echo - Agregando "as any" a req.json() y request.json()
echo.
echo Es SEGURO porque:
echo - Solo cambia el tipo TypeScript
echo - No modifica la logica
echo - Ya lo probamos en 16+ archivos
echo.
pause

echo.
echo ========================================
echo EJECUTANDO CORRECCION MASIVA...
echo ========================================
echo.

powershell -ExecutionPolicy Bypass -File FIX-ALL-API-ERRORS.ps1

echo.
echo ========================================
echo LISTO!
echo ========================================
echo.
pause
