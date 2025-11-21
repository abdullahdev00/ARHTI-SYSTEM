import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { UserProfile } from '../../types';

interface UsersScreenProps {
  onNavigateBack?: () => void;
}

export default function UsersScreen({ onNavigateBack }: UsersScreenProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserSubscription = async (userId: string, status: 'active' | 'inactive' | 'trial', plan?: 'monthly' | 'yearly') => {
    try {
      const updateData: any = {
        subscription_status: status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'active' && plan) {
        updateData.subscription_plan = plan;
        updateData.subscription_start_date = new Date().toISOString();
        
        // Set end date based on plan
        const endDate = new Date();
        if (plan === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }
        updateData.subscription_end_date = endDate.toISOString();
        updateData.payment_status = 'paid';
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      Alert.alert('Success', 'User subscription updated successfully');
      loadUsers();
      setModalVisible(false);
    } catch (error: any) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user subscription');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#059669';
      case 'trial': return '#d97706';
      case 'inactive': return '#dc2626';
      default: return '#64748b';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'trial': return 'Trial';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
  };

  const UserCard = ({ user }: { user: UserProfile }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => {
        setSelectedUser(user);
        setModalVisible(true);
      }}
    >
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{user.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.subscription_status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(user.subscription_status) }]}>
              {getStatusText(user.subscription_status)}
            </Text>
          </View>
        </View>
        <Text style={styles.userEmail}>{user.email}</Text>
        {user.company_name && (
          <Text style={styles.userCompany}>{user.company_name}</Text>
        )}
        <View style={styles.userMeta}>
          <Text style={styles.userDate}>
            Joined: {new Date(user.created_at).toLocaleDateString()}
          </Text>
          {user.subscription_plan && (
            <Text style={styles.userPlan}>
              Plan: {user.subscription_plan}
            </Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );

  const UserDetailModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>User Details</Text>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {selectedUser && (
          <View style={styles.modalContent}>
            <View style={styles.userDetailCard}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>{selectedUser.name}</Text>
            </View>

            <View style={styles.userDetailCard}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{selectedUser.email}</Text>
            </View>

            {selectedUser.company_name && (
              <View style={styles.userDetailCard}>
                <Text style={styles.detailLabel}>Company</Text>
                <Text style={styles.detailValue}>{selectedUser.company_name}</Text>
              </View>
            )}

            <View style={styles.userDetailCard}>
              <Text style={styles.detailLabel}>Current Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedUser.subscription_status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(selectedUser.subscription_status) }]}>
                  {getStatusText(selectedUser.subscription_status)}
                </Text>
              </View>
            </View>

            <View style={styles.actionsContainer}>
              <Text style={styles.actionsTitle}>Update Subscription</Text>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#059669' }]}
                onPress={() => updateUserSubscription(selectedUser.id, 'active', 'monthly')}
              >
                <Text style={styles.actionButtonText}>Activate Monthly Plan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#7c3aed' }]}
                onPress={() => updateUserSubscription(selectedUser.id, 'active', 'yearly')}
              >
                <Text style={styles.actionButtonText}>Activate Yearly Plan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#d97706' }]}
                onPress={() => updateUserSubscription(selectedUser.id, 'trial')}
              >
                <Text style={styles.actionButtonText}>Set to Trial</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#dc2626' }]}
                onPress={() => updateUserSubscription(selectedUser.id, 'inactive')}
              >
                <Text style={styles.actionButtonText}>Deactivate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => onNavigateBack && onNavigateBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2563eb" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Users Management</Text>
            <Text style={styles.subtitle}>{users.length} total users</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UserCard user={item} />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadUsers} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <UserDetailModal />
      </View>
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
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#1e293b',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  userCompany: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  userPlan: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalContent: {
    padding: 24,
  },
  userDetailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: 24,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});
