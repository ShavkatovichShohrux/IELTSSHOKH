@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title SmartBoard

if exist ".venv\.installed" goto run

echo [SmartBoard] Birinchi ishga tushirish: kutubxonalar o'rnatilmoqda (2-5 daqiqa)...
set "PY="
for %%V in (3.12 3.11 3.13 3.10) do if not defined PY py -%%V -c "import sys" >nul 2>&1 && set "PY=py -%%V"
if not defined PY set "PY=python"
echo [SmartBoard] Python: %PY%
if not exist ".venv\Scripts\python.exe" %PY% -m venv .venv
if errorlevel 1 goto fail
".venv\Scripts\python.exe" -m pip install --upgrade pip
".venv\Scripts\python.exe" -m pip install "numpy>=1.24" "opencv-contrib-python>=4.8"
if errorlevel 1 goto fail
".venv\Scripts\python.exe" -m pip install "mediapipe>=0.10.14"
if errorlevel 1 echo [SmartBoard] DIQQAT: mediapipe o'rnatilmadi - faqat ruchka (pen) rejimi ishlaydi. Python 3.10-3.12 o'rnating.
echo ok> ".venv\.installed"

:run
".venv\Scripts\python.exe" smartboard.py %*
if errorlevel 1 pause
goto :eof

:fail
echo.
echo [SmartBoard] XATO: Python topilmadi yoki o'rnatish buzildi.
echo   1) https://www.python.org dan Python 3.12 o'rnating ("Add to PATH" belgilang)
echo   2) .venv papkasini o'chirib, bu faylni qayta ishga tushiring
pause
