@echo off
echo 🚀 Running ARHTI System on Android Emulator
echo.

REM Load environment variables
if exist .env (
    echo 🔧 Loading environment variables...
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        set "%%a=%%b"
    )
    echo ✅ Environment loaded
) else (
    echo ⚠️  .env file not found, using default values
)

echo.
echo 📱 Starting Expo development server...
echo.

REM Start Expo with Android target
npx expo start --android

echo.
echo 📋 Instructions:
echo 1. Make sure Android emulator is running
echo 2. Press 'a' in the terminal to run on Android
echo 3. Or scan QR code with Expo Go app
echo.
echo 🔧 Troubleshooting:
echo - If emulator not detected: adb devices
echo - If port busy: npx expo start --port 8085
echo - If build fails: npx expo install --fix
echo.
pause
