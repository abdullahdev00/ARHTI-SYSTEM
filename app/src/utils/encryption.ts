// Simple encryption utilities for sensitive data
import { getSupabaseConfig } from '../config/environment';
import { SecureLogger } from './logger';

export class EncryptionManager {
  private static encryptionKey: string;

  /**
   * Initialize encryption with key from environment
   */
  static initialize() {
    const config = getSupabaseConfig();
    this.encryptionKey = config.encryptionKey.substring(0, 16); // Use encryption key from environment
  }

  /**
   * Simple XOR encryption for basic data protection
   * Note: This is not cryptographically secure, but better than plain text
   */
  static encrypt(text: string): string {
    if (!this.encryptionKey) this.initialize();
    
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
      const textChar = text.charCodeAt(i);
      result += String.fromCharCode(textChar ^ keyChar);
    }
    
    // Base64 encode to make it safe for storage
    return btoa(result);
  }

  /**
   * Decrypt XOR encrypted text
   */
  static decrypt(encryptedText: string): string {
    if (!this.encryptionKey) this.initialize();
    
    try {
      // Base64 decode first
      const decoded = atob(encryptedText);
      
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
        const encryptedChar = decoded.charCodeAt(i);
        result += String.fromCharCode(encryptedChar ^ keyChar);
      }
      
      return result;
    } catch (error) {
      SecureLogger.error('Decryption failed');
      return '';
    }
  }

  /**
   * Hash sensitive data for comparison
   */
  static hash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Generate a random salt for additional security
   */
  static generateSalt(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Encrypt sensitive database fields
   */
  static encryptSensitiveData(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['phone', 'address', 'email'];
    const encrypted = { ...data };

    sensitiveFields.forEach(field => {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = this.encrypt(encrypted[field]);
      }
    });

    return encrypted;
  }

  /**
   * Decrypt sensitive database fields
   */
  static decryptSensitiveData(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['phone', 'address', 'email'];
    const decrypted = { ...data };

    sensitiveFields.forEach(field => {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        decrypted[field] = this.decrypt(decrypted[field]);
      }
    });

    return decrypted;
  }
}

// Initialize encryption on module load
EncryptionManager.initialize();
