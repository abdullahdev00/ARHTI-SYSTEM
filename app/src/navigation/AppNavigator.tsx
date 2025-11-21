import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { MainNavigator } from './MainNavigator';
import { ProfileCompletionWrapper } from '../components';
import { PaymentNavigator } from './PaymentNavigator';

// Auth screens
import SignupScreen from '../screens/auth/SignupScreen';
import SigninScreen from '../screens/auth/SigninScreen';
import { PricingScreen } from '../screens/planflow/PricingScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentPendingScreen from '../screens/PaymentPendingScreen';

// Loading component
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const Stack = createStackNavigator();

// Loading Screen Component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#2563eb" />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

// Auth Stack Navigator
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SigninScreen" component={SigninScreen} />
      <Stack.Screen name="SignupScreen" component={SignupScreen} />
      <Stack.Screen name="PricingScreen" component={PricingScreen} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen name="PaymentPendingScreen" component={PaymentPendingScreen} />
      <Stack.Screen name="MainNavigator" component={MainNavigator} />
    </Stack.Navigator>
  );
}

// Main App Navigator with Authentication Guard
export const AppNavigator: React.FC = () => {
  const { currentUser, userProfile, loading } = useAuth();

  // Show loading while checking auth state
  if (loading) {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <LoadingScreen />
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {currentUser ? (
          // User is signed in
          currentUser.email_confirmed_at ? (
            // Email is verified - check payment status and show appropriate flow
            <PaymentNavigator />
          ) : (
            // Email not verified - show auth stack
            <AuthStack />
          )
        ) : (
          // User is not signed in - show auth stack
          <AuthStack />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
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
});
