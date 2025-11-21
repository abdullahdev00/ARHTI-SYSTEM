import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import AdminAuthScreen from '../screens/auth/AdminAuthScreen';

interface AdminRouteGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  fallbackComponent?: React.ComponentType;
}

export default function AdminRouteGuard({ 
  children, 
  requiredPermission,
  fallbackComponent: FallbackComponent 
}: AdminRouteGuardProps) {
  const { currentAdmin, loading, isAuthenticated, hasPermission } = useAdminAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  // Show auth screen (login/signup) if not authenticated
  if (!isAuthenticated) {
    return <AdminAuthScreen />;
  }

  // Check if admin account is active
  if (!currentAdmin?.is_active) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Account Disabled</Text>
        <Text style={styles.errorMessage}>
          Your admin account has been disabled. Please contact the super administrator.
        </Text>
      </View>
    );
  }

  // Check required permission if specified
  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorMessage}>
          You don't have permission to access this feature.
        </Text>
        <Text style={styles.permissionText}>
          Required permission: {requiredPermission}
        </Text>
      </View>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
