// Development Configuration
// This file contains settings that make development easier while keeping production secure

export const DEV_CONFIG = {
  // Security settings for development
  SECURITY: {
    BYPASS_SECURITY_CHECKS: __DEV__, // Only bypass in development
    ALLOW_EMULATORS: __DEV__, // Allow emulators in development
    DISABLE_INTEGRITY_CHECKS: __DEV__, // Disable integrity checks in dev
    LOG_SECURITY_WARNINGS: __DEV__ // Show security warnings in dev console
  },

  // Licensing settings for development  
  LICENSING: {
    BYPASS_LICENSE_CHECKS: __DEV__, // Bypass licensing in development
    AUTO_GRANT_TRIAL: __DEV__, // Automatically grant trial in dev
    ALLOW_ALL_FEATURES: __DEV__, // Allow all features in development
    MOCK_PREMIUM_ACCESS: __DEV__ // Mock premium access for testing
  },

  // Feature flags for development
  FEATURES: {
    ENABLE_DEBUG_MENU: __DEV__, // Show debug menu in development
    SHOW_PERFORMANCE_METRICS: __DEV__, // Show performance info
    ENABLE_TEST_DATA: __DEV__, // Allow test data generation
    SKIP_ONBOARDING: false // Set to true to skip onboarding in dev
  },

  // Development tools
  TOOLS: {
    ENABLE_FLIPPER: __DEV__, // Enable Flipper debugging
    ENABLE_REACTOTRON: __DEV__, // Enable Reactotron debugging  
    LOG_REDUX_ACTIONS: __DEV__, // Log Redux actions (if using Redux)
    MOCK_API_RESPONSES: false // Set to true to use mock API responses
  },

  // Performance settings
  PERFORMANCE: {
    DISABLE_ANIMATIONS: false, // Set to true to disable animations for faster testing
    REDUCE_BUNDLE_SIZE: false, // Set to true to reduce bundle size in dev
    ENABLE_FAST_REFRESH: __DEV__ // Enable Fast Refresh
  }
};

// Helper functions for development
export class DevHelper {
  /**
   * Check if we're in development mode
   */
  static isDevelopment(): boolean {
    return __DEV__;
  }

  /**
   * Check if we're in production mode
   */
  static isProduction(): boolean {
    return !__DEV__;
  }

  /**
   * Log development info
   */
  static logDevInfo(message: string, data?: any): void {
    if (__DEV__) {
      console.log(`[DEV] ${message}`, data || '');
    }
  }

  /**
   * Show development warning
   */
  static warnDev(message: string, data?: any): void {
    if (__DEV__) {
      console.warn(`[DEV WARNING] ${message}`, data || '');
    }
  }

  /**
   * Get development status summary
   */
  static getDevStatus(): {
    isDev: boolean;
    securityBypassed: boolean;
    licensingBypassed: boolean;
    allFeaturesEnabled: boolean;
  } {
    return {
      isDev: __DEV__,
      securityBypassed: DEV_CONFIG.SECURITY.BYPASS_SECURITY_CHECKS,
      licensingBypassed: DEV_CONFIG.LICENSING.BYPASS_LICENSE_CHECKS,
      allFeaturesEnabled: DEV_CONFIG.LICENSING.ALLOW_ALL_FEATURES
    };
  }

  /**
   * Reset all development overrides (useful for testing production behavior in dev)
   */
  static resetDevOverrides(): void {
    if (__DEV__) {
      // This would reset any runtime overrides
      console.log('[DEV] Development overrides reset - app will behave like production');
    }
  }
}

// Export configuration based on environment
export const CONFIG = __DEV__ ? DEV_CONFIG : {
  // Production config - all security enabled
  SECURITY: {
    BYPASS_SECURITY_CHECKS: false,
    ALLOW_EMULATORS: false,
    DISABLE_INTEGRITY_CHECKS: false,
    LOG_SECURITY_WARNINGS: false
  },
  LICENSING: {
    BYPASS_LICENSE_CHECKS: false,
    AUTO_GRANT_TRIAL: false,
    ALLOW_ALL_FEATURES: false,
    MOCK_PREMIUM_ACCESS: false
  },
  FEATURES: {
    ENABLE_DEBUG_MENU: false,
    SHOW_PERFORMANCE_METRICS: false,
    ENABLE_TEST_DATA: false,
    SKIP_ONBOARDING: false
  },
  TOOLS: {
    ENABLE_FLIPPER: false,
    ENABLE_REACTOTRON: false,
    LOG_REDUX_ACTIONS: false,
    MOCK_API_RESPONSES: false
  },
  PERFORMANCE: {
    DISABLE_ANIMATIONS: false,
    REDUCE_BUNDLE_SIZE: true,
    ENABLE_FAST_REFRESH: false
  }
};
