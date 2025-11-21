@echo off
echo 🔐 Getting SHA-1 Certificate Fingerprint for Android OAuth
echo.

echo 📋 This fingerprint is needed for Google Console Android OAuth Client
echo.

echo 🔍 Checking for Android Debug Keystore...
if exist "%USERPROFILE%\.android\debug.keystore" (
    echo ✅ Debug keystore found!
    echo.
    echo 🔐 SHA-1 Fingerprint for DEBUG builds:
    echo ==========================================
    keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android | findstr SHA1
    echo ==========================================
    echo.
    echo 📋 Copy the SHA1 fingerprint above and use it in Google Console
    echo.
) else (
    echo ❌ Debug keystore not found!
    echo Please install Android Studio first or create the keystore
    echo.
)

echo 📝 Instructions for Google Console:
echo 1. Go to Google Cloud Console
echo 2. APIs & Services → Credentials  
echo 3. Create OAuth 2.0 Client ID
echo 4. Select "Android" type
echo 5. Enter:
echo    - Name: ARHTI System Android
echo    - Package name: com.arhti.system
echo    - SHA-1 fingerprint: [Copy from above]
echo.

echo 🎯 For PRODUCTION builds:
echo - EAS Build will generate release keystore automatically
echo - Or you can create your own release keystore
echo - Get SHA-1 from release keystore for production OAuth client
echo.

pause
