@echo off
echo.
echo ==========================================
echo  IELTSSHOKH Platform - Frontend
echo ==========================================
echo.

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [1/2] Node modules o'rnatilmoqda...
    npm install
)

echo.
echo ==========================================
echo  Frontend ishga tushirilmoqda...
echo  URL: http://localhost:5173
echo ==========================================
echo.

npm run dev

pause
