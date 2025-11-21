import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/SupabaseAuthContext';
import PaymentService from '../services/paymentService';
import type { PaymentRequest } from '../types/payment';

interface PaymentPendingScreenParams {
  paymentRequest: PaymentRequest;
}

export function PaymentPendingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { currentUser, logout, refreshUserProfile } = useAuth();
  const params = route.params as PaymentPendingScreenParams | undefined;
  const { paymentRequest: initialPaymentRequest } = params || {};

  // Handle case where paymentRequest is not provided
  if (!initialPaymentRequest) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Payment request not found</Text>
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

  // Ensure paymentRequest has required properties
  if (!initialPaymentRequest.id || !initialPaymentRequest.amount) {
    console.error('Invalid payment request data:', initialPaymentRequest);
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Invalid payment request data</Text>
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
  
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest>(initialPaymentRequest);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [verificationShown, setVerificationShown] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Debug initial payment request
  useEffect(() => {
    console.log('Initial payment request:', JSON.stringify(initialPaymentRequest, null, 2));
  }, []);

  // Calculate time remaining until expiry
  useEffect(() => {
    const updateTimeRemaining = () => {
      if (!paymentRequest.expires_at) {
        setTimeRemaining('Expiry date not available');
        return;
      }
      
      const expiryDate = new Date(paymentRequest.expires_at);
      const now = new Date();
      const diffMs = expiryDate.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setTimeRemaining('Expired');
        return;
      }
      
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        setTimeRemaining(`${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}`);
      } else {
        setTimeRemaining(`${minutes} minute${minutes > 1 ? 's' : ''}`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [paymentRequest.expires_at]);

  // Navigate to dashboard smoothly
  const navigateToDashboard = async () => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    try {
      await refreshUserProfile();
      // Navigate to main app
      (navigation as any).reset({
        index: 0,
        routes: [{ name: 'MainNavigator' }],
      });
    } catch (error) {
      console.error('Error navigating to dashboard:', error);
      setIsNavigating(false);
    }
  };

  // Check payment status periodically
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!paymentRequest || !paymentRequest.id) {
        console.error('Invalid payment request for status check');
        return;
      }
      
      try {
        const { data, error } = await PaymentService.getPaymentRequest(paymentRequest.id);
        
        if (!error && data) {
          console.log('Payment request data:', JSON.stringify(data, null, 2));
          setPaymentRequest(data);
          
          // If payment is verified and we haven't shown verification yet
          if (data.status === 'verified' && !verificationShown) {
            setVerificationShown(true);
          } else if (data.status === 'rejected' && !verificationShown) {
            setVerificationShown(true);
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    // Only check if not verified yet
    if (paymentRequest && paymentRequest.status !== 'verified') {
      // Check immediately
      checkPaymentStatus();
      
      // Then check every 30 seconds
      const interval = setInterval(checkPaymentStatus, 30000);

      return () => clearInterval(interval);
    }
  }, [paymentRequest?.id, paymentRequest?.status, navigation, refreshUserProfile, verificationShown]);

  // Prevent back navigation only when payment is not verified
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (paymentRequest && paymentRequest.status === 'verified') {
          // Allow navigation to dashboard
          navigateToDashboard();
          return true;
        }
        
        Alert.alert(
          'Payment Pending',
          'Your payment is being verified. You cannot go back at this time. Please wait for verification to complete.',
          [{ text: 'OK' }]
        );
        return true; // Prevent default behavior
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [paymentRequest?.status])
  );

  const handleRefreshStatus = async () => {
    if (!paymentRequest || !paymentRequest.id) {
      Alert.alert('Error', 'Invalid payment request');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await PaymentService.getPaymentRequest(paymentRequest.id);
      
      if (!error && data) {
        setPaymentRequest(data);
        
        if (data.status === 'verified' && !verificationShown) {
          setVerificationShown(true);
        }
      }
    } catch (error) {
      console.error('Error refreshing payment status:', error);
      Alert.alert('Error', 'Failed to refresh payment status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      case 'submitted':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Payment Pending';
      case 'submitted':
        return 'Payment Submitted';
      case 'verified':
        return 'Payment Verified';
      case 'rejected':
        return 'Payment Rejected';
      case 'expired':
        return 'Payment Expired';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Please complete your payment and submit the details.';
      case 'submitted':
        return 'We have received your payment details and are verifying the transaction. This usually takes 1-24 hours.';
      case 'verified':
        return 'Your payment has been verified successfully! Your account is now active.';
      case 'rejected':
        return 'Your payment was rejected. Please check the details and try again.';
      case 'expired':
        return 'This payment request has expired. Please create a new payment request.';
      default:
        return 'Please wait while we process your payment.';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
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
        <Text style={styles.headerTitle}>Payment Status</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefreshStatus}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <Ionicons name="refresh" size={20} color="#2563eb" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIcon, { backgroundColor: getStatusColor(paymentRequest?.status || 'pending') + '20' }]}>
            <Ionicons
              name={
                paymentRequest && paymentRequest.status === 'verified'
                  ? 'checkmark-circle'
                  : paymentRequest && paymentRequest.status === 'rejected'
                  ? 'close-circle'
                  : paymentRequest && paymentRequest.status === 'submitted'
                  ? 'time'
                  : 'hourglass'
              }
              size={48}
              color={getStatusColor(paymentRequest?.status || 'pending')}
            />
          </View>
          
          <Text style={styles.statusTitle}>{getStatusText(paymentRequest?.status || 'pending')}</Text>
          <Text style={styles.statusDescription}>{getStatusDescription(paymentRequest?.status || 'pending')}</Text>
          
          {paymentRequest && paymentRequest.status === 'submitted' && (
            <View style={styles.timeRemainingContainer}>
              <Ionicons name="time-outline" size={16} color="#64748b" />
              <Text style={styles.timeRemainingText}>
                Verification deadline: {timeRemaining}
              </Text>
            </View>
          )}
          
          {/* Continue Button for Verified Payments */}
          {paymentRequest && paymentRequest.status === 'verified' && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={navigateToDashboard}
              disabled={isNavigating}
            >
              {isNavigating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                  <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          {/* Rejection Status */}
          {paymentRequest && paymentRequest.status === 'rejected' && (
            <View style={styles.rejectionSection}>
              {paymentRequest.rejection_reason && (
                <View style={styles.rejectionReasonContainer}>
                  <View style={styles.rejectionReasonHeader}>
                    <Ionicons name="information-circle" size={20} color="#ef4444" />
                    <Text style={styles.rejectionReasonLabel}>Rejection Reason</Text>
                  </View>
                  <Text style={styles.rejectionReasonText}>{paymentRequest.rejection_reason}</Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.tryAgainButton}
                onPress={() => navigation.navigate('PricingScreen' as never)}
              >
                <Ionicons name="refresh" size={20} color="#2563eb" />
                <Text style={styles.tryAgainButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payment Details */}
        <View style={styles.paymentDetails}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plan:</Text>
            <Text style={styles.detailValue}>
              {paymentRequest && paymentRequest.plan && paymentRequest.plan.name 
                ? paymentRequest.plan.name 
                : 'Plan information not available'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>
              {paymentRequest && paymentRequest.amount 
                ? PaymentService.formatCurrency(paymentRequest.amount) 
                : 'Amount not available'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Request Date:</Text>
            <Text style={styles.detailValue}>
              {paymentRequest && paymentRequest.created_at 
                ? new Date(paymentRequest.created_at).toLocaleDateString() 
                : 'Date not available'}
            </Text>
          </View>
          
          {paymentRequest && paymentRequest.payment_date && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Date:</Text>
              <Text style={styles.detailValue}>
                {new Date(paymentRequest.payment_date).toLocaleDateString()}
              </Text>
            </View>
          )}
          
          {paymentRequest && paymentRequest.user_bank_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Your Bank:</Text>
              <Text style={styles.detailValue}>{paymentRequest.user_bank_name}</Text>
            </View>
          )}
          
          {paymentRequest && paymentRequest.transaction_reference && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference:</Text>
              <Text style={styles.detailValue}>{paymentRequest.transaction_reference}</Text>
            </View>
          )}
        </View>

        {/* Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#2563eb" />
            <Text style={styles.infoTitle}>What happens next?</Text>
          </View>
          
          <View style={styles.infoContent}>
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Our team will verify your payment within 1-24 hours
              </Text>
            </View>
            
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                You'll receive a notification once verification is complete
              </Text>
            </View>
            
            <View style={styles.infoStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Your account will be activated and you can start using all features
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Support */}
        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>Need Help?</Text>
          <Text style={styles.supportText}>
            If you have any questions about your payment or need assistance, please contact our support team.
          </Text>
          <TouchableOpacity style={styles.supportButton}>
            <Ionicons name="mail" size={20} color="#2563eb" />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  placeholder: {
    width: 24,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  refreshButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  statusCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  timeRemainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  timeRemainingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  paymentDetails: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  infoCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 12,
  },
  infoContent: {
    gap: 16,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  stepText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
    lineHeight: 20,
  },
  supportCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
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
  backButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  rejectionSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rejectionReasonContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  rejectionReasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  rejectionReasonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  rejectionReasonText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  tryAgainButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentPendingScreen;
