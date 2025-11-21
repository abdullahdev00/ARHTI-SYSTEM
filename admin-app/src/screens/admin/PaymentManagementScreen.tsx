import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../config/supabase';
import SubscriptionService from '../../services/subscriptionService';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import AdminRouteGuard from '../../components/AdminRouteGuard';

interface PaymentRequest {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  status: 'pending' | 'submitted' | 'verified' | 'rejected' | 'expired';
  user_bank_name?: string;
  user_account_number?: string;
  user_account_name?: string;
  transaction_reference?: string;
  payment_date?: string;
  created_at: string;
  expires_at: string;
  rejection_reason?: string;
  verified_at?: string;
  rejected_at?: string;
  admin_notes?: string;
  // Related data
  user_profiles?: {
    name: string;
    email: string;
    phone_number?: string;
  };
  pricing_plans?: {
    name: string;
    duration_months: number;
  };
  payment_accounts?: {
    account_name: string;
    bank_name: string;
    account_number: string;
  };
}

export function PaymentManagementScreen() {
  const insets = useSafeAreaInsets();
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPaymentRequests();
  }, [selectedStatus]);

  const loadPaymentRequests = async () => {
    try {
      setLoading(true);
      
      // First, get payment requests
      let paymentQuery = supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedStatus !== 'all') {
        paymentQuery = paymentQuery.eq('status', selectedStatus);
      }

      const { data: paymentData, error: paymentError } = await paymentQuery;

      if (paymentError) {
        console.error('Error loading payment requests:', paymentError);
        if (paymentError.code === '42P01') {
          Alert.alert('Database Error', 'Payment requests table does not exist. Please run the database setup first.');
        } else {
          Alert.alert('Error', `Failed to load payment requests: ${paymentError.message}`);
        }
        return;
      }

      if (!paymentData || paymentData.length === 0) {
        setPaymentRequests([]);
        return;
      }

      // Get related data
      const userIds = [...new Set(paymentData.map(p => p.user_id).filter(Boolean))];
      const planIds = [...new Set(paymentData.map(p => p.plan_id).filter(Boolean))];
      const accountIds = [...new Set(paymentData.map(p => p.payment_account_id).filter(Boolean))];

      // Fetch related data in parallel
      const [usersResult, plansResult, accountsResult] = await Promise.all([
        userIds.length > 0 ? supabase.from('user_profiles').select('id, name, email, phone_number').in('id', userIds) : { data: [], error: null },
        planIds.length > 0 ? supabase.from('pricing_plans').select('id, name, duration_months').in('id', planIds) : { data: [], error: null },
        accountIds.length > 0 ? supabase.from('payment_accounts').select('id, account_name, bank_name, account_number').in('id', accountIds) : { data: [], error: null }
      ]);

      // Log errors for debugging
      if (usersResult.error) console.error('Users fetch error:', usersResult.error);
      if (plansResult.error) console.error('Plans fetch error:', plansResult.error);
      if (accountsResult.error) console.error('Accounts fetch error:', accountsResult.error);

      // Create lookup maps
      const usersMap = new Map((usersResult.data || []).map(u => [u.id, u]));
      const plansMap = new Map((plansResult.data || []).map(p => [p.id, p]));
      const accountsMap = new Map((accountsResult.data || []).map(a => [a.id, a]));

      // Combine data
      const enrichedData = paymentData.map(payment => ({
        ...payment,
        user_profiles: usersMap.get(payment.user_id) || null,
        pricing_plans: plansMap.get(payment.plan_id) || null,
        payment_accounts: accountsMap.get(payment.payment_account_id) || null,
      }));

      // Debug logging
      console.log('Payment data count:', paymentData.length);
      console.log('Users found:', usersResult.data?.length || 0);
      console.log('Plans found:', plansResult.data?.length || 0);
      console.log('Accounts found:', accountsResult.data?.length || 0);
      
      // Log missing user profiles
      const missingUsers = enrichedData.filter(p => !p.user_profiles);
      if (missingUsers.length > 0) {
        console.log('Payments with missing user profiles:', missingUsers.map(p => ({ id: p.id, user_id: p.user_id })));
      }

      setPaymentRequests(enrichedData);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPaymentRequests();
  };

  const testDatabaseSetup = async () => {
    try {
      setLoading(true);
      
      // Test each table
      const tests = [
        { name: 'payment_requests', query: supabase.from('payment_requests').select('count', { count: 'exact', head: true }) },
        { name: 'user_profiles', query: supabase.from('user_profiles').select('count', { count: 'exact', head: true }) },
        { name: 'pricing_plans', query: supabase.from('pricing_plans').select('count', { count: 'exact', head: true }) },
        { name: 'payment_accounts', query: supabase.from('payment_accounts').select('count', { count: 'exact', head: true }) }
      ];

      const results = [];
      for (const test of tests) {
        try {
          const { count, error } = await test.query;
          if (error) {
            results.push(`❌ ${test.name}: ${error.message}`);
          } else {
            results.push(`✅ ${test.name}: ${count || 0} records`);
          }
        } catch (err) {
          results.push(`❌ ${test.name}: Connection failed`);
        }
      }

      Alert.alert('Database Status', results.join('\n'));
    } catch (error) {
      Alert.alert('Test Failed', 'Could not test database connection');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (requestId: string) => {
    const request = paymentRequests.find(r => r.id === requestId);
    const userName = request?.user_profiles?.name || 'Unknown User';
    const amount = request?.amount || 0;

    Alert.alert(
      'Verify Payment',
      `Are you sure you want to verify payment of Rs. ${amount.toLocaleString()} for ${userName}?\n\nThis will activate their subscription immediately.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Verify',
          style: 'default',
          onPress: async () => {
            try {
              setActionLoading(true);

              if (!request) {
                throw new Error('Payment request not found');
              }

              // Calculate subscription dates
              const now = new Date();
              const durationMonths = request.pricing_plans?.duration_months || 1;
              const subscriptionEndDate = SubscriptionService.calculateSubscriptionEndDate(now, durationMonths);

              // Update payment request status
              await SubscriptionService.updatePaymentRequest(
                requestId,
                'verified'
              );

              // Activate subscription
              await SubscriptionService.activateSubscription({
                userId: request.user_id,
                planId: request.plan_id,
                planName: request.pricing_plans?.name || 'Unknown Plan',
                durationMonths,
                startDate: now,
                endDate: subscriptionEndDate,
                amount: request.amount,
                paymentRequestId: requestId,
              });

              Alert.alert('Success', 'Payment verified successfully');
              setModalVisible(false);
              loadPaymentRequests();
            } catch (error) {
              console.error('Error verifying payment:', error);
              Alert.alert('Error', 'Failed to verify payment');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const rejectPayment = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    const request = paymentRequests.find(r => r.id === requestId);
    const userName = request?.user_profiles?.name || 'Unknown User';
    const amount = request?.amount || 0;

    Alert.alert(
      'Reject Payment',
      `Are you sure you want to reject payment of Rs. ${amount.toLocaleString()} for ${userName}?\n\nReason: ${rejectionReason}\n\nThis action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);

              if (!request) {
                throw new Error('Payment request not found');
              }

              const now = new Date();

              // Update payment request status
              await SubscriptionService.updatePaymentRequest(
                requestId,
                'rejected',
                undefined,
                rejectionReason
              );

              // Deactivate subscription
              await SubscriptionService.deactivateSubscription(request.user_id);

              Alert.alert('Success', 'Payment rejected');
              setModalVisible(false);
              setRejectionReason('');
              loadPaymentRequests();
            } catch (error) {
              console.error('Error rejecting payment:', error);
              Alert.alert('Error', (error as Error).message || 'Failed to reject payment');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'submitted': return '#3b82f6';
      case 'verified': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'expired': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'submitted': return 'document-text-outline';
      case 'verified': return 'checkmark-circle-outline';
      case 'rejected': return 'close-circle-outline';
      case 'expired': return 'alert-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderPaymentRequest = ({ item }: { item: PaymentRequest }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => {
        setSelectedRequest(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.requestHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.user_profiles?.name || item.user_profiles?.email || `User ID: ${item.user_id?.slice(0, 8)}...` || 'Unknown User'}
          </Text>
          <Text style={styles.userEmail}>
            {item.user_profiles?.email || 'No email available'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons name={getStatusIcon(item.status)} size={16} color="white" />
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Plan:</Text>
          <Text style={styles.detailValue}>{item.pricing_plans?.name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.amount)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailValue}>{formatDate(item.created_at)}</Text>
        </View>
        {item.transaction_reference && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ref:</Text>
            <Text style={styles.detailValue}>{item.transaction_reference}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderStatusFilter = () => (
    <View style={styles.filterContainer}>
      {['all', 'submitted', 'pending', 'verified', 'rejected'].map((status) => (
        <TouchableOpacity
          key={status}
          style={[
            styles.filterButton,
            selectedStatus === status && styles.filterButtonActive
          ]}
          onPress={() => setSelectedStatus(status)}
        >
          <Text style={[
            styles.filterButtonText,
            selectedStatus === status && styles.filterButtonTextActive
          ]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payment Management</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={testDatabaseSetup} disabled={loading} style={styles.testButton}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#059669" />
            <Text style={styles.testButtonText}>Test DB</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRefresh} disabled={loading}>
            <Ionicons name="refresh" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </View>

      {renderStatusFilter()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      ) : (
        <FlatList
          data={paymentRequests}
          renderItem={renderPaymentRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyText}>No payment requests found</Text>
            </View>
          }
        />
      )}

      {/* Payment Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedRequest && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* User Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>User Information</Text>
                <Text style={styles.infoText}>
                  Name: {selectedRequest.user_profiles?.name || 'Not available'}
                </Text>
                <Text style={styles.infoText}>
                  Email: {selectedRequest.user_profiles?.email || 'Not available'}
                </Text>
                <Text style={styles.infoText}>
                  User ID: {selectedRequest.user_id}
                </Text>
                {selectedRequest.user_profiles?.phone_number && (
                  <Text style={styles.infoText}>Phone: {selectedRequest.user_profiles.phone_number}</Text>
                )}
              </View>

              {/* Payment Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Information</Text>
                <Text style={styles.infoText}>Plan: {selectedRequest.pricing_plans?.name}</Text>
                <Text style={styles.infoText}>Duration: {selectedRequest.pricing_plans?.duration_months || 1} month(s)</Text>
                <Text style={styles.infoText}>Amount: {formatCurrency(selectedRequest.amount)}</Text>
                <Text style={styles.infoText}>Status: {selectedRequest.status.toUpperCase()}</Text>
                <Text style={styles.infoText}>Created: {formatDate(selectedRequest.created_at)}</Text>
              </View>

              {/* Subscription Details */}
              {selectedRequest.status === 'submitted' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Subscription Preview</Text>
                  <Text style={styles.infoText}>
                    Start Date: {new Date().toLocaleDateString()}
                  </Text>
                  <Text style={styles.infoText}>
                    End Date: {SubscriptionService.calculateSubscriptionEndDate(
                      new Date(), 
                      selectedRequest.pricing_plans?.duration_months || 1
                    ).toLocaleDateString()}
                  </Text>
                  <Text style={styles.infoText}>
                    Duration: {selectedRequest.pricing_plans?.duration_months || 1} month(s)
                  </Text>
                </View>
              )}

              {/* Verification Details */}
              {selectedRequest.status === 'verified' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Verification Details</Text>
                  <Text style={styles.infoText}>
                    Status: Verified by Admin
                  </Text>
                  <Text style={styles.infoText}>
                    Subscription Active: Yes
                  </Text>
                </View>
              )}

              {/* Bank Details */}
              {selectedRequest.user_bank_name && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>User Bank Details</Text>
                  <Text style={styles.infoText}>Bank: {selectedRequest.user_bank_name}</Text>
                  <Text style={styles.infoText}>Account: {selectedRequest.user_account_number}</Text>
                  <Text style={styles.infoText}>Name: {selectedRequest.user_account_name}</Text>
                  <Text style={styles.infoText}>Reference: {selectedRequest.transaction_reference}</Text>
                  {selectedRequest.payment_date && (
                    <Text style={styles.infoText}>Payment Date: {formatDate(selectedRequest.payment_date)}</Text>
                  )}
                </View>
              )}

              {/* Rejection Reason */}
              {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Rejection Reason</Text>
                  <Text style={styles.infoText}>{selectedRequest.rejection_reason}</Text>
                </View>
              )}

              {/* Actions */}
              {selectedRequest.status === 'submitted' && (
                <View style={styles.actionsSection}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.verifyButton]}
                    onPress={() => verifyPayment(selectedRequest.id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="white" />
                        <Text style={styles.actionButtonText}>Verify Payment</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.rejectSection}>
                    <TextInput
                      style={styles.rejectionInput}
                      placeholder="Rejection reason..."
                      value={rejectionReason}
                      onChangeText={setRejectionReason}
                      multiline
                    />
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => rejectPayment(selectedRequest.id)}
                      disabled={actionLoading || !rejectionReason.trim()}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Ionicons name="close-circle" size={20} color="white" />
                          <Text style={styles.actionButtonText}>Reject Payment</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    gap: 4,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  listContainer: {
    padding: 20,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  requestDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  actionsSection: {
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  verifyButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  rejectSection: {
    gap: 12,
  },
  rejectionInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: 'white',
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

// Wrap with permission guard
export default function ProtectedPaymentManagementScreen() {
  return (
    <AdminRouteGuard requiredPermission="manage_payments">
      <PaymentManagementScreen />
    </AdminRouteGuard>
  );
}
