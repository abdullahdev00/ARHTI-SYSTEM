import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseConfig } from './environment';

// Get environment-specific configuration
const config = getSupabaseConfig();

// Supabase configuration
const supabaseUrl = config.supabaseUrl;
const supabaseAnonKey = config.supabaseAnonKey;

// Custom AsyncStorage adapter for Supabase
const customStorageAdapter = {
  getItem: async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      console.error('AsyncStorage getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('AsyncStorage setItem error:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('AsyncStorage removeItem error:', error);
    }
  },
};

// Create Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic token refresh
    autoRefreshToken: true,
    // Persist session in async storage (React Native)
    persistSession: true,
    // Detect session from URL (useful for OAuth redirects)
    detectSessionInUrl: true,
    // Storage key for session persistence
    storageKey: 'arhti-supabase-auth-token',
    // Custom storage implementation using AsyncStorage
    storage: customStorageAdapter,
  },
  // Global configuration
  global: {
    headers: {
      'X-Client-Info': 'arhti-system-mobile',
    },
  },
  // Database configuration
  db: {
    schema: 'public',
  },
  // Real-time configuration
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Export auth for easy access
export const auth = supabase.auth;

// Export database for easy access
export const db = supabase;

export default supabase;
