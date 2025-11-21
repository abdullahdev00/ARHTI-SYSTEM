import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

const SESSION_KEY = 'arhti-supabase-auth-token';
const USER_PROFILE_KEY = 'arhti-user-profile';

export class SessionManager {
  /**
   * Check if user session exists in storage
   */
  static async hasStoredSession(): Promise<boolean> {
    try {
      const session = await AsyncStorage.getItem(SESSION_KEY);
      return !!session;
    } catch (error) {
      console.error('Error checking stored session:', error);
      return false;
    }
  }

  /**
   * Get stored session data
   */
  static async getStoredSession(): Promise<any> {
    try {
      const sessionData = await AsyncStorage.getItem(SESSION_KEY);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error getting stored session:', error);
      return null;
    }
  }

  /**
   * Store user profile in local storage for quick access
   */
  static async storeUserProfile(profile: any): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Error storing user profile:', error);
    }
  }

  /**
   * Get stored user profile
   */
  static async getStoredUserProfile(): Promise<any> {
    try {
      const profileData = await AsyncStorage.getItem(USER_PROFILE_KEY);
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error('Error getting stored user profile:', error);
      return null;
    }
  }

  /**
   * Clear all stored session data
   */
  static async clearStoredSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([SESSION_KEY, USER_PROFILE_KEY]);
      console.log('Session data cleared from storage');
    } catch (error) {
      console.error('Error clearing stored session:', error);
    }
  }

  /**
   * Refresh current session
   */
  static async refreshSession(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return false;
      }

      console.log('Session refreshed successfully');
      return !!data.session;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  }

  /**
   * Debug session information
   */
  static async debugSession(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const storedSession = await SessionManager.getStoredSession();
      const storedProfile = await SessionManager.getStoredUserProfile();

      // Debug logs removed for production
    } catch (error) {
      console.error('Error debugging session:', error);
    }
  }

  /**
   * Validate current session
   */
  static async validateSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session validation error:', error);
        return false;
      }

      if (!session) {
        console.log('No active session found');
        return false;
      }

      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        console.log('Session has expired, attempting refresh...');
        return await SessionManager.refreshSession();
      }

      console.log('Session is valid');
      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }
}

export default SessionManager;
