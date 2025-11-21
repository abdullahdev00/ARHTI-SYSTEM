import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useSessionPersistence } from '../hooks/useSessionPersistence';

interface SessionDebuggerProps {
  visible?: boolean;
}

export const SessionDebugger: React.FC<SessionDebuggerProps> = ({ visible = false }) => {
  const { currentUser, userProfile, session } = useAuth();
  const { debugSession, clearSession, refreshSession, validateSession } = useSessionPersistence();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!visible && !__DEV__) return null;

  const handleDebugSession = async () => {
    await debugSession();
    Alert.alert('Debug Info', 'Check console for session debug information');
  };

  const handleClearSession = async () => {
    Alert.alert(
      'Clear Session',
      'Are you sure you want to clear the stored session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearSession();
            Alert.alert('Success', 'Session cleared from storage');
          },
        },
      ]
    );
  };

  const handleRefreshSession = async () => {
    const success = await refreshSession();
    Alert.alert(
      success ? 'Success' : 'Error',
      success ? 'Session refreshed successfully' : 'Failed to refresh session'
    );
  };

  const handleValidateSession = async () => {
    const isValid = await validateSession();
    Alert.alert(
      'Session Status',
      isValid ? 'Session is valid' : 'Session is invalid or expired'
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.headerText}>
          🔧 Session Debug {isExpanded ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              User: {currentUser?.email || 'Not signed in'}
            </Text>
            <Text style={styles.statusText}>
              Profile: {userProfile?.name || 'Not loaded'}
            </Text>
            <Text style={styles.statusText}>
              Session: {session ? 'Active' : 'None'}
            </Text>
            <Text style={styles.statusText}>
              Expires: {session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleDebugSession}>
              <Text style={styles.buttonText}>Debug Info</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleValidateSession}>
              <Text style={styles.buttonText}>Validate</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleRefreshSession}>
              <Text style={styles.buttonText}>Refresh</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleClearSession}>
              <Text style={[styles.buttonText, styles.dangerText]}>Clear</Text>
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
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    minWidth: 200,
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
    fontSize: 12,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 70,
  },
  dangerButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  dangerText: {
    color: 'white',
  },
});

export default SessionDebugger;
