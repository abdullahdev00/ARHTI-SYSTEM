import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AdminLoginScreen from './AdminLoginScreen';
import AdminSignupScreen from './AdminSignupScreen';

export default function AdminAuthScreen() {
  const [isLogin, setIsLogin] = useState(true);

  const switchToLogin = () => setIsLogin(true);
  const switchToSignup = () => setIsLogin(false);

  return (
    <View style={styles.container}>
      {isLogin ? (
        <AdminLoginScreen onSwitchToSignup={switchToSignup} />
      ) : (
        <AdminSignupScreen onSwitchToLogin={switchToLogin} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
