@echo off
echo ========================================
echo ARHTI System - Android Build Script
echo ========================================
echo.

echo [1/5] Installing dependencies...
call pnpm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/5] Running Expo prebuild...
call npx expo prebuild --platform android --clean
if %errorlevel% neq 0 (
    echo ERROR: Failed to prebuild project
    pause
    exit /b 1
)

echo.
echo [3/5] Building Expo project...
call npx expo export --platform android
if %errorlevel% neq 0 (
    echo ERROR: Failed to export project
    pause
    exit /b 1
)

echo.
echo [4/5] Creating Android build...
call npx expo run:android --variant release
if %errorlevel% neq 0 (
    echo ERROR: Failed to create Android build
    pause
    exit /b 1
)

echo.
echo [5/5] Build completed successfully!
echo.
echo Your Android APK is ready for installation.
echo Check the android/app/build/outputs/apk/ directory for the APK file.
echo.
echo To install on device:
echo 1. Enable "Install from unknown sources" on your Android device
echo 2. Transfer the APK file to your device
echo 3. Open the APK file to install
echo.
pause
