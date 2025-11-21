@echo off
echo 🚀 Building Android APK for Testing with Android Client
echo.

echo 📋 Build Configuration:
echo - Package: com.arhti.system
echo - Client: Android OAuth Client
echo - Testing: Real device APK
echo - Build Type: Development APK
echo.

echo 🔧 Prerequisites:
echo 1. EAS CLI installed
echo 2. Expo account logged in
echo 3. Android OAuth Client configured
echo.

echo 📦 Installing EAS CLI (if needed)...
call npm install -g @expo/eas-cli

echo.
echo 🔐 Login to Expo...
call eas login

echo.
echo 🏗️  Building Development APK...
echo This will create APK with Android OAuth Client
call eas build --platform android --profile preview

echo.
echo 📱 After Build Completes:
echo 1. Download APK from Expo dashboard
echo 2. Install on Android device: adb install app.apk
echo 3. Test Google Sign-In with Android Client
echo 4. Should work without redirect URI issues
echo.

echo ✅ Build started!
echo Check progress: https://expo.dev/accounts/[your-username]/projects/arhti-system/builds
echo.
pause
