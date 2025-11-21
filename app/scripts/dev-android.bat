@echo off
echo ========================================
echo ARHTI System - Android Development
echo ========================================
echo.

echo [1/3] Installing dependencies...
call pnpm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Starting Expo development server...
echo.
echo Instructions:
echo 1. Make sure your Android device is connected via USB
echo 2. Enable USB debugging on your device
echo 3. Press 'a' to open on Android device
echo 4. Or scan the QR code with Expo Go app
echo.

call npx expo start --android
if %errorlevel% neq 0 (
    echo ERROR: Failed to start development server
    pause
    exit /b 1
)

echo.
echo Development server stopped.
pause
