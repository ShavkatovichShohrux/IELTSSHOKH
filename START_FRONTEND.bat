@echo off
echo.
echo ==========================================
echo  IELTSSHOKH Platform - Frontend
echo ==========================================
echo.

cd /d "%~dp0frontend"

set NODE_PATH=C:\Program Files\nodejs

if not exist "node_modules" (
    echo [1/2] Node modules o'rnatilmoqda...
    "%NODE_PATH%\npm.cmd" install
)

echo.
echo ==========================================
echo  Frontend ishga tushirilmoqda...
echo  URL: http://localhost:5173
echo ==========================================
echo.

"%NODE_PATH%\npm.cmd" run dev

pause
