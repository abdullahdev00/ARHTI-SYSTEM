import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// import { useAdminAuth } from '../../contexts/AdminAuthContext'; // Disabled
import { supabase } from '../../config/supabase';
import { AdminStats } from '../../types';

interface DashboardScreenProps {
  onNavigateToUsers?: () => void;
  onNavigateToPayments?: () => void;
}

export default function DashboardScreen({ onNavigateToUsers, onNavigateToPayments }: DashboardScreenProps) {
  // Auth disabled - using mock admin profile
  const adminProfile = { name: 'Admin User' };
  const signOut = () => console.log('Sign out disabled');
  const [stats, setStats] = useState<AdminStats>({
    total_users: 0,
    active_subscriptions: 0,
    pending_payments: 0,
    monthly_revenue: 0,
    trial_users: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Get user statistics from Supabase
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('subscription_status, subscription_plan, created_at');

      if (usersError) throw usersError;

      if (users) {
        const totalUsers = users.length;
        const activeSubscriptions = users.filter(u => u.subscription_status === 'active').length;
        const trialUsers = users.filter(u => u.subscription_status === 'trial').length;
        
        setStats({
          total_users: totalUsers,
          active_subscriptions: activeSubscriptions,
          pending_payments: 0, // TODO: Implement payment requests table
          monthly_revenue: activeSubscriptions * 999, // Approximate
          trial_users: trialUsers,
        });
      }
    } catch (error: any) {
      console.error('Error loading stats:', error);
      Alert.alert('Error', 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: signOut, style: 'destructive' }
      ]
    );
  };

  const StatCard = ({ title, value, icon, color, subtitle }: {
    title: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    subtitle?: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const QuickAction = ({ title, icon, onPress, color }: {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    color: string;
  }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadStats} />
        }
      >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.adminName}>{adminProfile?.name || 'Admin'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Total Users"
          value={stats.total_users}
          icon="people-outline"
          color="#2563eb"
        />
        <StatCard
          title="Active Plans"
          value={stats.active_subscriptions}
          icon="checkmark-circle-outline"
          color="#059669"
        />
        <StatCard
          title="Trial Users"
          value={stats.trial_users}
          icon="time-outline"
          color="#d97706"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₨${stats.monthly_revenue.toLocaleString()}`}
          icon="trending-up-outline"
          color="#7c3aed"
          subtitle="Approximate"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            title="Manage Users"
            icon="people-outline"
            color="#2563eb"
            onPress={() => onNavigateToUsers && onNavigateToUsers()}
          />
          <QuickAction
            title="Payment Requests"
            icon="card-outline"
            color="#059669"
            onPress={() => onNavigateToPayments && onNavigateToPayments()}
          />
          <QuickAction
            title="Subscription Plans"
            icon="pricetag-outline"
            color="#d97706"
            onPress={() => {/* Navigate to plans */}}
          />
          <QuickAction
            title="Reports"
            icon="analytics-outline"
            color="#7c3aed"
            onPress={() => {/* Navigate to reports */}}
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <Text style={styles.activityText}>
            No recent activity to display
          </Text>
          <Text style={styles.activitySubtext}>
            User activities will appear here
          </Text>
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748b',
  },
  adminName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    padding: 24,
    gap: 16,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statTitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  section: {
    padding: 24,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  activitySubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
