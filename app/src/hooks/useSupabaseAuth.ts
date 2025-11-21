import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../config/supabase';
import * as Google from 'expo-auth-session/providers/google';
import { ResponseType } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { getSupabaseConfig } from '../config/environment';

// Complete the auth session for Expo
WebBrowser.maybeCompleteAuthSession();

// Use Expo AuthSession with Supabase Auth integration
export const useSupabaseAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const config = getSupabaseConfig();
  
  // Configure Expo Google Auth with proper redirect URI
  const [request, response, promptAsync] = Google.useAuthRequest({
    responseType: ResponseType.Token,
    clientId: Platform.select({
      web: config.googleWebClientId,
      android: config.googleAndroidClientId,
      ios: config.googleWebClientId, // Use web client ID for iOS
    }),
    scopes: ['openid', 'profile', 'email'],
    redirectUri: Platform.select({
      web: 'https://auth.expo.io/@anonymous/arhti-system',
      default: 'https://auth.expo.io/@anonymous/arhti-system',
    }),
  });

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      
      console.log('🚀 Starting Supabase Google OAuth...');
      
      if (!request) {
        throw new Error('Google Auth request not ready');
      }

      // Prompt for Google authentication
      const result = await promptAsync();
      console.log('📱 Expo Auth Result:', result.type);

      if (result.type === 'cancel') {
        console.log('OAuth cancelled by user');
        return {
          success: false,
          error: 'Authentication cancelled by user',
          method: 'cancelled'
        };
      }

      if (result.type === 'error') {
        console.error('OAuth error:', result.error);
        throw new Error(result.error?.message || 'OAuth authentication failed');
      }
      
      if (result.type === 'success') {
        console.log('Expo auth successful, integrating with Supabase...');
        
        // Extract tokens from OAuth response
        const { 
          access_token: accessToken,
          id_token: idToken,
        } = result.params;

        console.log('📊 OAuth tokens received:', {
          hasAccessToken: !!accessToken,
          hasIdToken: !!idToken,
        });

        if (!accessToken) {
          throw new Error('Missing access_token from OAuth response');
        }

        // Sign in to Supabase with Google OAuth tokens
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken || accessToken, // Use id_token if available, fallback to access_token
          access_token: accessToken,
        });

        if (error) {
          console.error('❌ Supabase Auth Error:', error);
          throw error;
        }

        console.log('🔥 Supabase Auth Success:', {
          userId: data.user?.id,
          email: data.user?.email,
          emailVerified: data.user?.email_confirmed_at ? true : false,
        });

        // Create/update user profile in Supabase database
        if (data.user) {
          console.log('📊 Creating/Updating Supabase profile...');
          
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
              id: data.user.id,
              name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0],
              email: data.user.email!,
              email_verified: data.user.email_confirmed_at ? true : false,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id'
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Don't throw here, as auth was successful
          } else {
            console.log('✅ Profile created/updated successfully');
          }
        }

        return {
          success: true,
          user: {
            id: data.user?.id,
            email: data.user?.email,
            name: data.user?.user_metadata?.full_name || data.user?.user_metadata?.name,
            emailVerified: data.user?.email_confirmed_at ? true : false,
            accessToken: accessToken,
          },
          method: 'expo_supabase'
        };
      } else {
        throw new Error('Unexpected OAuth result type: ' + result.type);
      }
      
    } catch (error: any) {
      console.error('Supabase Auth error:', error);
      
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid credentials. Please check your account.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Authentication Error', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        method: 'error'
      };
      
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signInWithGoogle,
    isLoading,
    request,
  };
};
