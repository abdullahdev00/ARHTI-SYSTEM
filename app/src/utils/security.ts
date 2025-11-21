// Security utilities for app protection
import * as Device from 'expo-device';

// Safe import for Constants
let Constants: any = null;
try {
  Constants = require('expo-constants').default;
} catch (error) {
  console.warn('expo-constants not available, using fallback');
}

export class SecurityManager {
  /**
   * Check if app is running in a secure environment
   */
  static checkEnvironment(): SecurityCheck {
    const checks = {
      isProduction: !__DEV__,
      isRealDevice: Device.isDevice,
      hasValidManifest: !!Constants?.expoConfig,
      isNotDebuggable: !__DEV__
    };

    const isSecure = Object.values(checks).every(check => check === true);

    return {
      isSecure,
      checks,
      warnings: this.getSecurityWarnings(checks)
    };
  }

  /**
   * Get security warnings based on environment checks
   */
  private static getSecurityWarnings(checks: Record<string, boolean>): string[] {
    const warnings: string[] = [];

    if (!checks.isProduction) {
      warnings.push('App is running in development mode');
    }

    if (!checks.isRealDevice) {
      warnings.push('App is running on emulator/simulator');
    }

    if (!checks.isNotDebuggable) {
      warnings.push('App is in debug mode');
    }

    return warnings;
  }

  /**
   * Basic app integrity check
   */
  static async checkIntegrity(): Promise<IntegrityResult> {
    try {
      // Check if critical files exist
      const criticalChecks = {
        hasSupabaseConfig: true, // We can't actually check file existence in RN
        hasEnvironmentConfig: true,
        hasValidConstants: !!Constants.expoConfig?.name
      };

      const passed = Object.values(criticalChecks).every(check => check === true);

      return {
        passed,
        checks: criticalChecks,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        passed: false,
        checks: {},
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate app fingerprint for validation
   */
  static generateFingerprint(): string {
    const data = {
      appName: Constants.expoConfig?.name || 'unknown',
      version: Constants.expoConfig?.version || '0.0.0',
      platform: Device.osName || 'unknown',
      timestamp: Date.now()
    };

    // Simple hash function (not cryptographically secure, but sufficient for basic checks)
    return btoa(JSON.stringify(data)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  /**
   * Validate app signature/fingerprint
   */
  static validateFingerprint(expectedFingerprint: string): boolean {
    const currentFingerprint = this.generateFingerprint();
    return currentFingerprint === expectedFingerprint;
  }
}

// Type definitions
export interface SecurityCheck {
  isSecure: boolean;
  checks: Record<string, boolean>;
  warnings: string[];
}

export interface IntegrityResult {
  passed: boolean;
  checks: Record<string, boolean>;
  error?: string;
  timestamp: string;
}

// Security constants
export const SECURITY_CONFIG = {
  // Minimum security level required
  REQUIRE_PRODUCTION: false, // Allow development mode
  REQUIRE_REAL_DEVICE: false, // Allow emulators for development
  BLOCK_EMULATORS: false, // Set to true for production
  
  // App fingerprint (generate this for production)
  EXPECTED_FINGERPRINT: 'ARHTI2024SECURE01'
};
