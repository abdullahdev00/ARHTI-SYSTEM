// Secure License Storage System
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { License, LicenseStatus, LICENSE_CONFIG } from './types';
import { EncryptionManager } from '../utils/encryption';
import { SecureLogger } from '../utils/logger';

export interface StoredLicense {
  license: License;
  signature: string;
  timestamp: number;
  checksum: string;
}

export class LicenseStorage {
  private static instance: LicenseStorage;
  private encryptionKey: string | null = null;

  private constructor() {
    this.initializeEncryption();
  }

  static getInstance(): LicenseStorage {
    if (!LicenseStorage.instance) {
      LicenseStorage.instance = new LicenseStorage();
    }
    return LicenseStorage.instance;
  }

  /**
   * Initialize encryption for license storage
   */
  private async initializeEncryption(): Promise<void> {
    try {
      // Generate or retrieve encryption key
      let key = await AsyncStorage.getItem('license_encryption_key');
      
      if (!key) {
        // Generate new encryption key
        const randomBytes = await Crypto.getRandomBytesAsync(32);
        key = Array.from(randomBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        await AsyncStorage.setItem('license_encryption_key', key);
      }
      
      this.encryptionKey = key;
    } catch (error) {
      SecureLogger.error('Failed to initialize license encryption');
      // Use fallback encryption
      this.encryptionKey = 'fallback_key_' + Date.now().toString(36);
    }
  }

  /**
   * Store license securely with integrity protection
   */
  async storeLicense(license: License): Promise<boolean> {
    try {
      await this.ensureEncryptionReady();

      // Create license signature
      const signature = await this.createLicenseSignature(license);
      
      // Create checksum for integrity
      const checksum = await this.createChecksum(license);
      
      const storedLicense: StoredLicense = {
        license,
        signature,
        timestamp: Date.now(),
        checksum
      };

      // Encrypt license data
      const encryptedData = await this.encryptLicenseData(storedLicense);
      
      // Store encrypted license
      await AsyncStorage.setItem(LICENSE_CONFIG.STORAGE_KEYS.LICENSE, encryptedData);
      
      // Store backup copy with different key
      await this.storeBackupLicense(storedLicense);
      
      SecureLogger.safelog('License stored successfully', { 
        licenseId: license.id.substring(0, 8) + '...',
        planId: license.planId,
        expiresAt: new Date(license.expiresAt).toISOString()
      });
      
      return true;
    } catch (error) {
      SecureLogger.error('Failed to store license');
      return false;
    }
  }

  /**
   * Retrieve and validate stored license
   */
  async retrieveLicense(): Promise<License | null> {
    try {
      await this.ensureEncryptionReady();

      // Get encrypted license
      const encryptedData = await AsyncStorage.getItem(LICENSE_CONFIG.STORAGE_KEYS.LICENSE);
      
      if (!encryptedData) {
        return null;
      }

      // Decrypt license data
      const storedLicense = await this.decryptLicenseData(encryptedData);
      
      if (!storedLicense) {
        SecureLogger.warn('Failed to decrypt license data');
        return await this.tryRecoverFromBackup();
      }

      // Validate license integrity
      const isValid = await this.validateLicenseIntegrity(storedLicense);
      
      if (!isValid) {
        SecureLogger.warn('License integrity validation failed');
        return await this.tryRecoverFromBackup();
      }

      // Check if license is not tampered
      const currentChecksum = await this.createChecksum(storedLicense.license);
      
      if (currentChecksum !== storedLicense.checksum) {
        SecureLogger.warn('License checksum mismatch - possible tampering');
        return null;
      }

      SecureLogger.safelog('License retrieved successfully', {
        licenseId: storedLicense.license.id.substring(0, 8) + '...',
        status: storedLicense.license.status
      });

      return storedLicense.license;
    } catch (error) {
      SecureLogger.error('Failed to retrieve license');
      return null;
    }
  }

  /**
   * Update license status
   */
  async updateLicenseStatus(status: LicenseStatus): Promise<boolean> {
    try {
      const license = await this.retrieveLicense();
      
      if (!license) {
        return false;
      }

      license.status = status;
      license.lastValidated = Date.now();
      
      return await this.storeLicense(license);
    } catch (error) {
      SecureLogger.error('Failed to update license status');
      return false;
    }
  }

  /**
   * Clear stored license
   */
  async clearLicense(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        LICENSE_CONFIG.STORAGE_KEYS.LICENSE,
        LICENSE_CONFIG.STORAGE_KEYS.LICENSE + '_backup',
        LICENSE_CONFIG.STORAGE_KEYS.DEVICE_BINDING,
        LICENSE_CONFIG.STORAGE_KEYS.LAST_VALIDATION
      ]);
      
      SecureLogger.debug('License data cleared');
    } catch (error) {
      SecureLogger.error('Failed to clear license data');
    }
  }

  /**
   * Store trial information
   */
  async storeTrialInfo(startDate: number, endDate: number): Promise<void> {
    try {
      const trialInfo = {
        startDate,
        endDate,
        timestamp: Date.now()
      };
      
      const encrypted = EncryptionManager.encrypt(JSON.stringify(trialInfo));
      await AsyncStorage.setItem(LICENSE_CONFIG.STORAGE_KEYS.TRIAL_START, encrypted);
      
      SecureLogger.safelog('Trial info stored', {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString()
      });
    } catch (error) {
      SecureLogger.error('Failed to store trial info');
    }
  }

  /**
   * Get trial information
   */
  async getTrialInfo(): Promise<{ startDate: number; endDate: number } | null> {
    try {
      const encrypted = await AsyncStorage.getItem(LICENSE_CONFIG.STORAGE_KEYS.TRIAL_START);
      
      if (!encrypted) {
        return null;
      }
      
      const decrypted = EncryptionManager.decrypt(encrypted);
      const trialInfo = JSON.parse(decrypted);
      
      return {
        startDate: trialInfo.startDate,
        endDate: trialInfo.endDate
      };
    } catch (error) {
      SecureLogger.error('Failed to get trial info');
      return null;
    }
  }

  /**
   * Create license signature for integrity
   */
  private async createLicenseSignature(license: License): Promise<string> {
    const signatureData = {
      id: license.id,
      userId: license.userId,
      planId: license.planId,
      deviceFingerprint: license.deviceFingerprint,
      expiresAt: license.expiresAt
    };
    
    const dataString = JSON.stringify(signatureData, Object.keys(signatureData).sort());
    
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      dataString + (this.encryptionKey || ''),
      { encoding: Crypto.CryptoEncoding.HEX }
    );
  }

  /**
   * Create checksum for license data
   */
  private async createChecksum(license: License): Promise<string> {
    const licenseString = JSON.stringify(license, Object.keys(license).sort());
    
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      licenseString,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
  }

  /**
   * Encrypt license data
   */
  private async encryptLicenseData(storedLicense: StoredLicense): Promise<string> {
    const dataString = JSON.stringify(storedLicense);
    return EncryptionManager.encrypt(dataString);
  }

  /**
   * Decrypt license data
   */
  private async decryptLicenseData(encryptedData: string): Promise<StoredLicense | null> {
    try {
      const decryptedString = EncryptionManager.decrypt(encryptedData);
      return JSON.parse(decryptedString);
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate license integrity
   */
  private async validateLicenseIntegrity(storedLicense: StoredLicense): Promise<boolean> {
    try {
      const currentSignature = await this.createLicenseSignature(storedLicense.license);
      return currentSignature === storedLicense.signature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Store backup copy of license
   */
  private async storeBackupLicense(storedLicense: StoredLicense): Promise<void> {
    try {
      const backupData = {
        ...storedLicense,
        backupTimestamp: Date.now()
      };
      
      const encryptedBackup = EncryptionManager.encrypt(JSON.stringify(backupData));
      await AsyncStorage.setItem(LICENSE_CONFIG.STORAGE_KEYS.LICENSE + '_backup', encryptedBackup);
    } catch (error) {
      SecureLogger.error('Failed to store backup license');
    }
  }

  /**
   * Try to recover license from backup
   */
  private async tryRecoverFromBackup(): Promise<License | null> {
    try {
      const backupData = await AsyncStorage.getItem(LICENSE_CONFIG.STORAGE_KEYS.LICENSE + '_backup');
      
      if (!backupData) {
        return null;
      }
      
      const decrypted = EncryptionManager.decrypt(backupData);
      const backup = JSON.parse(decrypted);
      
      // Validate backup integrity
      const isValid = await this.validateLicenseIntegrity(backup);
      
      if (isValid) {
        SecureLogger.warn('License recovered from backup');
        return backup.license;
      }
      
      return null;
    } catch (error) {
      SecureLogger.error('Failed to recover from backup');
      return null;
    }
  }

  /**
   * Ensure encryption is ready
   */
  private async ensureEncryptionReady(): Promise<void> {
    if (!this.encryptionKey) {
      await this.initializeEncryption();
    }
  }
}

// Export singleton instance
export const licenseStorage = LicenseStorage.getInstance();
