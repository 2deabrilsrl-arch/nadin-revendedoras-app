@echo off
chcp 65001 >nul
echo ========================================
echo GENERANDO ESTRUCTURA DE LA APP
echo ========================================
echo.

cd /d "%~dp0"

set DESKTOP=%USERPROFILE%\Desktop
set OUTPUT=%DESKTOP%\estructura-app-nadin.txt

echo Generando archivo en el escritorio...
echo.

(
echo ========================================
echo ESTRUCTURA COMPLETA DE LA APP
echo ========================================
echo Generado: %date% %time%
echo.
echo.
echo ========================================
echo 1. ESTRUCTURA DE CARPETAS Y ARCHIVOS
echo ========================================
echo.
tree app /F /A
echo.
echo.
echo ========================================
echo 2. LISTA DE TODOS LOS ARCHIVOS .TS Y .TSX
echo ========================================
echo.
dir app\*.ts app\*.tsx /S /B
echo.
echo.
echo ========================================
echo 3. ARCHIVOS EN CARPETA API
echo ========================================
echo.
tree app\api /F /A
echo.
echo.
echo ========================================
echo 4. ARCHIVOS EN CARPETA PRODUCTOS
echo ========================================
echo.
tree app\productos /F /A 2^>nul ^|^| echo No existe carpeta productos
echo.
echo.
echo ========================================
echo 5. ARCHIVOS EN CARPETA COMPONENTS
echo ========================================
echo.
tree components /F /A 2^>nul ^|^| echo No existe carpeta components
echo.
echo.
echo ========================================
echo FIN DEL REPORTE
echo ========================================
) > "%OUTPUT%"

echo.
echo ✅ LISTO!
echo.
echo Archivo generado en:
echo %OUTPUT%
echo.
echo Abre ese archivo y enviaselo a Claude
echo.
pause
