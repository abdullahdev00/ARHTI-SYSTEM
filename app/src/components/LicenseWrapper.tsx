// License Wrapper Component - Handles licensing for entire app
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { licenseManager, featureGate } from '../licensing';
import { SecureLogger } from '../utils/logger';

interface LicenseWrapperProps {
  children: React.ReactNode;
}

interface LicenseState {
  isLoading: boolean;
  hasValidLicense: boolean;
  isTrialAvailable: boolean;
  trialRemainingDays: number;
  licenseStatus: any;
  error?: string;
}

export const LicenseWrapper: React.FC<LicenseWrapperProps> = ({ children }) => {
  const [licenseState, setLicenseState] = useState<LicenseState>({
    isLoading: true,
    hasValidLicense: false,
    isTrialAvailable: false,
    trialRemainingDays: 0,
    licenseStatus: null
  });

  useEffect(() => {
    initializeLicensing();
  }, []);

  const initializeLicensing = async () => {
    try {
      SecureLogger.log('Licensing disabled - full access granted');
      
      // DISABLED: Always allow full access (no license required)
      setLicenseState({
        isLoading: false,
        hasValidLicense: true, // Always allow full access
        isTrialAvailable: false, // No trial needed
        trialRemainingDays: 0,
        licenseStatus: { hasLicense: true, status: 'full_access', planId: 'unlimited' }
      });
      return;
      
      // Initialize license manager
      await licenseManager.initialize();
      
      // Check current license status
      const licenseStatus = await licenseManager.getLicenseStatus();
      const trialEligible = await licenseManager.checkTrialEligibility();
      const trialDays = await licenseManager.getTrialRemainingDays();
      
      setLicenseState({
        isLoading: false,
        hasValidLicense: licenseStatus.hasLicense && !licenseStatus.isExpired,
        isTrialAvailable: trialEligible,
        trialRemainingDays: trialDays,
        licenseStatus
      });

      SecureLogger.safelog('Licensing initialized', {
        hasLicense: licenseStatus.hasLicense,
        status: licenseStatus.status,
        trialEligible
      });

    } catch (error) {
      SecureLogger.error('Failed to initialize licensing');
      setLicenseState({
        isLoading: false,
        hasValidLicense: false,
        isTrialAvailable: false,
        trialRemainingDays: 0,
        licenseStatus: null,
        error: 'Licensing system failed to initialize'
      });
    }
  };

  const startFreeTrial = async () => {
    try {
      const result = await licenseManager.startFreeTrial();
      
      if (result.isValid) {
        Alert.alert(
          '🎉 Trial Started!',
          `Your 7-day free trial has started. Enjoy full access to all features!`,
          [{ text: 'Get Started', onPress: () => initializeLicensing() }]
        );
      } else {
        Alert.alert(
          'Trial Unavailable',
          result.error || 'Free trial is not available on this device.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to start free trial. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleUpgrade = () => {
    // Navigate to pricing screen
    Alert.alert(
      'Upgrade Available',
      'Upgrade to unlock all premium features and continue using the app.',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'View Plans', onPress: () => {
          // TODO: Navigate to pricing screen
          SecureLogger.log('User requested upgrade');
        }}
      ]
    );
  };

  // Loading state
  if (licenseState.isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Initializing licensing...</Text>
      </View>
    );
  }

  // Error state
  if (licenseState.error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Licensing Error</Text>
        <Text style={styles.errorSubtext}>{licenseState.error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeLicensing}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No license and no trial available
  if (!licenseState.hasValidLicense && !licenseState.isTrialAvailable) {
    return (
      <View style={styles.container}>
        <Text style={styles.titleText}>🔒 License Required</Text>
        <Text style={styles.messageText}>
          This app requires a valid license to continue. Please upgrade to access all features.
        </Text>
        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
          <Text style={styles.upgradeButtonText}>View Upgrade Options</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Trial available
  if (!licenseState.hasValidLicense && licenseState.isTrialAvailable) {
    return (
      <View style={styles.container}>
        <Text style={styles.titleText}>🎁 Free Trial Available</Text>
        <Text style={styles.messageText}>
          Try all premium features free for 7 days. No payment required!
        </Text>
        
        <TouchableOpacity style={styles.trialButton} onPress={startFreeTrial}>
          <Text style={styles.trialButtonText}>Start Free Trial</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
          <Text style={styles.upgradeButtonText}>View Paid Plans</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Trial expiring soon warning
  if (licenseState.licenseStatus?.status === 'trial' && licenseState.trialRemainingDays <= 2) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⏰ Trial expires in {licenseState.trialRemainingDays} day(s). Upgrade to continue!
          </Text>
          <TouchableOpacity onPress={handleUpgrade}>
            <Text style={styles.upgradeLink}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
        {children}
      </View>
    );
  }

  // Valid license - render app
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  wrapper: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  messageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  trialButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 200,
  },
  trialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 200,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  warningBanner: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f59e0b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    flex: 1,
  },
  upgradeLink: {
    fontSize: 14,
    color: '#1d4ed8',
    fontWeight: 'bold',
  },
});
