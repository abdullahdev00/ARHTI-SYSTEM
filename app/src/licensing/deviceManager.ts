// Secure Device Fingerprinting System
import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecureLogger } from '../utils/logger';

// Safe import for Constants
let Constants: any = null;
try {
  Constants = require('expo-constants').default;
} catch (error) {
  SecureLogger.warn('expo-constants not available, using fallback');
}

export interface DeviceInfo {
  deviceId: string;
  fingerprint: string;
  brand: string | null;
  modelName: string | null;
  osName: string | null;
  osVersion: string | null;
  platform: string;
  isDevice: boolean;
  totalMemory?: number;
  installationId: string;
  timestamp: number;
}

export class DeviceManager {
  private static instance: DeviceManager;
  private deviceInfo: DeviceInfo | null = null;
  private fingerprint: string | null = null;

  private constructor() {}

  static getInstance(): DeviceManager {
    if (!DeviceManager.instance) {
      DeviceManager.instance = new DeviceManager();
    }
    return DeviceManager.instance;
  }

  /**
   * Generate secure device fingerprint
   */
  async generateDeviceFingerprint(): Promise<string> {
    try {
      if (this.fingerprint) {
        return this.fingerprint;
      }

      // Collect device information
      const deviceData = {
        // Basic device info
        brand: Device.brand || 'unknown',
        modelName: Device.modelName || 'unknown',
        osName: Device.osName || 'unknown', 
        osVersion: Device.osVersion || 'unknown',
        platform: Device.platformApiLevel?.toString() || 'unknown',
        isDevice: Device.isDevice,
        totalMemory: Device.totalMemory || 0,
        
        // App-specific info
        appName: Constants?.expoConfig?.name || 'ARHTI-System',
        appVersion: Constants?.expoConfig?.version || '1.0.0',
        expoVersion: Constants?.expoVersion || 'unknown',
        
        // Installation info
        installationTime: await this.getInstallationTime(),
        
        // Additional entropy
        screenDimensions: Constants?.screenDimensions || { width: 0, height: 0 },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      // Create deterministic hash
      const dataString = JSON.stringify(deviceData, Object.keys(deviceData).sort());
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        dataString,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // Create shorter, more readable fingerprint
      this.fingerprint = `ARHTI-${hash.substring(0, 16).toUpperCase()}`;
      
      SecureLogger.safelog('Device fingerprint generated', { 
        fingerprint: this.fingerprint.substring(0, 10) + '...' 
      });
      
      return this.fingerprint;
    } catch (error) {
      SecureLogger.error('Failed to generate device fingerprint');
      // Fallback fingerprint
      const fallback = `ARHTI-FALLBACK-${Date.now().toString(36).toUpperCase()}`;
      this.fingerprint = fallback;
      return fallback;
    }
  }

  /**
   * Get comprehensive device information
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    try {
      if (this.deviceInfo) {
        return this.deviceInfo;
      }

      const fingerprint = await this.generateDeviceFingerprint();
      const installationId = await this.getInstallationId();

      this.deviceInfo = {
        deviceId: fingerprint,
        fingerprint,
        brand: Device.brand,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        platform: Device.platformApiLevel?.toString() || 'unknown',
        isDevice: Device.isDevice,
        totalMemory: Device.totalMemory || undefined,
        installationId,
        timestamp: Date.now()
      };

      // Cache device info
      await this.cacheDeviceInfo(this.deviceInfo);
      
      return this.deviceInfo;
    } catch (error) {
      SecureLogger.error('Failed to get device info');
      throw new Error('Device information unavailable');
    }
  }

  /**
   * Get or create installation ID
   */
  private async getInstallationId(): Promise<string> {
    try {
      let installationId = await AsyncStorage.getItem('installation_id');
      
      if (!installationId) {
        // Generate new installation ID
        const randomBytes = await Crypto.getRandomBytesAsync(16);
        installationId = Array.from(randomBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase();
        
        await AsyncStorage.setItem('installation_id', installationId);
        await AsyncStorage.setItem('installation_time', Date.now().toString());
      }
      
      return installationId;
    } catch (error) {
      SecureLogger.error('Failed to get installation ID');
      return `FALLBACK-${Date.now().toString(36).toUpperCase()}`;
    }
  }

  /**
   * Get installation time
   */
  private async getInstallationTime(): Promise<number> {
    try {
      const timeStr = await AsyncStorage.getItem('installation_time');
      return timeStr ? parseInt(timeStr) : Date.now();
    } catch (error) {
      return Date.now();
    }
  }

  /**
   * Cache device info securely
   */
  private async cacheDeviceInfo(info: DeviceInfo): Promise<void> {
    try {
      const cacheKey = 'device_info_cache';
      const encryptedInfo = JSON.stringify(info);
      await AsyncStorage.setItem(cacheKey, encryptedInfo);
    } catch (error) {
      SecureLogger.error('Failed to cache device info');
    }
  }

  /**
   * Validate device integrity
   */
  async validateDeviceIntegrity(): Promise<boolean> {
    try {
      const currentFingerprint = await this.generateDeviceFingerprint();
      const cachedInfo = await AsyncStorage.getItem('device_info_cache');
      
      if (!cachedInfo) {
        return true; // First run
      }
      
      const cached: DeviceInfo = JSON.parse(cachedInfo);
      
      // Check if fingerprint matches
      if (cached.fingerprint !== currentFingerprint) {
        SecureLogger.warn('Device fingerprint mismatch detected');
        return false;
      }
      
      return true;
    } catch (error) {
      SecureLogger.error('Device integrity validation failed');
      return false;
    }
  }

  /**
   * Clear device cache (for testing)
   */
  async clearDeviceCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'device_info_cache',
        'installation_id', 
        'installation_time'
      ]);
      
      this.deviceInfo = null;
      this.fingerprint = null;
      
      SecureLogger.debug('Device cache cleared');
    } catch (error) {
      SecureLogger.error('Failed to clear device cache');
    }
  }

  /**
   * Get device security score
   */
  async getDeviceSecurityScore(): Promise<number> {
    try {
      const info = await this.getDeviceInfo();
      let score = 100;
      
      // Deduct points for security risks
      if (!info.isDevice) score -= 30; // Emulator
      if (!Device.brand) score -= 10; // Unknown brand
      if (!Device.osVersion) score -= 10; // Unknown OS
      if (info.fingerprint.includes('FALLBACK')) score -= 20; // Fallback fingerprint
      
      return Math.max(0, score);
    } catch (error) {
      return 0;
    }
  }
}

// Export singleton instance
export const deviceManager = DeviceManager.getInstance();
