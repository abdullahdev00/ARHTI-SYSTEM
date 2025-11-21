import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/SupabaseAuthContext';
import PaymentService from '../services/paymentService';
import { PricingScreen } from '../screens/planflow/PricingScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentPendingScreen from '../screens/PaymentPendingScreen';
import { MainNavigator } from './MainNavigator';
import { ProfileCompletionWrapper } from '../components';
import type { PaymentRequest } from '../types/payment';

const Stack = createStackNavigator();

// Loading Screen Component
const PaymentLoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#2563eb" />
  </View>
);

export const PaymentNavigator: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);

  useEffect(() => {
    checkPaymentStatus();
  }, [currentUser]);

  const checkPaymentStatus = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check if user has an active subscription
      if (userProfile?.subscription_status === 'active') {
        setLoading(false);
        return;
      }

      // Check if user has pending payment
      const hasPending = await PaymentService.hasPendingPayment(currentUser.id);
      
      if (hasPending) {
        // Get the current payment request
        const { data, error } = await PaymentService.getCurrentPaymentRequest(currentUser.id);
        
        if (!error && data) {
          setPaymentRequest(data);
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PaymentLoadingScreen />;
  }

  // If user has active subscription, go to main app
  if (userProfile?.subscription_status === 'active') {
    return (
      <ProfileCompletionWrapper>
        <MainNavigator />
      </ProfileCompletionWrapper>
    );
  }

  // If user has submitted payment, show pending screen
  if (paymentRequest && paymentRequest.status === 'submitted') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen 
          name="PaymentPendingScreen" 
          component={PaymentPendingScreen}
          initialParams={{ paymentRequest }}
        />
      </Stack.Navigator>
    );
  }

  // If user has pending payment request, show payment screen
  if (paymentRequest && paymentRequest.status === 'pending') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen 
          name="PaymentScreen" 
          component={PaymentScreen}
          initialParams={{ paymentRequest }}
        />
        <Stack.Screen name="PaymentPendingScreen" component={PaymentPendingScreen} />
      </Stack.Navigator>
    );
  }

  // Default: Show pricing screen
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PricingScreen" component={PricingScreen} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen name="PaymentPendingScreen" component={PaymentPendingScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});

export default PaymentNavigator;
