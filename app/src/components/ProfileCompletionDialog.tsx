import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileCompletionDialogProps {
  visible: boolean;
  onCompleteProfile: () => void;
}

const { width } = Dimensions.get('window');

export default function ProfileCompletionDialog({
  visible,
  onCompleteProfile
}: ProfileCompletionDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}} // Prevent dismissal
    >
      <View style={styles.overlay}>
        <View style={styles.dialogContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-circle-outline" size={48} color="#2563eb" />
            </View>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              You must complete your profile to continue using the app
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.description}>
              Complete the following information to access all app features and start managing your business.
            </Text>
            
            <View style={styles.requirementsList}>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.requirementText}>Personal Information</Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.requirementText}>Business Details</Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.requirementText}>Contact Information</Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.requirementText}>Address Details</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.completeButton}
              onPress={onCompleteProfile}
            >
              <Ionicons name="person-add" size={20} color="white" />
              <Text style={styles.completeButtonText}>Complete Profile Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dialogContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: width - 40,
    maxWidth: 400,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#dbeafe',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    marginBottom: 32,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  requirementsList: {
    gap: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requirementText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  actions: {
    gap: 12,
  },
  completeButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
