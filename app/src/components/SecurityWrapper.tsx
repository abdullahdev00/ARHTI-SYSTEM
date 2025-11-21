import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SecurityManager, SECURITY_CONFIG } from '../utils/security';

interface SecurityWrapperProps {
  children: React.ReactNode;
}

export const SecurityWrapper: React.FC<SecurityWrapperProps> = ({ children }) => {
  const [isSecure, setIsSecure] = useState<boolean | null>(null);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);

  useEffect(() => {
    checkSecurity();
  }, []);

  const checkSecurity = async () => {
    try {
      // Check environment security
      const envCheck = SecurityManager.checkEnvironment();
      
      // Check app integrity
      const integrityCheck = await SecurityManager.checkIntegrity();

      // Determine if app should continue
      const shouldBlock = SECURITY_CONFIG.REQUIRE_PRODUCTION && !envCheck.isSecure;

      if (shouldBlock) {
        Alert.alert(
          'Security Warning',
          'This app cannot run in the current environment for security reasons.',
          [{ text: 'OK', onPress: () => {} }]
        );
        setIsSecure(false);
        return;
      }

      // Show warnings in development
      if (envCheck.warnings.length > 0 && __DEV__) {
        console.warn('Security Warnings:', envCheck.warnings);
        setSecurityWarnings(envCheck.warnings);
      }

      setIsSecure(true);
    } catch (error) {
      console.error('Security check failed:', error);
      setIsSecure(false);
    }
  };

  // Loading state
  if (isSecure === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Initializing security checks...</Text>
      </View>
    );
  }

  // Security failed
  if (!isSecure) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Security validation failed</Text>
        <Text style={styles.errorSubtext}>
          This app cannot run in the current environment
        </Text>
      </View>
    );
  }

  // Show warnings in development
  if (securityWarnings.length > 0 && __DEV__) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ Dev Mode: {securityWarnings.length} security warning(s)
          </Text>
        </View>
        {children}
      </View>
    );
  }

  // All good, render children
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
  },
  warningBanner: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ffeaa7',
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
});
