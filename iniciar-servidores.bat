@echo off
echo ========================================
echo  CONTA WEB 5 - Iniciar Servidores
echo ========================================
echo.

REM Obtener la ruta actual
set RUTA_ACTUAL=%~dp0

echo [1/2] Iniciando servidor API en localhost:8000...
start "API Lumen" cmd /k "cd /d %RUTA_ACTUAL%api-conta && php -S localhost:8000 -t public"

timeout /t 2 /nobreak > nul

echo [2/2] Iniciando servidor Frontend (Vite)...
start "Frontend React" cmd /k "cd /d %RUTA_ACTUAL%frontend-conta && npm run dev"

echo.
echo ========================================
echo  Servidores iniciados exitosamente!
echo ========================================
echo.
echo  API:      http://localhost:8000
echo  Frontend: http://localhost:5173 (o el puerto que indique Vite)
echo.
echo  Para detener los servidores, cierra las ventanas que se abrieron.
echo.
pause
