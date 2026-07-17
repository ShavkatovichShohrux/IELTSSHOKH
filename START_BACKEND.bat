@echo off
echo.
echo ==========================================
echo  IELTSSHOKH Platform - Backend
echo ==========================================
echo.

cd /d "%~dp0backend"

if not exist ".venv" (
    echo [1/2] Virtual environment yaratilmoqda...
    uv venv .venv --python 3.12
)

echo [2/2] Dependencylar o'rnatilmoqda...
uv pip install -r requirements.txt

echo.
echo [INFO] Birinchi marta seed qilish...
.venv\Scripts\python.exe seed.py 2>nul

echo.
echo ==========================================
echo  Backend ishga tushirilmoqda...
echo  URL: http://localhost:8000
echo  Docs: http://localhost:8000/api/docs
echo ==========================================
echo.

.venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000 --reload

pause
