@echo off
echo Iniciando servidor API en http://localhost:8000
echo Usa Ctrl+C para detener el servidor
echo.
cd /d "%~dp0"
php -S localhost:8000 -t public
