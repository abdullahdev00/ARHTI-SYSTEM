import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import { useAdminAuth } from '../contexts/AdminAuthContext';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';
import DashboardScreen from '../screens/admin/DashboardScreen';
import UsersScreen from '../screens/admin/UsersScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Loading Screen Component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#2563eb" />
  </View>
);

// Admin Tabs Navigator
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Users') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Payments') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Users" 
        component={UsersScreen}
        options={{ title: 'Users' }}
      />
      <Tab.Screen 
        name="Payments" 
        component={PlaceholderScreen}
        options={{ title: 'Payments' }}
      />
      <Tab.Screen 
        name="Reports" 
        component={PlaceholderScreen}
        options={{ title: 'Reports' }}
      />
    </Tab.Navigator>
  );
}

// Placeholder Screen for future features
const PlaceholderScreen = () => (
  <View style={styles.placeholderContainer}>
    <Ionicons name="construct-outline" size={64} color="#64748b" />
    <View style={styles.placeholderText}>
      <Text style={styles.placeholderTitle}>Coming Soon</Text>
      <Text style={styles.placeholderSubtitle}>This feature is under development</Text>
    </View>
  </View>
);

// Auth Stack Navigator
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
    </Stack.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  const { currentUser, isAdmin, loading } = useAdminAuth();

  // Show loading while checking auth state
  if (loading) {
    return (
      <NavigationContainer>
        <LoadingScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      {currentUser && isAdmin ? (
        // User is authenticated and is admin
        <AdminTabs />
      ) : (
        // User is not authenticated or not admin
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  placeholderText: {
    alignItems: 'center',
    marginTop: 24,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});
