import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/SupabaseAuthContext';
import ProfileCompletionDialog from './ProfileCompletionDialog';

interface ProfileCompletionWrapperProps {
  children: React.ReactNode;
}

export default function ProfileCompletionWrapper({ children }: ProfileCompletionWrapperProps) {
  const { isProfileComplete, userProfile } = useAuth();
  const navigation = useNavigation();
  const [showDialog, setShowDialog] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only check once when user profile is loaded and we haven't checked yet
    if (userProfile && !hasChecked) {
      setHasChecked(true);
      
      // Show dialog if profile is not complete
      if (!isProfileComplete) {
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          setShowDialog(true);
        }, 500);
      }
    }
  }, [userProfile, isProfileComplete, hasChecked]);

  const handleCompleteProfile = () => {
    setShowDialog(false);
    // Navigate to profile screen in mandatory edit mode
    (navigation as any).navigate('ProfileScreen', { 
      editMode: true, 
      mandatoryCompletion: true 
    });
  };

  return (
    <>
      {children}
      <ProfileCompletionDialog
        visible={showDialog}
        onCompleteProfile={handleCompleteProfile}
      />
    </>
  );
}
