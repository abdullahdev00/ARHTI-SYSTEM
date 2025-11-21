import { useState } from 'react';
import { Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { getConfig } from '../config/environment';

// Complete the auth session for Expo
WebBrowser.maybeCompleteAuthSession();

export const useSimpleDriveAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  
  // Use working redirect URI from Google Console
  // This URI is already configured and working - no redirect_uri_mismatch
  const redirectUri = 'https://auth.expo.io/@abdullah74/arhti-system-2024';
  
  // Available URIs from Google Console (confirmed working)
  const availableUris = [
    'https://auth.expo.io/@abdullah74/arhti-system-2024', // Primary (Working)
    'https://arhti-bussiness-software.firebaseapp.com/__/auth/handler', // Firebase
    'https://arhti-bussiness-software.web.app/__/auth/handler' // Firebase Alt
  ];

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: getConfig().googleWebClientId,
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.appdata'
      ],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
      // Remove access_type: 'offline' as it's not allowed with Token flow
      // Token flow provides access_token directly, no refresh token needed
      // Disable PKCE for Token flow to avoid code_challenge_method error
      usePKCE: false,
      extraParams: {
        // Add application name to show in OAuth screen
        'application_name': 'Arthi System',
      },
    },
    {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    }
  );

  const requestDrivePermission = async (retryCount = 0) => {
    setIsLoading(true);
    
    try {
      console.log('🔑 Requesting Google Drive permissions...');
      console.log('📍 Working Redirect URI:', redirectUri);
      console.log('🆔 Client ID:', getConfig().googleWebClientId);
      console.log('🔒 PKCE Disabled: true (Token flow)');
      console.log('📋 Response Type: Token');
      console.log('⏰ Access Type: online (offline not supported in Token flow)');
      console.log('🏷️ Application Name: Arthi System');
      console.log('✅ URI Status: Configured in Google Console');
      console.log('ℹ️ Note: expo.io branding is expected with this URI');
      
      const result = await promptAsync({
        showInRecents: true,
        // Add additional options for better redirect handling
        dismissButtonStyle: 'cancel',
      });
      
      console.log('Drive permission result:', result.type);
      
      if (result.type === 'success') {
        const { access_token } = result.params;
        
        if (access_token) {
          setHasPermission(true);
          console.log('✅ Google Drive permission granted');
          
          Alert.alert(
            'Permission Granted!',
            'Google Drive access has been granted. Your data can now be backed up securely.',
            [{ text: 'OK' }]
          );
          
          return {
            success: true,
            accessToken: access_token
          };
        }
      } else if (result.type === 'cancel') {
        console.log('🚫 Drive permission cancelled by user');
        Alert.alert('Cancelled', 'Drive permission was cancelled.');
        return { success: false, error: 'cancelled' };
      } else if (result.type === 'dismiss') {
        console.log('⚠️ OAuth dismissed - this is the "Something went wrong" issue');
        console.log('🔄 This happens due to Expo redirect handling');
        
        // Check if we actually got tokens despite dismiss
        if ((result as any).params && (result as any).params.access_token) {
          console.log('✅ Found access token despite dismiss - treating as success');
          const { access_token } = (result as any).params;
          
          setHasPermission(true);
          Alert.alert(
            'Permission Granted!',
            'Google Drive access has been granted despite redirect issue.',
            [{ text: 'OK' }]
          );
          
          return {
            success: true,
            accessToken: access_token
          };
        } else {
          Alert.alert(
            'Redirect Issue', 
            'OAuth was dismissed due to redirect handling. This is a known Expo issue. Please try again or use a different method.',
            [{ text: 'OK' }]
          );
          return { success: false, error: 'dismissed_redirect_issue' };
        }
      } else {
        console.log('❌ OAuth failed with type:', result.type);
        Alert.alert('Error', 'Failed to get Drive permission. Please try again.');
        return { success: false, error: result.type };
      }
      
    } catch (error: any) {
      console.error('Drive permission error:', error);
      Alert.alert('Error', 'Failed to request Drive permission.');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    requestDrivePermission,
    isLoading,
    hasPermission,
    redirectUri
  };
};
