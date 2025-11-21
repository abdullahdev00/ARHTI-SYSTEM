// Environment configuration - DO NOT commit sensitive keys
export const ENV_CONFIG = {
  // Development environment
  development: {
    // Supabase Configuration
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'dev-anon-key',
    supabaseServiceKey: process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY || 'dev-service-key',

    // OAuth & General
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'dev-web-client-id',
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'dev-android-client-id',
    appSecret: process.env.EXPO_PUBLIC_APP_SECRET || 'dev-app-secret',
    encryptionKey: process.env.EXPO_PUBLIC_ENCRYPTION_KEY || 'dev-encryption-key'
  },

  // Production environment
  production: {
    // Supabase Configuration
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseServiceKey: process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY!,

    // OAuth & General
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID!,
    appSecret: process.env.EXPO_PUBLIC_APP_SECRET!,
    encryptionKey: process.env.EXPO_PUBLIC_ENCRYPTION_KEY!
  }
};

// Legacy function - kept for backward compatibility (will be removed)
export const getConfig = () => {
  const isDev = __DEV__;
  return isDev ? ENV_CONFIG.development : ENV_CONFIG.production;
};

// Get Supabase configuration
export const getSupabaseConfig = () => {
  const isDev = __DEV__;
  const config = isDev ? ENV_CONFIG.development : ENV_CONFIG.production;
  return {
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
    supabaseServiceKey: config.supabaseServiceKey,
    googleWebClientId: config.googleWebClientId,
    googleAndroidClientId: config.googleAndroidClientId,
    appSecret: config.appSecret,
    encryptionKey: config.encryptionKey
  };
};
