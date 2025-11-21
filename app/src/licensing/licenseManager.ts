// Comprehensive License Management System
import { 
  License, 
  LicenseStatus, 
  LicenseValidationResult, 
  SUBSCRIPTION_PLANS, 
  FEATURE_PERMISSIONS,
  LICENSE_CONFIG 
} from './types';
import { deviceManager } from './deviceManager';
import { licenseStorage } from './licenseStorage';
import { SecureLogger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class LicenseManager {
  private static instance: LicenseManager;
  private currentLicense: License | null = null;
  private lastValidation: number = 0;
  private validationInProgress: boolean = false;

  private constructor() {}

  static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }

  /**
   * Initialize license system
   */
  async initialize(): Promise<void> {
    try {
      SecureLogger.log('Initializing license system...');
      
      // Load existing license
      await this.loadLicense();
      
      // Validate license if exists
      if (this.currentLicense) {
        await this.validateLicense();
      } else {
        // Check if trial is available
        await this.checkTrialEligibility();
      }
      
      SecureLogger.log('License system initialized');
    } catch (error) {
      SecureLogger.error('Failed to initialize license system');
    }
  }

  /**
   * Start free trial
   */
  async startFreeTrial(): Promise<LicenseValidationResult> {
    try {
      SecureLogger.log('Starting free trial...');
      
      // Check if trial already used
      const trialInfo = await licenseStorage.getTrialInfo();
      if (trialInfo) {
        return {
          isValid: false,
          error: 'Trial already used on this device'
        };
      }

      // Get device fingerprint
      const deviceFingerprint = await deviceManager.generateDeviceFingerprint();
      
      // Create trial license
      const now = Date.now();
      const trialDuration = LICENSE_CONFIG.TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
      
      const trialLicense: License = {
        id: `trial_${deviceFingerprint}_${now}`,
        userId: 'trial_user',
        planId: 'free_trial',
        deviceFingerprint,
        status: LicenseStatus.TRIAL,
        createdAt: now,
        expiresAt: now + trialDuration,
        lastValidated: now,
        features: SUBSCRIPTION_PLANS.FREE_TRIAL.features,
        deviceLimit: 1,
        currentDevices: [deviceFingerprint],
        metadata: {
          purchaseDate: now,
          autoRenew: false,
          trialUsed: true,
          upgradeHistory: []
        }
      };

      // Store trial license
      const stored = await licenseStorage.storeLicense(trialLicense);
      
      if (!stored) {
        return {
          isValid: false,
          error: 'Failed to store trial license'
        };
      }

      // Store trial info
      await licenseStorage.storeTrialInfo(now, trialLicense.expiresAt);
      
      this.currentLicense = trialLicense;
      
      SecureLogger.safelog('Free trial started', {
        licenseId: trialLicense.id.substring(0, 12) + '...',
        expiresAt: new Date(trialLicense.expiresAt).toISOString()
      });

      return {
        isValid: true,
        license: trialLicense,
        remainingDays: LICENSE_CONFIG.TRIAL_DURATION_DAYS
      };
    } catch (error) {
      SecureLogger.error('Failed to start free trial');
      return {
        isValid: false,
        error: 'Failed to initialize trial'
      };
    }
  }

  /**
   * Validate current license
   */
  async validateLicense(): Promise<LicenseValidationResult> {
    try {
      if (this.validationInProgress) {
        return { isValid: false, error: 'Validation in progress' };
      }

      this.validationInProgress = true;

      if (!this.currentLicense) {
        await this.loadLicense();
      }

      if (!this.currentLicense) {
        return { isValid: false, error: 'No license found' };
      }

      // Check expiration
      const now = Date.now();
      const isExpired = now > this.currentLicense.expiresAt;
      
      if (isExpired) {
        await this.handleExpiredLicense();
        return {
          isValid: false,
          error: 'License expired',
          remainingDays: 0
        };
      }

      // Check device binding
      const deviceFingerprint = await deviceManager.generateDeviceFingerprint();
      const isDeviceBound = this.currentLicense.currentDevices.includes(deviceFingerprint);
      
      if (!isDeviceBound) {
        return {
          isValid: false,
          error: 'License not bound to this device'
        };
      }

      // Calculate remaining days
      const remainingMs = this.currentLicense.expiresAt - now;
      const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

      // Update last validation
      this.currentLicense.lastValidated = now;
      await licenseStorage.storeLicense(this.currentLicense);
      
      this.lastValidation = now;

      const result: LicenseValidationResult = {
        isValid: true,
        license: this.currentLicense,
        remainingDays,
        needsRenewal: remainingDays <= 7 // Warn 7 days before expiry
      };

      SecureLogger.safelog('License validated successfully', {
        licenseId: this.currentLicense.id.substring(0, 12) + '...',
        status: this.currentLicense.status,
        remainingDays
      });

      return result;
    } catch (error) {
      SecureLogger.error('License validation failed');
      return {
        isValid: false,
        error: 'Validation error'
      };
    } finally {
      this.validationInProgress = false;
    }
  }

  /**
   * Check if user can access a specific feature
   */
  async canAccessFeature(featureId: string): Promise<boolean> {
    try {
      const validation = await this.validateLicense();
      
      if (!validation.isValid || !validation.license) {
        return false;
      }

      // Check if feature is included in current plan
      const hasFeature = validation.license.features.includes(featureId);
      
      if (!hasFeature) {
        SecureLogger.debug(`Feature access denied: ${featureId}`);
      }

      return hasFeature;
    } catch (error) {
      SecureLogger.error(`Failed to check feature access: ${featureId}`);
      return false;
    }
  }

  /**
   * Get current license status
   */
  async getLicenseStatus(): Promise<{
    hasLicense: boolean;
    status?: LicenseStatus;
    planId?: string;
    remainingDays?: number;
    isExpired?: boolean;
  }> {
    try {
      const validation = await this.validateLicense();
      
      if (!validation.isValid || !validation.license) {
        return { hasLicense: false };
      }

      return {
        hasLicense: true,
        status: validation.license.status,
        planId: validation.license.planId,
        remainingDays: validation.remainingDays,
        isExpired: validation.remainingDays === 0
      };
    } catch (error) {
      return { hasLicense: false };
    }
  }

  /**
   * Get available subscription plans
   */
  getAvailablePlans(): typeof SUBSCRIPTION_PLANS {
    return SUBSCRIPTION_PLANS;
  }

  /**
   * Get feature permissions
   */
  getFeaturePermissions(): typeof FEATURE_PERMISSIONS {
    return FEATURE_PERMISSIONS;
  }

  /**
   * Check trial eligibility
   */
  async checkTrialEligibility(): Promise<boolean> {
    try {
      const trialInfo = await licenseStorage.getTrialInfo();
      return trialInfo === null; // Trial available if no trial info exists
    } catch (error) {
      return false;
    }
  }

  /**
   * Get trial remaining days
   */
  async getTrialRemainingDays(): Promise<number> {
    try {
      if (!this.currentLicense || this.currentLicense.status !== LicenseStatus.TRIAL) {
        return 0;
      }

      const now = Date.now();
      const remainingMs = this.currentLicense.expiresAt - now;
      return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
    } catch (error) {
      return 0;
    }
  }

  /**
   * Load license from storage
   */
  private async loadLicense(): Promise<void> {
    try {
      this.currentLicense = await licenseStorage.retrieveLicense();
    } catch (error) {
      SecureLogger.error('Failed to load license');
      this.currentLicense = null;
    }
  }

  /**
   * Handle expired license
   */
  private async handleExpiredLicense(): Promise<void> {
    try {
      if (this.currentLicense) {
        this.currentLicense.status = LicenseStatus.EXPIRED;
        await licenseStorage.updateLicenseStatus(LicenseStatus.EXPIRED);
      }
      
      SecureLogger.warn('License expired');
    } catch (error) {
      SecureLogger.error('Failed to handle expired license');
    }
  }

  /**
   * Clear all license data (for testing)
   */
  async clearLicenseData(): Promise<void> {
    try {
      await licenseStorage.clearLicense();
      this.currentLicense = null;
      this.lastValidation = 0;
      
      SecureLogger.debug('License data cleared');
    } catch (error) {
      SecureLogger.error('Failed to clear license data');
    }
  }

  /**
   * Get license summary for display
   */
  async getLicenseSummary(): Promise<{
    planName: string;
    status: string;
    expiryDate: string;
    remainingDays: number;
    features: string[];
    deviceLimit: number;
  } | null> {
    try {
      const validation = await this.validateLicense();
      
      if (!validation.isValid || !validation.license) {
        return null;
      }

      const plan = SUBSCRIPTION_PLANS[validation.license.planId];
      
      return {
        planName: plan?.displayName || 'Unknown Plan',
        status: validation.license.status,
        expiryDate: new Date(validation.license.expiresAt).toLocaleDateString(),
        remainingDays: validation.remainingDays || 0,
        features: validation.license.features,
        deviceLimit: validation.license.deviceLimit
      };
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const licenseManager = LicenseManager.getInstance();
