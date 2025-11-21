@echo off
echo 🚀 Building ARHTI System for Google Play Store
echo.

echo 📋 Build Information:
echo Package Name: com.arhti.system
echo Version: 1.0.0
echo Build Type: AAB (Android App Bundle)
echo Target: Google Play Store
echo.

echo 🔧 Prerequisites Check:
echo 1. EAS CLI installed
echo 2. Expo account logged in
echo 3. Google Play Console setup
echo 4. All assets optimized
echo.

echo 📦 Installing/Updating EAS CLI...
call npm install -g @expo/eas-cli

echo.
echo 🔐 Login to Expo (if not already logged in)...
call eas login

echo.
echo 🏗️  Building Production AAB for Play Store...
call eas build --platform android --profile production

echo.
echo 📋 Next Steps After Build Completes:
echo 1. Download the AAB file from Expo dashboard
echo 2. Upload to Google Play Console
echo 3. Fill out store listing information
echo 4. Submit for review
echo.

echo ✅ Build command executed!
echo Check Expo dashboard for build progress: https://expo.dev/
echo.
pause
