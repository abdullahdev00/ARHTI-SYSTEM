import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthError, AuthResponse } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import SessionManager from '../utils/sessionManager';
import { SubscriptionService, Subscription } from '../services/subscriptionService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  subscription: Subscription | null;
  session: Session | null;
  loading: boolean;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  signInWithGoogle: () => Promise<{ data: any; error: AuthError | null }>;
  hasActiveSubscription: boolean;
  subscriptionPlan: 'monthly' | 'yearly' | null;
  isProfileComplete: boolean;
  checkProfileCompletion: () => boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  subscription_status: 'active' | 'inactive' | 'trial';
  subscription_plan: 'monthly' | 'yearly' | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  payment_status: 'trial' | 'payment_pending' | 'payment_submitted' | 'active' | 'expired' | 'suspended';
  created_at: string;
  updated_at: string;
  // Extended profile information
  company_name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone_number?: string;
  business_type?: string;
  gst_number?: string;
  profile_picture?: string;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  async function signup(email: string, password: string, name: string) {
    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile in Supabase database
        const userProfile: Omit<UserProfile, 'id'> = {
          name: name,
          email: email,
          email_verified: false,
          subscription_status: 'trial',
          subscription_plan: null,
          subscription_start_date: null,
          subscription_end_date: null,
          payment_status: 'trial',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([{ id: data.user.id, ...userProfile }]);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // User profile will be loaded in the auth state change listener
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local state
      setCurrentUser(null);
      setUserProfile(null);
      setSession(null);
      
      // Clear stored session data
      await SessionManager.clearStoredSession();
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async function sendVerificationEmail() {
    if (!currentUser?.email) {
      throw new Error('No user email available');
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: currentUser.email,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Send verification email error:', error);
      throw error;
    }
  }

  async function signInWithGoogle(): Promise<{ data: any; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.arhti.system://auth/callback',
        },
      });

      if (error) throw error;
      return { data, error };
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  async function refreshUserProfile() {
    if (currentUser) {
      await loadUserProfile(currentUser.id);
    }
  }

  async function refreshSubscription() {
    if (currentUser) {
      await loadUserSubscription(currentUser.id);
    }
  }

  async function updateUserProfile(profileData: Partial<UserProfile>) {
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      console.log('Updating user profile:', profileData);
      
      // Update profile in Supabase database
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }

      if (data) {
        console.log('Profile updated successfully:', data);
        // Update local state with new profile data
        setUserProfile(data as UserProfile);
        // Cache the updated profile
        await SessionManager.storeUserProfile(data);
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async function loadUserProfile(userId: string) {
    try {
      // Try to get cached profile first for faster loading
      const cachedProfile = await SessionManager.getStoredUserProfile();
      if (cachedProfile && cachedProfile.id === userId) {
        setUserProfile(cachedProfile);
      }

      // Always fetch fresh data from server
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      if (data) {
        const profile = data as UserProfile;
        setUserProfile(profile);
        // Cache the profile for faster loading next time
        await SessionManager.storeUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async function loadUserSubscription(userId: string) {
    try {
      const subscription = await SubscriptionService.getUserSubscription(userId);
      setSubscription(subscription);
    } catch (error) {
      console.error('Error loading user subscription:', error);
      setSubscription(null);
    }
  }

  // Profile completion check function
  function checkProfileCompletion(): boolean {
    if (!userProfile) return false;
    
    // Required fields for profile completion
    const requiredFields = [
      'name',
      'phone_number',
      'company_name',
      'business_type',
      'address',
      'city',
      'state',
      'pincode'
    ];
    
    return requiredFields.every(field => {
      const value = userProfile[field as keyof UserProfile];
      return value && value.toString().trim().length > 0;
    });
  }

  useEffect(() => {
    let isMounted = true;

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // Debug session information
        await SessionManager.debugSession();
        
        // Validate current session
        const isValidSession = await SessionManager.validateSession();
        
        if (!isValidSession) {
          console.log('No valid session found, user needs to sign in');
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          console.log('Valid session found:', session?.user?.email || 'No session');
          setSession(session);
          setCurrentUser(session?.user ?? null);
          
          if (session?.user) {
            await loadUserProfile(session.user.id);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase auth state change:', event, session?.user?.email || 'No user');
      
      if (isMounted) {
        setSession(session);
        setCurrentUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
          await loadUserSubscription(session.user.id);
        } else {
          setUserProfile(null);
          setSubscription(null);
        }
        
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const hasActiveSubscription = !!(subscription?.status === 'active' && 
    subscription?.payment_status === 'active' &&
    subscription?.end_date && 
    new Date(subscription.end_date) > new Date());

  const isProfileComplete = checkProfileCompletion();

  const value = {
    currentUser,
    userProfile,
    subscription,
    session,
    loading,
    signup,
    login,
    logout,
    sendVerificationEmail,
    refreshUserProfile,
    refreshSubscription,
    updateUserProfile,
    signInWithGoogle,
    hasActiveSubscription,
    subscriptionPlan: subscription?.plan_type || null,
    isProfileComplete,
    checkProfileCompletion
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
