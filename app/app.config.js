// Enhanced App Configuration for Better Splash & Icons
export default {
  expo: {
    name: "ARHTI System",
    slug: "arhti-system",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "com.arhti.system",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    
    // Enhanced Splash Screen Configuration
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff", // Clean white background
      // Additional splash options for better experience
    },
    
    // iOS Configuration
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.arhti.system",
      buildNumber: "1.0.0"
    },
    
    // Android Configuration
    android: {
      package: "com.arhti.system",
      versionCode: 1,
      
      // Enhanced Adaptive Icon
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff", // Clean white background
        monochromeImage: "./assets/adaptive-icon.png" // For themed icons
      },
      
      // Splash screen for Android
      splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        mdpi: "./assets/splash-icon.png",
        hdpi: "./assets/splash-icon.png",
        xhdpi: "./assets/splash-icon.png",
        xxhdpi: "./assets/splash-icon.png",
        xxxhdpi: "./assets/splash-icon.png"
      },
      
      // Permissions
      permissions: [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      
      // Intent Filters for OAuth Redirect Fix
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "auth.expo.io"
            }
          ],
          category: [
            "BROWSABLE",
            "DEFAULT"
          ]
        },
        {
          action: "VIEW",
          category: [
            "BROWSABLE",
            "DEFAULT"
          ],
          data: [
            {
              scheme: "arhti-system"
            },
            {
              scheme: "com.arhti.system"
            },
            {
              scheme: "exp+arhti-system"
            }
          ]
        }
      ],
      
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    
    // Web Configuration
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    
    // Plugins
    plugins: [
      "expo-sqlite",
      "expo-web-browser", 
      "expo-font",
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain"
        }
      ]
    ],
    
    // Additional Configuration
    assetBundlePatterns: [
      "**/*"
    ],
    
    // App Store / Play Store Configuration
    extra: {
      eas: {
        projectId: "c506c0cc-7f92-4922-8bf2-34a3fb51f781"
      }
    }
  }
};
