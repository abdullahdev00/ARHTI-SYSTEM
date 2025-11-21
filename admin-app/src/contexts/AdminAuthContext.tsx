import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminAuthService, AdminUser, AdminLoginCredentials } from '../services/adminAuthService';

interface AdminAuthContextType {
  currentAdmin: AdminUser | null;
  loading: boolean;
  signIn: (credentials: AdminLoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  refreshAuth: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({} as AdminAuthContextType);

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    initializeAuth();
    
    // Clean expired sessions periodically
    const cleanupInterval = setInterval(() => {
      AdminAuthService.cleanExpiredSessions();
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(cleanupInterval);
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      const admin = await AdminAuthService.getCurrentAdmin();
      setCurrentAdmin(admin);
    } catch (error) {
      console.error('Error initializing admin auth:', error);
      setCurrentAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (credentials: AdminLoginCredentials) => {
    try {
      setLoading(true);
      const response = await AdminAuthService.login(credentials);
      setCurrentAdmin(response.admin_user);
    } catch (error) {
      console.error('Admin sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await AdminAuthService.logout();
      setCurrentAdmin(null);
    } catch (error) {
      console.error('Admin sign out error:', error);
      // Still clear state even if logout fails
      setCurrentAdmin(null);
    }
  };

  const refreshAuth = async () => {
    await initializeAuth();
  };

  const hasPermission = (permission: string): boolean => {
    if (!currentAdmin) return false;
    return AdminAuthService.hasPermission(currentAdmin, permission);
  };

  const isAuthenticated = currentAdmin !== null;

  const value = {
    currentAdmin,
    loading,
    signIn,
    signOut,
    isAuthenticated,
    hasPermission,
    refreshAuth,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}
