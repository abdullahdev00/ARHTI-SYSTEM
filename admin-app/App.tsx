import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AdminAuthProvider } from './src/contexts/AdminAuthContext';
import AdminRouteGuard from './src/components/AdminRouteGuard';
import SimpleNavigator from './src/navigation/SimpleNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AdminAuthProvider>
        <AdminRouteGuard>
          <SimpleNavigator />
        </AdminRouteGuard>
        <StatusBar style="auto" />
      </AdminAuthProvider>
    </SafeAreaProvider>
  );
}
