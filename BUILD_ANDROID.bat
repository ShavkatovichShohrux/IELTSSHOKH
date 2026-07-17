@echo off
echo.
echo ==========================================
echo  IELTSSHOKH - Android App Yasash
echo  FLAG_SECURE: Screenshot to'liq blok
echo ==========================================
echo.

set NODE_PATH=C:\Program Files\nodejs
set CAP=%~dp0frontend\node_modules\.bin\cap.cmd

cd /d "%~dp0frontend"

echo [1/3] Frontend build qilinmoqda...
"%NODE_PATH%\npm.cmd" run build
if errorlevel 1 ( echo [XATO] Build muvaffaqiyatsiz! & pause & exit /b 1 )

echo.
echo [2/3] Android ga ko'chirilmoqda...
"%CAP%" sync android
if errorlevel 1 ( echo [XATO] Sync muvaffaqiyatsiz! & pause & exit /b 1 )

echo.
echo [3/3] Android Studio ochilmoqda...
echo      (APK build qilish uchun: Build -> Generate Signed APK)
"%CAP%" open android

echo.
echo ==========================================
echo  TAYYOR! Android Studio da:
echo  1. Build -> Generate Signed Bundle/APK
echo  2. APK -> Next -> keystore tanlang
echo  3. Release -> Finish
echo ==========================================
echo.
pause
