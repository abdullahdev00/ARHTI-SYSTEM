import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  ToastAndroid
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/SupabaseAuthContext';

// Move ProfileField outside component to prevent re-creation
const ProfileField = React.memo(({ 
  label, 
  value, 
  field, 
  placeholder, 
  icon,
  multiline = false,
  isEditing,
  onChangeText,
  keyboardType = "default"
}: {
  label: string;
  value: string;
  field: string;
  placeholder: string;
  icon: string;
  multiline?: boolean;
  isEditing: boolean;
  onChangeText: (field: string, text: string) => void;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad" | "number-pad";
}) => {
  // Stable onChange handler
  const handleChange = useCallback((text: string) => {
    onChangeText(field, text);
  }, [field, onChangeText]);

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInputContainer}>
        <Ionicons name={icon as any} size={20} color="#64748b" style={styles.fieldIcon} />
        {isEditing ? (
          <TextInput
            style={[styles.fieldInput, multiline && styles.multilineInput]}
            value={value}
            onChangeText={handleChange}
            placeholder={placeholder}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            // Critical props to prevent keyboard dismissal and re-renders
            autoCorrect={false}
            autoCapitalize={keyboardType === "default" ? "words" : "none"}
            blurOnSubmit={false}
            returnKeyType={multiline ? "default" : "next"}
            keyboardType={keyboardType}
            textContentType="none"
            autoComplete="off"
            // Prevent focus loss on Android
            underlineColorAndroid="transparent"
            selectionColor="#2563eb"
          />
        ) : (
          <Text style={styles.fieldValue}>{value || placeholder}</Text>
        )}
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.value === nextProps.value &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.field === nextProps.field &&
    prevProps.keyboardType === nextProps.keyboardType &&
    prevProps.onChangeText === nextProps.onChangeText
  );
});

export default function ProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { userProfile, currentUser, refreshUserProfile, updateUserProfile, isProfileComplete } = useAuth();
  
  // Check if we should start in edit mode (from profile completion dialog)
  const shouldStartEditing = (route.params as any)?.editMode === true;
  const isMandatoryCompletion = (route.params as any)?.mandatoryCompletion === true;
  const [editing, setEditing] = useState(shouldStartEditing);
  const [loading, setLoading] = useState(false);
  
  // Simplified form data state - no complex synchronization
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    businessType: '',
    gstNumber: ''
  });

  // Initialize form data only once when userProfile is available
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        companyName: userProfile.company_name || '',
        phoneNumber: userProfile.phone_number || '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        pincode: userProfile.pincode || '',
        businessType: userProfile.business_type || '',
        gstNumber: userProfile.gst_number || ''
      });
    }
  }, [userProfile]); // Simplified dependency - only trigger when userProfile object changes

  // Handle back navigation for mandatory profile completion
  useEffect(() => {
    if (isMandatoryCompletion && !isProfileComplete) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        // Show toast message and prevent back navigation
        if (Platform.OS === 'android') {
          ToastAndroid.show('Complete profile first', ToastAndroid.SHORT);
        } else {
          Alert.alert('Profile Required', 'Please complete your profile first');
        }
        return true; // Prevent default back behavior
      });

      return () => backHandler.remove();
    }
  }, [isMandatoryCompletion, isProfileComplete]);

  // Phone number validation function
  const validatePhoneNumber = (phoneNumber: string): boolean => {
    // Pakistani mobile number format: 03001234567 (11 digits starting with 03)
    const phoneRegex = /^03\d{9}$/;
    return phoneRegex.test(phoneNumber);
  };

  // Stable input change handler with phone number validation
  const handleInputChange = useCallback((field: string, value: string) => {
    // Apply phone number validation and formatting
    if (field === 'phoneNumber') {
      // Remove any non-digit characters
      const cleanValue = value.replace(/\D/g, '');
      
      // Limit to 11 digits and ensure it starts with 03
      if (cleanValue.length <= 11) {
        setFormData(prev => ({ ...prev, [field]: cleanValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  }, []);

  const handleSave = async () => {
    if (!currentUser) return;

    // Validate required fields
    const requiredFields = [
      { field: 'name', label: 'Full Name' },
      { field: 'phoneNumber', label: 'Phone Number' },
      { field: 'companyName', label: 'Company Name' },
      { field: 'businessType', label: 'Business Type' },
      { field: 'address', label: 'Address' },
      { field: 'city', label: 'City' },
      { field: 'state', label: 'State' },
      { field: 'pincode', label: 'Pincode' },
    ];

    for (const { field, label } of requiredFields) {
      if (!formData[field as keyof typeof formData]?.trim()) {
        Alert.alert('Missing Information', `Please enter your ${label}`);
        return;
      }
    }

    // Validate phone number format
    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      Alert.alert(
        'Invalid Phone Number', 
        'Please enter a valid Pakistani mobile number (e.g., 03001234567)'
      );
      return;
    }

    setLoading(true);
    try {
      // Prepare profile data for update (convert form field names to database field names)
      const profileUpdateData = {
        name: formData.name.trim(),
        company_name: formData.companyName.trim(),
        phone_number: formData.phoneNumber.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        business_type: formData.businessType.trim(),
        gst_number: formData.gstNumber.trim(),
      };

      console.log('Saving profile data:', profileUpdateData);

      // Update profile in Supabase database
      await updateUserProfile(profileUpdateData);

      setEditing(false);
      
      if (isMandatoryCompletion) {
        // Show success message and navigate back to main app
        Alert.alert('Success', 'Profile completed successfully! Welcome to the app.', [
          {
            text: 'Continue',
            onPress: () => navigation.goBack()
          }
        ]);
      } else {
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form data to original values from userProfile
  const handleCancel = useCallback(() => {
    if (isMandatoryCompletion && !isProfileComplete) {
      // Show toast message and prevent cancel in mandatory mode
      if (Platform.OS === 'android') {
        ToastAndroid.show('Complete profile first', ToastAndroid.SHORT);
      } else {
        Alert.alert('Profile Required', 'Please complete your profile first');
      }
      return;
    }
    
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        companyName: userProfile.company_name || '',
        phoneNumber: userProfile.phone_number || '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        pincode: userProfile.pincode || '',
        businessType: userProfile.business_type || '',
        gstNumber: userProfile.gst_number || ''
      });
    }
    setEditing(false);
  }, [userProfile, isMandatoryCompletion, isProfileComplete]);

  // Handle back navigation with mandatory completion check
  const handleGoBack = useCallback(() => {
    if (isMandatoryCompletion && !isProfileComplete) {
      // Show toast message and prevent navigation
      if (Platform.OS === 'android') {
        ToastAndroid.show('Complete profile first', ToastAndroid.SHORT);
      } else {
        Alert.alert('Profile Required', 'Please complete your profile first');
      }
      return;
    }
    navigation.goBack();
  }, [navigation, isMandatoryCompletion, isProfileComplete]);

  const handleEditToggle = useCallback(() => {
    if (editing) {
      handleSave();
    } else {
      setEditing(true);
    }
  }, [editing]);


  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={24} color="#2563eb" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Profile</Text>
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEditToggle}
            disabled={loading}
          >
            <Ionicons 
              name={editing ? "checkmark" : "pencil"} 
              size={20} 
              color="#2563eb" 
            />
            <Text style={styles.editButtonText}>
              {editing ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <View style={styles.profilePicture}>
            <Ionicons name="person" size={48} color="#2563eb" />
          </View>
          <Text style={styles.profileName}>{userProfile?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{userProfile?.email}</Text>
          <View style={[
            styles.subscriptionBadge,
            userProfile?.subscription_status === 'active' 
              ? styles.activeBadge 
              : styles.trialBadge
          ]}>
            <Text style={[
              styles.subscriptionText,
              userProfile?.subscription_status === 'active' 
                ? styles.activeText 
                : styles.trialText
            ]}>
              {userProfile?.subscription_status === 'active' ? 'ACTIVE PLAN' : 'TRIAL MODE'}
            </Text>
          </View>
        </View>

        {/* Profile Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <ProfileField
            label="Full Name"
            value={formData.name}
            field="name"
            placeholder="Enter your full name"
            icon="person"
            isEditing={editing}
            onChangeText={handleInputChange}
            keyboardType="default"
          />

          <ProfileField
            label="Phone Number"
            value={formData.phoneNumber}
            field="phoneNumber"
            placeholder="03001234567"
            icon="call"
            isEditing={editing}
            onChangeText={handleInputChange}
            keyboardType="phone-pad"
          />

          <Text style={styles.sectionTitle}>Business Information</Text>

          <ProfileField
            label="Company Name"
            value={formData.companyName}
            field="companyName"
            placeholder="Enter your company name"
            icon="business"
            isEditing={editing}
            onChangeText={handleInputChange}
            keyboardType="default"
          />

          <ProfileField
            label="Business Type"
            value={formData.businessType}
            field="businessType"
            placeholder="e.g., Agricultural Trading, Mandi Business"
            icon="storefront"
            isEditing={editing}
            onChangeText={handleInputChange}
            keyboardType="default"
          />

          <ProfileField
            label="GST Number"
            value={formData.gstNumber}
            field="gstNumber"
            placeholder="Enter GST number (optional)"
            icon="document-text"
            isEditing={editing}
            onChangeText={handleInputChange}
            keyboardType="default"
          />

          <Text style={styles.sectionTitle}>Address Information</Text>

          <ProfileField
            label="Address"
            value={formData.address}
            field="address"
            placeholder="Enter your complete address"
            icon="location"
            multiline={true}
            isEditing={editing}
            onChangeText={handleInputChange}
            keyboardType="default"
          />

          <ProfileField
            label="City"
            value={formData.city}
            field="city"
            placeholder="Enter your city"
            icon="location-outline"
            isEditing={editing}
            onChangeText={handleInputChange}
            keyboardType="default"
          />

          <ProfileField
            label="State"
            value={formData.state}
            field="state"
            placeholder="Enter your state"
            icon="map"
            isEditing={editing}
            onChangeText={handleInputChange}
            keyboardType="default"
          />

          <ProfileField
            label="Pincode"
            value={formData.pincode}
            field="pincode"
            placeholder="Enter pincode"
            icon="pin"
            isEditing={editing}
            onChangeText={handleInputChange}
            keyboardType="number-pad"
          />
        </View>

        {/* Action Buttons - Conditional based on mandatory completion */}
        {editing && (
          <View style={styles.actionButtons}>
            {/* Only show cancel button if not in mandatory completion mode */}
            {!(isMandatoryCompletion && !isProfileComplete) && (
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.saveButton,
                // Full width if no cancel button
                (isMandatoryCompletion && !isProfileComplete) && styles.saveButtonFullWidth
              ]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 
                 isMandatoryCompletion ? 'Complete Profile' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  profilePictureSection: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 32,
    marginBottom: 16,
  },
  profilePicture: {
    width: 100,
    height: 100,
    backgroundColor: '#dbeafe',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 12,
  },
  subscriptionBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'center',
  },
  activeBadge: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  trialBadge: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  subscriptionText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activeText: {
    color: '#15803d',
  },
  trialText: {
    color: '#d97706',
  },
  formContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    marginTop: 8,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fieldInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fieldIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    padding: 0,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  fieldValue: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonFullWidth: {
    flex: 0,
    width: '100%',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
