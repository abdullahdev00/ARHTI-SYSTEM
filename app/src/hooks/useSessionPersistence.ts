import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import SessionManager from '../utils/sessionManager';

export const useSessionPersistence = () => {
  const { currentUser, userProfile, session } = useAuth();
  const [isSessionRestored, setIsSessionRestored] = useState(false);

  useEffect(() => {
    const checkStoredSession = async () => {
      try {
        const hasSession = await SessionManager.hasStoredSession();
        console.log('Stored session exists:', hasSession);
        
        if (hasSession && !currentUser) {
          console.log('Found stored session but no current user, attempting to restore...');
          // Session restoration is handled by Supabase automatically
          // This is just for monitoring
        }
        
        setIsSessionRestored(true);
      } catch (error) {
        console.error('Error checking stored session:', error);
        setIsSessionRestored(true);
      }
    };

    checkStoredSession();
  }, [currentUser]);

  // Auto-save user profile when it changes
  useEffect(() => {
    if (userProfile) {
      SessionManager.storeUserProfile(userProfile);
    }
  }, [userProfile]);

  const clearSession = async () => {
    try {
      await SessionManager.clearStoredSession();
      console.log('Session cleared manually');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  const refreshSession = async () => {
    try {
      const success = await SessionManager.refreshSession();
      console.log('Session refresh result:', success);
      return success;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  };

  const debugSession = async () => {
    await SessionManager.debugSession();
  };

  return {
    isSessionRestored,
    clearSession,
    refreshSession,
    debugSession,
    hasStoredSession: SessionManager.hasStoredSession,
    validateSession: SessionManager.validateSession,
  };
};

export default useSessionPersistence;
