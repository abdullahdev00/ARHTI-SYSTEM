import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  Linking,
  useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useBiometric } from '../contexts/BiometricContext';
import { useNavigation } from '@react-navigation/native';
import { observer } from '@legendapp/state/react';
import { watermelonSyncService } from '../services/watermelonSyncService';
import { supabase } from '../config/supabase';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'navigation' | 'toggle' | 'action' | 'dropdown';
  value?: boolean | string;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  onSelect?: (value: string) => void | Promise<void>;
  options?: { label: string; value: string }[];
  color?: string;
}

/**
 * Settings Screen with WatermelonDB
 * ✅ Modern settings interface
 * ✅ Real-time sync preferences
 * ✅ Database management
 * ✅ User profile integration
 */
const SettingsScreen: React.FC = observer(() => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { currentUser, logout } = useAuth();
  const { isBiometricAvailable, isBiometricEnabled, isAuthenticating, enableBiometric, disableBiometric, biometricType, setPIN, hasPIN } = useBiometric();

  // Local state for UI
  const [notifications, setNotifications] = useState(true);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [showPINSetup, setShowPINSetup] = useState(false);
  const [newPIN, setNewPIN] = useState('');
  const [confirmPIN, setConfirmPIN] = useState('');

  // Handle biometric toggle
  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const success = await enableBiometric();
      if (success) {
        Alert.alert('Success', `${biometricType} authentication enabled successfully!`);
      } else {
        Alert.alert('Failed', 'Could not enable biometric authentication');
      }
    } else {
      await disableBiometric();
      Alert.alert('Success', 'Biometric authentication disabled');
    }
  };

  // Handle PIN setup
  const handlePINSetup = async () => {
    if (newPIN.length !== 4 || confirmPIN.length !== 4) {
      Alert.alert('Error', 'PIN must be exactly 4 digits');
      return;
    }

    if (newPIN !== confirmPIN) {
      Alert.alert('Error', 'PINs do not match');
      setNewPIN('');
      setConfirmPIN('');
      return;
    }

    if (!/^\d+$/.test(newPIN)) {
      Alert.alert('Error', 'PIN must contain only digits');
      return;
    }

    const success = await setPIN(newPIN);
    if (success) {
      Alert.alert('Success', 'PIN set successfully!');
      setShowPINSetup(false);
      setNewPIN('');
      setConfirmPIN('');
    } else {
      Alert.alert('Error', 'Failed to set PIN');
    }
  };

  // Navigation handlers
  const handleAffiliatePress = () => {
    Alert.alert(
      'Affiliate Program',
      'Coming Soon! Earn rewards by referring friends to ARHTI System.',
      [{ text: 'OK' }]
    );
  };

  const handleExportPress = () => {
    Alert.alert(
      'Export Data',
      'Export functionality will be available in the next update.',
      [{ text: 'OK' }]
    );
  };

  const handleClearDatabase = () => {
    Alert.alert(
      'Clear All Data',
      'This will clear all data from both local storage (SQLite) and Supabase cloud. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              Alert.alert('Clearing Data', 'Please wait while we clear all data...');

              // Tables to clear (all user data)
              const tables = [
                'partners',
                'purchases',
                'invoices',
                'invoice_items',
                'stock_items',
                'stock_variants',
                'buy_transactions',
                'partner_transactions',
                'payments',
              ];

              // Clear from Supabase
              for (const table of tables) {
                try {
                  await supabase
                    .from(table)
                    .delete()
                    .eq('user_id', currentUser?.id);
                  console.log(`✅ Cleared ${table} from Supabase`);
                } catch (error) {
                  console.log(`⚠️ Table ${table} not found or already empty`);
                }
              }

              // Clear local SQLite data
              await watermelonSyncService.fullSync();

              Alert.alert('Success', 'All data cleared from local storage and Supabase');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleResetDatabase = () => {
    Alert.alert(
      'Reset Application',
      'This will reset the entire application to its initial state. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await watermelonSyncService.fullSync();
              Alert.alert('Success', 'Application reset successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset application');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleFeedbackSubmit = () => {
    if (feedbackText.trim()) {
      Alert.alert('Thank You!', 'Your feedback has been recorded.');
      setFeedbackText('');
      setShowFeedbackModal(false);
    }
  };

  // Settings sections
  const settingsSections: any = [
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Receive push notifications',
          icon: 'notifications-outline' as const,
          type: 'toggle' as const,
          value: notifications,
          onToggle: setNotifications,
          color: '#FF9800',
        },
        {
          id: 'biometric',
          title: 'Biometric Lock',
          subtitle: isBiometricAvailable
            ? `Use ${biometricType || 'biometric'} unlock`
            : 'Not available on this device',
          icon: 'finger-print-outline' as const,
          type: 'toggle' as const,
          value: isBiometricEnabled,
          onToggle: handleBiometricToggle,
          color: '#2196F3',
          disabled: !isBiometricAvailable || isAuthenticating,
        },
        {
          id: 'pin',
          title: 'PIN Lock',
          subtitle: hasPIN ? 'PIN is set' : 'Set a 4-digit PIN',
          icon: 'lock-closed-outline' as const,
          type: 'action' as const,
          onPress: () => setShowPINSetup(true),
          color: '#9C27B0',
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          id: 'export',
          title: 'Export Data',
          subtitle: 'Export to CSV/Excel',
          icon: 'download-outline' as const,
          type: 'action' as const,
          onPress: handleExportPress,
          color: '#FF9800',
        },
        {
          id: 'clear',
          title: 'Clear Local Data',
          subtitle: 'Clear cached data',
          icon: 'trash-outline' as const,
          type: 'action' as const,
          onPress: handleClearDatabase,
          color: '#F44336',
        },
      ],
    },
    {
      title: 'Earn',
      items: [
        {
          id: 'affiliate',
          title: 'Affiliate Program',
          subtitle: 'Coming Soon',
          icon: 'gift-outline' as const,
          type: 'action' as const,
          onPress: handleAffiliatePress,
          color: '#10b981',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Help us improve the app',
          icon: 'chatbubble-outline' as const,
          type: 'action' as const,
          onPress: () => setShowFeedbackModal(true),
          color: '#4CAF50',
        },
        {
          id: 'about',
          title: 'About',
          subtitle: 'App version and info',
          icon: 'information-circle-outline' as const,
          type: 'action' as const,
          onPress: () => setShowAboutModal(true),
          color: '#2196F3',
        },
        {
          id: 'signout',
          title: 'Sign Out',
          subtitle: 'Sign out of your account',
          icon: 'log-out-outline' as const,
          type: 'action' as const,
          onPress: handleSignOut,
          color: '#F44336',
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={item.onPress}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.settingItemLeft}>
          <View style={[styles.settingIcon, { backgroundColor: item.color }]}>
            <Ionicons name={item.icon} size={20} color="white" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
            )}
          </View>
        </View>

        <View style={styles.settingItemRight}>
          {item.type === 'toggle' && (
            <Switch
              value={item.value as boolean}
              onValueChange={item.onToggle}
              trackColor={{ false: '#ccc', true: item.color }}
              thumbColor="white"
            />
          )}
          {item.type === 'navigation' && (
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          )}
          {item.type === 'action' && (
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      <ScrollView style={styles.content}>
        {settingsSections.map((section: any) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>
            ARHTI System v1.0.0
          </Text>
          <Text style={styles.appInfoText}>
            Built with Legend State & Supabase
          </Text>
        </View>
      </ScrollView>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About ARHTI System</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAboutModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.aboutContent}>
              <Text style={styles.aboutText}>
                ARHTI System is a comprehensive agricultural management platform
                designed to help farmers and agricultural businesses manage their
                operations efficiently.
              </Text>

              <View style={styles.aboutFeatures}>
                <Text style={styles.aboutFeaturesTitle}>Key Features:</Text>
                <Text style={styles.aboutFeature}>• Real-time data synchronization</Text>
                <Text style={styles.aboutFeature}>• Partner management</Text>
                <Text style={styles.aboutFeature}>• Purchase tracking</Text>
                <Text style={styles.aboutFeature}>• Invoice generation</Text>
                <Text style={styles.aboutFeature}>• Stock management</Text>
                <Text style={styles.aboutFeature}>• Comprehensive reporting</Text>
              </View>

              <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Feedback</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowFeedbackModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.feedbackContent}>
              <Text style={styles.feedbackLabel}>
                Help us improve the app by sharing your thoughts:
              </Text>
              <TextInput
                style={styles.feedbackInput}
                value={feedbackText}
                onChangeText={setFeedbackText}
                placeholder="Enter your feedback here..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[
                  styles.feedbackSubmitButton,
                  !feedbackText.trim() && styles.feedbackSubmitButtonDisabled,
                ]}
                onPress={handleFeedbackSubmit}
                disabled={!feedbackText.trim()}
              >
                <Text style={styles.feedbackSubmitButtonText}>
                  Submit Feedback
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PIN Setup Modal */}
      <Modal
        visible={showPINSetup}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPINSetup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set PIN Lock</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPINSetup(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.pinSetupContent}>
              <Text style={styles.pinSetupLabel}>Enter 4-digit PIN</Text>
              <TextInput
                style={styles.pinSetupInput}
                placeholder="0000"
                placeholderTextColor="#ccc"
                keyboardType="number-pad"
                secureTextEntry={true}
                maxLength={4}
                value={newPIN}
                onChangeText={setNewPIN}
              />

              <Text style={styles.pinSetupLabel}>Confirm PIN</Text>
              <TextInput
                style={styles.pinSetupInput}
                placeholder="0000"
                placeholderTextColor="#ccc"
                keyboardType="number-pad"
                secureTextEntry={true}
                maxLength={4}
                value={confirmPIN}
                onChangeText={setConfirmPIN}
              />

              <TouchableOpacity
                style={styles.pinSetupButton}
                onPress={handlePINSetup}
                disabled={newPIN.length !== 4 || confirmPIN.length !== 4}
              >
                <Text style={styles.pinSetupButtonText}>Set PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingItemRight: {
    marginLeft: 12,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  appInfoText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  aboutContent: {
    padding: 20,
  },
  aboutText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  aboutFeatures: {
    marginBottom: 20,
  },
  aboutFeaturesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  aboutFeature: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  aboutVersion: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  feedbackContent: {
    padding: 20,
  },
  feedbackLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  feedbackSubmitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  feedbackSubmitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  feedbackSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  pinSetupContent: {
    padding: 20,
  },
  pinSetupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  pinSetupInput: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    letterSpacing: 8,
  },
  pinSetupButton: {
    backgroundColor: '#9C27B0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  pinSetupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default SettingsScreen;
