import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/SupabaseAuthContext';

const MoreScreen: React.FC = () => {
  const navigation = useNavigation();
  const { logout, userProfile } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const menuItems = [
    { title: 'Payments', icon: 'card', screen: 'Payments', color: '#10b981' },
    { title: 'Charges', icon: 'receipt', screen: 'Charges', color: '#f59e0b' },
    { title: 'Reports', icon: 'bar-chart', screen: 'Reports', color: '#ef4444' },
    { title: 'Settings', icon: 'settings', screen: 'Settings', color: '#64748b' },
    { title: '🔍 WatermelonDB Debug', icon: 'bug', screen: 'DebugWatermelon', color: '#8b5cf6' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* User Profile Section */}
      <TouchableOpacity
        style={styles.profileContainer}
        onPress={() => navigation.navigate('ProfileScreen' as never)}
      >
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={24} color="#2563eb" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userProfile?.name || 'User'}</Text>
            <View style={[
              styles.subscriptionBadge,
              userProfile?.subscription_status === 'active'
                ? styles.activeBadge
                : styles.trialBadge
            ]}>
              <Text style={[
                styles.subscriptionText,
                userProfile?.subscription_status === 'active'
                  ? styles.activeText
                  : styles.trialText
              ]}>
                {userProfile?.subscription_status === 'active' ? 'ACTIVE PLAN' : 'TRIAL MODE'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </View>
      </TouchableOpacity>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen as never)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>
                {item.title === 'Payments' && 'Track patners payments'}
                {item.title === 'Charges' && 'Manage business charges'}
                {item.title === 'Reports' && 'Business analytics'}
                {item.title === 'Settings' && 'App preferences'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        ))}
      </View>


      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  menuContainer: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  profileContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#dbeafe',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subscriptionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  activeBadge: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  trialBadge: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  subscriptionText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activeText: {
    color: '#15803d',
  },
  trialText: {
    color: '#d97706',
  },
  logoutContainer: {
    padding: 16,
    paddingTop: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});

export default MoreScreen;
