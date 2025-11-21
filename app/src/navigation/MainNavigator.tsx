import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import PartnersScreen from '../screens/PartnersScreen';
import PartnerDetailScreen from '../screens/PartnerDetailScreen';
import StockScreen from '../screens/StockScreen';
import InvoicesScreen from '../screens/InvoicesScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import { ChargesScreen } from '../screens/ChargesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MoreScreen from '../screens/MoreScreen';

// Auth screens
import SignupScreen from '../screens/auth/SignupScreen';
import SigninScreen from '../screens/auth/SigninScreen';

// Profile screen
import ProfileScreen from '../screens/ProfileScreen';

// Subscription screen
import SubscriptionScreen from '../screens/planflow/SubscriptionScreen';

// Form screens
// import InvoicePreviewScreen from '../screens/InvoicePreviewScreen'; // TODO: Refactor to use WatermelonDB

// Debug screen
import { DebugWatermelonScreen } from '../screens/DebugWatermelonScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main Tab Navigator
function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Partners':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Stock':
              iconName = focused ? 'cube' : 'cube-outline';
              break;
            case 'Invoices':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'More':
              iconName = focused ? 'menu' : 'menu-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 0.5,
          borderTopColor: '#e5e5e7',
          height: Platform.OS === 'ios' ? 85 : 70 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 10),
          paddingTop: 8,
          paddingHorizontal: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 3,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: Platform.OS === 'android' ? 5 : 0,
        },
        headerStyle: {
          backgroundColor: 'white',
          height: 64,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
          borderBottomWidth: 0.5,
          borderBottomColor: '#e5e5e7',
        },
        headerTintColor: '#1c1c1e',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 20,
          color: '#1c1c1e',
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Partners"
        component={PartnersScreen}
        options={{ title: 'Partners' }}
      />
      <Tab.Screen
        name="Stock"
        component={StockScreen}
        options={{
          title: 'Stock Management',
        }}
      />
      <Tab.Screen
        name="Invoices"
        component={InvoicesScreen}
        options={{ title: 'Invoices' }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{ title: 'More' }}
      />
    </Tab.Navigator>
  );
}

// Stack Navigator for the entire app
export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: 'white',
        },
        headerTintColor: '#1c1c1e',
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#1c1c1e',
        },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />

      {/* Detail Screens */}
      <Stack.Screen
        name="FarmerDetail"
        component={PartnerDetailScreen}
        options={{ title: 'Partner Details' }}
      />

      {/* Form Screens */}
      {/* AddFarmer, AddPurchase, AddInvoice, AddPayment screens removed - using bottom sheets instead */}
      {/* TODO: Refactor InvoicePreviewScreen to use WatermelonDB
      <Stack.Screen
        name="InvoicePreview"
        component={InvoicePreviewScreen}
        options={{ title: 'Invoice Preview' }}
      />
      */}

      {/* Other Screens */}
      <Stack.Screen
        name="Invoices"
        component={InvoicesScreen}
        options={({ navigation }: { navigation: any }) => ({
          title: 'Invoices',
          headerRight: () => (
            <TouchableOpacity
              style={{
                marginRight: 16,
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: 8,
                borderRadius: 20
              }}
              onPress={() => navigation.navigate('AddInvoice')}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{ title: 'Payments' }}
      />
      <Stack.Screen
        name="Charges"
        component={ChargesScreen}
        options={{ title: 'Charges' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      {/* Auth Screens */}
      <Stack.Screen
        name="SignupScreen"
        component={SignupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SigninScreen"
        component={SigninScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SubscriptionScreen"
        component={SubscriptionScreen}
        options={{ headerShown: false }}
      />

      {/* Debug Screen */}
      <Stack.Screen
        name="DebugWatermelon"
        component={DebugWatermelonScreen}
        options={{ title: '🔍 WatermelonDB Debug' }}
      />

    </Stack.Navigator>
  );
};

