@echo off
echo 🚀 Starting Android Emulator for ARHTI System
echo.

REM Check if Android SDK is available
if not exist "%ANDROID_HOME%\emulator\emulator.exe" (
    echo ❌ Android SDK not found!
    echo Please install Android Studio and set ANDROID_HOME environment variable
    echo Download from: https://developer.android.com/studio
    pause
    exit /b 1
)

echo 📱 Available Android Virtual Devices:
"%ANDROID_HOME%\emulator\emulator.exe" -list-avds

echo.
echo 🔥 Starting default emulator...
echo If no emulator starts, create one in Android Studio AVD Manager

REM Try to start common emulator names
"%ANDROID_HOME%\emulator\emulator.exe" -avd Pixel_4_API_30 2>nul || (
    "%ANDROID_HOME%\emulator\emulator.exe" -avd Pixel_3_API_30 2>nul || (
        "%ANDROID_HOME%\emulator\emulator.exe" -avd Medium_Phone_API_30 2>nul || (
            echo ❌ No emulator found with common names
            echo Please create an emulator in Android Studio:
            echo 1. Open Android Studio
            echo 2. Tools → AVD Manager
            echo 3. Create Virtual Device
            echo 4. Choose Pixel 4 or similar
            echo 5. Download API 30+ system image
            echo 6. Finish setup
            pause
            exit /b 1
        )
    )
)

echo.
echo ✅ Emulator starting...
echo Wait for emulator to fully boot, then run:
echo npx expo start
echo Press 'a' to run on Android emulator
echo.
pause
