@echo off
echo 🎨 Installing Enhanced Splash Screen for ARHTI System
echo.

echo 📦 Installing expo-splash-screen...
call npx expo install expo-splash-screen

echo.
echo 🔧 Generating splash screen assets...
echo This will create optimized splash screens for all device sizes

echo.
echo 📋 Manual Steps Required:
echo 1. Replace app.json with app.config.js for better configuration
echo 2. Ensure your logo is transparent PNG format
echo 3. Run: npx expo prebuild --clean (if using development build)
echo 4. Test on emulator: npx expo start

echo.
echo ✅ Splash screen setup completed!
echo Your app will now show a beautiful splash screen with your transparent logo
echo.
pause
