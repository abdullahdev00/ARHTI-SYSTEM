import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../config/supabase';

interface SubscriptionData {
  id: string;
  status: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  payment_status: string;
  auto_renew: boolean;
  plan_name: string;
  original_price: number;
  discounted_price: number;
  duration_months: number;
  features: string[];
}

interface UserProfile {
  payment_status: string;
  subscription_status: string;
  subscription_plan: string;
  subscription_end_date: string;
}

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchSubscriptionData = async () => {
    if (!currentUser) return;

    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('payment_status, subscription_status, subscription_plan, subscription_end_date')
        .eq('id', currentUser.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profile);

      // Fetch subscription details with plan information
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          status,
          plan_type,
          start_date,
          end_date,
          payment_status,
          auto_renew,
          pricing_plans (
            name,
            original_price,
            discounted_price,
            duration_months,
            features
          )
        `)
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .single();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      if (subscription) {
        setSubscriptionData({
          id: subscription.id,
          status: subscription.status,
          plan_type: subscription.plan_type,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          payment_status: subscription.payment_status,
          auto_renew: subscription.auto_renew,
          plan_name: (subscription.pricing_plans as any)?.name || 'Unknown Plan',
          original_price: (subscription.pricing_plans as any)?.original_price || 0,
          discounted_price: (subscription.pricing_plans as any)?.discounted_price || 0,
          duration_months: (subscription.pricing_plans as any)?.duration_months || 0,
          features: (subscription.pricing_plans as any)?.features || [],
        });
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      Alert.alert('Error', 'Failed to load subscription information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [currentUser]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubscriptionData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'trial':
        return '#f59e0b';
      case 'inactive':
      case 'expired':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'checkmark-circle';
      case 'trial':
        return 'time';
      case 'inactive':
      case 'expired':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const handleUpgradePlan = () => {
    navigation.navigate('PricingScreen' as never);
  };

  const handleManagePayment = () => {
    Alert.alert(
      'Manage Payment',
      'Contact support to manage your payment method.',
      [{ text: 'OK' }]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Contact Support', 'Please contact support to cancel your subscription.');
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading subscription details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - Consistent with app */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Subscription</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Current Plan Card */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={styles.planTitleContainer}>
              <Text style={styles.planTitle} numberOfLines={1} ellipsizeMode="tail">
                {subscriptionData?.plan_name || 'No Active Plan'}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(userProfile?.subscription_status || 'inactive') + '20' }
              ]}>
                <Ionicons
                  name={getStatusIcon(userProfile?.subscription_status || 'inactive')}
                  size={16}
                  color={getStatusColor(userProfile?.subscription_status || 'inactive')}
                />
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(userProfile?.subscription_status || 'inactive') }
                ]}>
                  {userProfile?.subscription_status?.toUpperCase() || 'INACTIVE'}
                </Text>
              </View>
            </View>
          </View>

          {subscriptionData && (
            <>
              {/* Plan Details */}
              <View style={styles.planDetails}>
                <View style={styles.priceContainer}>
                  <Text style={styles.currentPrice}>
                    Rs. {subscriptionData.discounted_price}
                  </Text>
                  {subscriptionData.original_price > subscriptionData.discounted_price && (
                    <Text style={styles.originalPrice}>
                      Rs. {subscriptionData.original_price}
                    </Text>
                  )}
                  <Text style={styles.planDuration}>
                    /{subscriptionData.duration_months} month{subscriptionData.duration_months > 1 ? 's' : ''}
                  </Text>
                </View>

                {/* Subscription Dates */}
                <View style={styles.datesContainer}>
                  <View style={styles.dateItem}>
                    <Ionicons name="play-circle" size={20} color="#10b981" />
                    <View style={styles.dateContent}>
                      <Text style={styles.dateLabel}>Started</Text>
                      <Text style={styles.dateValue} numberOfLines={1} ellipsizeMode="tail">
                        {formatDate(subscriptionData.start_date)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.dateItem}>
                    <Ionicons name="stop-circle" size={20} color="#f59e0b" />
                    <View style={styles.dateContent}>
                      <Text style={styles.dateLabel}>Expires</Text>
                      <Text style={styles.dateValue} numberOfLines={1} ellipsizeMode="tail">
                        {formatDate(subscriptionData.end_date)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Days Remaining */}
                {userProfile?.subscription_end_date && (
                  <View style={styles.remainingContainer}>
                    <Ionicons name="time" size={20} color="#2563eb" />
                    <Text style={styles.remainingText}>
                      {getDaysRemaining(userProfile.subscription_end_date)} days remaining
                    </Text>
                  </View>
                )}

                {/* Auto Renew Status */}
                <View style={styles.autoRenewContainer}>
                  <Ionicons
                    name={subscriptionData.auto_renew ? "sync" : "sync-outline"}
                    size={20}
                    color={subscriptionData.auto_renew ? "#10b981" : "#6b7280"}
                  />
                  <Text style={[
                    styles.autoRenewText,
                    { color: subscriptionData.auto_renew ? "#10b981" : "#6b7280" }
                  ]}>
                    Auto-renewal {subscriptionData.auto_renew ? 'enabled' : 'disabled'}
                  </Text>
                </View>
              </View>

              {/* Features */}
              {subscriptionData.features.length > 0 && (
                <View style={styles.featuresContainer}>
                  <Text style={styles.featuresTitle}>Plan Features</Text>
                  {subscriptionData.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* No Active Subscription */}
          {!subscriptionData && (
            <View style={styles.noSubscriptionContainer}>
              <Ionicons name="information-circle" size={48} color="#6b7280" />
              <Text style={styles.noSubscriptionTitle}>No Active Subscription</Text>
              <Text style={styles.noSubscriptionText}>
                You don't have an active subscription. Choose a plan to get started!
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {subscriptionData ? (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleUpgradePlan}
              >
                <Ionicons name="arrow-up-circle" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Upgrade Plan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleManagePayment}
              >
                <Ionicons name="card" size={20} color="#2563eb" />
                <Text style={styles.secondaryButtonText}>Manage Payment</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleCancelSubscription}
              >
                <Ionicons name="close-circle" size={20} color="#ef4444" />
                <Text style={styles.dangerButtonText}>Cancel Subscription</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleUpgradePlan}
            >
              <Ionicons name="rocket" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Choose a Plan</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Support Section */}
        <View style={styles.supportContainer}>
          <Text style={styles.supportTitle}>Need Help?</Text>
          <Text style={styles.supportText}>
            Contact our support team for any subscription-related questions.
          </Text>
          <TouchableOpacity style={styles.supportButton}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#2563eb" />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#2563eb',
  },
  backButton: {
    padding: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  refreshButton: {
    padding: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planHeader: {
    marginBottom: 16,
  },
  planTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  planDetails: {
    gap: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  originalPrice: {
    fontSize: 16,
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  planDuration: {
    fontSize: 14,
    color: '#6b7280',
  },
  datesContainer: {
    flexDirection: 'column',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateContent: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  remainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 6,
  },
  remainingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  autoRenewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  autoRenewText: {
    fontSize: 14,
    fontWeight: '500',
  },
  featuresContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  noSubscriptionContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSubscriptionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  noSubscriptionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  actionsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ef4444',
    gap: 8,
  },
  dangerButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  supportContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  supportText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  supportButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
});
