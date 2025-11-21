import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { CustomSplashScreen } from './src/components/CustomSplashScreen';
import BiometricLockScreen from './src/screens/BiometricLockScreen';

// ✅ NativeWind CSS import (temporarily disabled)
// import './global.css';

// Safe import for SafeAreaProvider
let SafeAreaProvider: any = View; // Fallback to View
try {
  const { SafeAreaProvider: SAP } = require('react-native-safe-area-context');
  SafeAreaProvider = SAP;
} catch (error) {
  console.warn('react-native-safe-area-context not available, using fallback');
}
// import { DatabaseProvider } from './src/context/DatabaseContext'; // DEPRECATED - causes conflicts
// ✅ NEW SYNC SYSTEM ONLY
import { NewSyncProvider } from './src/providers/NewSyncProvider'; // FRESH: Modern system
import { SupabaseAuthProvider } from './src/contexts/SupabaseAuthContext';
import { BiometricProvider, useBiometric } from './src/contexts/BiometricContext';
import { CartProvider } from './src/contexts/CartContext';
import { SecurityWrapper } from './src/components/SecurityWrapper';
import { LicenseWrapper } from './src/components/LicenseWrapper';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SessionDebugger } from './src/components/SessionDebugger';
import { ProfileDebugger } from './src/components/ProfileDebugger';

// OLD SYSTEM DEBUGGERS REMOVED - Using fresh sync system only

// Inner component that uses BiometricContext
const AppContent = () => {
  const { isBiometricEnabled } = useBiometric();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Show biometric lock if enabled and not unlocked
  if (isBiometricEnabled && !isUnlocked) {
    return <BiometricLockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  if (showSplash) {
    return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <NewSyncProvider>
      <CartProvider>
        <SecurityWrapper>
          <LicenseWrapper>
            <AppNavigator />
            {/* <SessionDebugger visible={__DEV__} />
            <ProfileDebugger visible={__DEV__} /> */}
          </LicenseWrapper>
        </SecurityWrapper>
        <StatusBar style="auto" />
      </CartProvider>
    </NewSyncProvider>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <SafeAreaProvider>
      <SupabaseAuthProvider>
        <BiometricProvider>
          <AppContent />
        </BiometricProvider>
      </SupabaseAuthProvider>
    </SafeAreaProvider>
  );
}
