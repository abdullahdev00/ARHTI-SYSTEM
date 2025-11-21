import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import PaymentService from '../../services/paymentService';
import type { PricingPlan } from '../../types/payment';

export function PricingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<PricingPlan[]>([]);

  // Load pricing plans from database
  useEffect(() => {
    loadPricingPlans();
  }, []);

  const loadPricingPlans = async () => {
    try {
      setPlansLoading(true);
      const { data, error } = await PaymentService.getPricingPlans();

      if (error) {
        console.error('Error loading pricing plans:', error);
        Alert.alert('Error', 'Failed to load pricing plans. Please try again.');
        return;
      }

      if (data) {
        setPlans(data);
      }
    } catch (error) {
      console.error('Error loading pricing plans:', error);
      Alert.alert('Error', 'Failed to load pricing plans. Please try again.');
    } finally {
      setPlansLoading(false);
    }
  };

  const handlePlanSelect = async (plan: PricingPlan) => {
    if (!currentUser) {
      Alert.alert('Error', 'Please sign in to continue');
      return;
    }

    setSelectedPlan(plan.id);
    setLoading(true);

    try {
      // Navigate to payment screen with plan details only
      // Payment request will be created when user submits payment details
      (navigation as any).navigate('PaymentScreen', {
        selectedPlan: plan,
      });

    } catch (error) {
      console.error('Error selecting plan:', error);
      Alert.alert('Error', 'Failed to select plan. Please try again.');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  if (plansLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading pricing plans...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
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
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Select the Perfect Plan</Text>
          <Text style={styles.subtitle}>
            Choose a plan that fits your business needs and start managing your inventory efficiently
          </Text>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                plan.is_popular && styles.popularPlan,
              ]}
            >
              {plan.is_popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>MOST POPULAR</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planDuration}>
                  {plan.duration_months === 1 ? '1 Month' :
                    plan.duration_months === 3 ? '3 Months' :
                      plan.duration_months === 12 ? '12 Months' :
                        `${plan.duration_months} Months`}
                </Text>
              </View>

              <View style={styles.priceSection}>
                <View style={styles.priceRow}>
                  <Text style={styles.originalPrice}>
                    {PaymentService.formatCurrency(plan.original_price)}
                  </Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      {PaymentService.calculateDiscountPercentage(plan.original_price, plan.discounted_price)}% OFF
                    </Text>
                  </View>
                </View>
                <Text style={styles.currentPrice}>
                  {PaymentService.formatCurrency(plan.discounted_price)}
                </Text>
                <Text style={styles.priceNote}>One-time payment</Text>
              </View>

              <View style={styles.featuresSection}>
                {plan.features.map((feature: string, index: number) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.selectButton,
                  plan.is_popular && styles.popularButton,
                  selectedPlan === plan.id && styles.loadingButton,
                ]}
                onPress={() => handlePlanSelect(plan)}
                disabled={loading}
              >
                {selectedPlan === plan.id ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={[
                    styles.selectButtonText,
                    plan.is_popular && styles.popularButtonText,
                  ]}>
                    Select Plan
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All plans include 24/7 customer support and regular updates
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
  titleSection: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 32,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  plansContainer: {
    paddingHorizontal: 20,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  popularPlan: {
    borderColor: '#2563eb',
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 24,
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  planHeader: {
    marginBottom: 16,
    marginTop: 8,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  planDuration: {
    fontSize: 16,
    color: '#64748b',
  },
  priceSection: {
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginRight: 12,
  },
  discountBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: 'bold',
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  priceNote: {
    fontSize: 14,
    color: '#64748b',
  },
  featuresSection: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  selectButton: {
    backgroundColor: '#64748b',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  popularButton: {
    backgroundColor: '#2563eb',
  },
  loadingButton: {
    opacity: 0.8,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  popularButtonText: {
    color: 'white',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});
