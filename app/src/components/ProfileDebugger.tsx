import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { useAuth } from '../contexts/SupabaseAuthContext';

interface ProfileDebuggerProps {
  visible?: boolean;
}

export const ProfileDebugger: React.FC<ProfileDebuggerProps> = ({ visible = false }) => {
  const { currentUser, userProfile, updateUserProfile, refreshUserProfile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [testName, setTestName] = useState('');

  if (!visible && !__DEV__) return null;

  const handleTestUpdate = async () => {
    if (!testName.trim()) {
      Alert.alert('Error', 'Please enter a test name');
      return;
    }

    try {
      await updateUserProfile({
        name: testName.trim(),
        updated_at: new Date().toISOString(),
      });
      Alert.alert('Success', 'Profile updated successfully!');
      setTestName('');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleRefreshProfile = async () => {
    try {
      await refreshUserProfile();
      Alert.alert('Success', 'Profile refreshed from database');
    } catch (error) {
      console.error('Profile refresh error:', error);
      Alert.alert('Error', 'Failed to refresh profile');
    }
  };

  const handleCheckDatabase = async () => {
    Alert.alert(
      'Profile Status',
      `Current User: ${currentUser?.email || 'None'}
Profile Name: ${userProfile?.name || 'Not set'}
Company: ${userProfile?.company_name || 'Not set'}
Phone: ${userProfile?.phone_number || 'Not set'}
Updated: ${userProfile?.updated_at ? new Date(userProfile.updated_at).toLocaleString() : 'Never'}`
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.headerText}>
          🔧 Profile Debug {isExpanded ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              User: {currentUser?.email || 'Not signed in'}
            </Text>
            <Text style={styles.statusText}>
              Name: {userProfile?.name || 'Not set'}
            </Text>
            <Text style={styles.statusText}>
              Company: {userProfile?.company_name || 'Not set'}
            </Text>
            <Text style={styles.statusText}>
              Updated: {userProfile?.updated_at ? new Date(userProfile.updated_at).toLocaleString() : 'Never'}
            </Text>
          </View>

          <View style={styles.testContainer}>
            <Text style={styles.testLabel}>Test Profile Update:</Text>
            <TextInput
              style={styles.testInput}
              placeholder="Enter test name"
              value={testName}
              onChangeText={setTestName}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleTestUpdate}>
              <Text style={styles.buttonText}>Update</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleRefreshProfile}>
              <Text style={styles.buttonText}>Refresh</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleCheckDatabase}>
              <Text style={styles.buttonText}>Check DB</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 200,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    minWidth: 250,
    zIndex: 1000,
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    marginBottom: 2,
  },
  testContainer: {
    marginBottom: 12,
  },
  testLabel: {
    color: 'white',
    fontSize: 12,
    marginBottom: 4,
  },
  testInput: {
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 60,
  },
  buttonText: {
    color: 'white',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ProfileDebugger;
