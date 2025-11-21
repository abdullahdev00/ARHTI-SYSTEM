import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Clipboard,
  ToastAndroid,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/SupabaseAuthContext';
import PaymentService from '../services/paymentService';
import type { PaymentRequest, UpdatePaymentRequestData, PricingPlan, CreatePaymentRequestData } from '../types/payment';

interface PaymentScreenParams {
  paymentRequest?: PaymentRequest;
  selectedPlan?: PricingPlan;
}

export function PaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { currentUser, logout } = useAuth();
  const params = route.params as PaymentScreenParams | undefined;
  const { paymentRequest, selectedPlan } = params || {};

  // Handle case where neither paymentRequest nor selectedPlan is provided
  if (!paymentRequest && !selectedPlan) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No payment information found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  const [loading, setLoading] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [formData, setFormData] = useState({
    user_bank_name: '',
    user_account_number: '',
    user_account_name: '',
    transaction_reference: '',
    payment_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  });

  // Load payment accounts if we don't have payment request
  useEffect(() => {
    const loadPaymentAccounts = async () => {
      if (!paymentRequest) {
        try {
          setLoadingAccounts(true);
          const { data, error } = await PaymentService.getPaymentAccounts();
          if (!error && data) {
            setPaymentAccounts(data);
          }
        } catch (error) {
          console.error('Error loading payment accounts:', error);
        } finally {
          setLoadingAccounts(false);
        }
      } else {
        setLoadingAccounts(false);
      }
    };

    loadPaymentAccounts();
  }, [paymentRequest]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setString(text);
      if (Platform.OS === 'android') {
        ToastAndroid.show(`${label} copied to clipboard`, ToastAndroid.SHORT);
      } else {
        Alert.alert('Copied', `${label} copied to clipboard`);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleSubmitPayment = async () => {
    // Validate required fields
    if (!formData.user_bank_name.trim()) {
      Alert.alert('Missing Information', 'Please enter your bank name');
      return;
    }
    if (!formData.user_account_number.trim()) {
      Alert.alert('Missing Information', 'Please enter your account number');
      return;
    }
    if (!formData.user_account_name.trim()) {
      Alert.alert('Missing Information', 'Please enter your account name');
      return;
    }
    if (!formData.payment_date.trim()) {
      Alert.alert('Missing Information', 'Please enter the payment date');
      return;
    }

    setLoading(true);

    try {
      let finalPaymentRequest: PaymentRequest;

      if (paymentRequest) {
        // Update existing payment request
        const paymentData: UpdatePaymentRequestData = {
          user_bank_name: formData.user_bank_name.trim(),
          user_account_number: formData.user_account_number.trim(),
          user_account_name: formData.user_account_name.trim(),
          transaction_reference: formData.transaction_reference.trim(),
          payment_date: formData.payment_date,
          status: 'submitted',
        };

        const { data, error } = await PaymentService.submitPaymentDetails(
          paymentRequest.id,
          paymentData
        );

        if (error || !data) {
          throw new Error('Failed to submit payment details');
        }

        finalPaymentRequest = data;
      } else if (selectedPlan && currentUser) {
        // Get payment accounts first
        const { data: paymentAccounts, error: accountsError } = await PaymentService.getPaymentAccounts();
        
        if (accountsError || !paymentAccounts || paymentAccounts.length === 0) {
          throw new Error('No payment accounts available');
        }

        // Create new payment request with submitted details
        const requestData: CreatePaymentRequestData = {
          plan_id: selectedPlan.id,
          amount: selectedPlan.discounted_price,
          payment_account_id: paymentAccounts[0].id, // Use first available account
        };

        const { data: newPaymentRequest, error: createError } = await PaymentService.createPaymentRequest(
          currentUser.id,
          requestData
        );

        if (createError || !newPaymentRequest) {
          throw new Error('Failed to create payment request');
        }

        // Submit payment details
        const paymentData: UpdatePaymentRequestData = {
          user_bank_name: formData.user_bank_name.trim(),
          user_account_number: formData.user_account_number.trim(),
          user_account_name: formData.user_account_name.trim(),
          transaction_reference: formData.transaction_reference.trim(),
          payment_date: formData.payment_date,
          status: 'submitted',
        };

        const { data: updatedRequest, error: updateError } = await PaymentService.submitPaymentDetails(
          newPaymentRequest.id,
          paymentData
        );

        if (updateError || !updatedRequest) {
          throw new Error('Failed to submit payment details');
        }

        finalPaymentRequest = updatedRequest;
      } else {
        throw new Error('No payment information available');
      }

      Alert.alert(
        'Payment Submitted',
        'Your payment details have been submitted for verification. You will be notified once the payment is verified.',
        [
          {
            text: 'OK',
            onPress: () => {
              (navigation as any).navigate('PaymentPendingScreen', {
                paymentRequest: finalPaymentRequest,
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting payment:', error);
      Alert.alert('Error', 'Failed to submit payment details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    Alert.alert(
      'Cancel Payment',
      'Are you sure you want to cancel this payment? You can continue later.',
      [
        { text: 'Continue Payment', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={async () => {
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
                      Alert.alert('Error', 'Failed to sign out. Please try again.');
                    }
                  }
                }
              ]
            );
          }}
        >
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Plan Summary */}
        <View style={styles.planSummary}>
          <View style={styles.planHeader}>
            <Ionicons name="receipt-outline" size={24} color="#2563eb" />
            <Text style={styles.planTitle}>Payment Summary</Text>
          </View>
          
          <View style={styles.planDetails}>
            <Text style={styles.planName}>
              {paymentRequest?.plan?.name || selectedPlan?.name || 'Plan information not available'}
            </Text>
            <Text style={styles.planDescription}>
              {paymentRequest?.plan?.description || selectedPlan?.description || 'Plan description not available'}
            </Text>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Amount to Pay:</Text>
              <Text style={styles.amount}>
                {PaymentService.formatCurrency(paymentRequest?.amount || selectedPlan?.discounted_price || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Bank Details */}
        <View style={styles.bankDetails}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={24} color="#2563eb" />
            <Text style={styles.sectionTitle}>Bank Transfer Details</Text>
          </View>
          
          <Text style={styles.instructionText}>
            Please transfer the amount to the following bank account:
          </Text>

          {loadingAccounts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.loadingText}>Loading bank details...</Text>
            </View>
          ) : (
            <View style={styles.bankInfo}>
              {(() => {
                const account = paymentRequest?.payment_account || paymentAccounts[0];
                if (!account) {
                  return (
                    <Text style={styles.errorText}>Bank details not available</Text>
                  );
                }
                
                return (
                  <>
                    <View style={styles.bankRow}>
                      <Text style={styles.bankLabel}>Account Name:</Text>
                      <View style={styles.bankValueContainer}>
                        <Text style={styles.bankValue}>
                          {account.account_name || 'Not available'}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            copyToClipboard(
                              account.account_name || '',
                              'Account Name'
                            )
                          }
                        >
                          <Ionicons name="copy-outline" size={20} color="#2563eb" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.bankRow}>
                      <Text style={styles.bankLabel}>Bank Name:</Text>
                      <View style={styles.bankValueContainer}>
                        <Text style={styles.bankValue}>
                          {account.bank_name || 'Not available'}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            copyToClipboard(
                              account.bank_name || '',
                              'Bank Name'
                            )
                          }
                        >
                          <Ionicons name="copy-outline" size={20} color="#2563eb" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {account.account_number && (
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Account Number:</Text>
                        <View style={styles.bankValueContainer}>
                          <Text style={styles.bankValue}>
                            {account.account_number}
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              copyToClipboard(
                                account.account_number,
                                'Account Number'
                              )
                            }
                          >
                            <Ionicons name="copy-outline" size={20} color="#2563eb" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {account.ifsc_code && (
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>IFSC Code:</Text>
                        <View style={styles.bankValueContainer}>
                          <Text style={styles.bankValue}>
                            {account.ifsc_code}
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              copyToClipboard(
                                account.ifsc_code,
                                'IFSC Code'
                              )
                            }
                          >
                            <Ionicons name="copy-outline" size={20} color="#2563eb" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </>
                );
              })()}
            </View>
          )}
        </View>

        {/* Payment Form */}
        <View style={styles.paymentForm}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={24} color="#2563eb" />
            <Text style={styles.sectionTitle}>Payment Confirmation</Text>
          </View>
          
          <Text style={styles.formInstructionText}>
            After making the payment, please fill in the details below:
          </Text>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Your Bank Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your bank name"
              value={formData.user_bank_name}
              onChangeText={(text) =>
                setFormData(prev => ({ ...prev, user_bank_name: text }))
              }
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Your Account Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your account number"
              value={formData.user_account_number}
              onChangeText={(text) =>
                setFormData(prev => ({ ...prev, user_account_number: text }))
              }
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Your Account Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your account name"
              value={formData.user_account_name}
              onChangeText={(text) =>
                setFormData(prev => ({ ...prev, user_account_name: text }))
              }
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Transaction Reference (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter transaction reference if available"
              value={formData.transaction_reference}
              onChangeText={(text) =>
                setFormData(prev => ({ ...prev, transaction_reference: text }))
              }
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Payment Date *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="YYYY-MM-DD"
              value={formData.payment_date}
              onChangeText={(text) =>
                setFormData(prev => ({ ...prev, payment_date: text }))
              }
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmitPayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.submitButtonText}>Submit Payment Details</Text>
              </>
            )}
          </TouchableOpacity>
          
          <Text style={styles.submitNote}>
            We will verify your payment within 1-24 hours and activate your account.
          </Text>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  placeholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  planSummary: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 12,
  },
  planDetails: {
    gap: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  planDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  bankDetails: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  bankInfo: {
    gap: 16,
  },
  bankRow: {
    gap: 8,
  },
  bankLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  bankValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bankValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    flex: 1,
  },
  paymentForm: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formInstructionText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 20,
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  submitSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submitNote: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },
});

export default PaymentScreen;
