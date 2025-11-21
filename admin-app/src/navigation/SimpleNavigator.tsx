import React, { useState } from 'react';
import DashboardScreen from '../screens/admin/DashboardScreen';
import UsersScreen from '../screens/admin/UsersScreen';
import PaymentManagementScreen from '../screens/admin/PaymentManagementScreen';

// Simple navigator - direct access to dashboard (auth disabled)
export default function SimpleNavigator() {
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  // Simple screen navigation without React Navigation
  const navigateToScreen = (screen: string) => {
    setCurrentScreen(screen);
  };

  // Render appropriate screen
  switch (currentScreen) {
    case 'users':
      return <UsersScreen onNavigateBack={() => setCurrentScreen('dashboard')} />;
    case 'payments':
      return <PaymentManagementScreen />;
    case 'dashboard':
    default:
      return (
        <DashboardScreen 
          onNavigateToUsers={() => setCurrentScreen('users')}
          onNavigateToPayments={() => setCurrentScreen('payments')}
        />
      );
  }
}
