import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    Modal,
    useColorScheme,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { observer } from '@legendapp/state/react';
import { useWatermelonPartners } from '../hooks/useWatermelonPartners';
import { useWatermelonRoles } from '../hooks/useWatermelonRoles';
import { CapsuleButton } from './ui';
import { showErrorToast, showSuccessToast } from '../utils/toastUtils';

interface AddPartnerBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    partnerId?: string; // If provided, edit mode
}

/**
 * ✅ ADD/EDIT PARTNER BOTTOM SHEET
 * - Slide up from bottom
 * - All features from AddPartnerScreen
 * - Real-time role sync
 * - Professional UX
 */
const AddPartnerBottomSheet: React.FC<AddPartnerBottomSheetProps> = observer(({
    visible,
    onClose,
    partnerId,
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Hooks - Use WatermelonDB for instant local creation
    const { createPartner, updatePartner, partners, isLoading } = useWatermelonPartners();
    const { roles, isLoading: isLoadingRoles, createRole, updateRole, deleteRole } = useWatermelonRoles();

    // Memoize to prevent excessive re-renders
    const memoizedCreatePartner = useCallback(createPartner, [createPartner]);
    const memoizedUpdatePartner = useCallback(updatePartner, [updatePartner]);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
    });
    const [selectedType, setSelectedType] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAddTypeModal, setShowAddTypeModal] = useState(false);
    const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
    const [newTypeData, setNewTypeData] = useState({
        name: '',
        icon: 'person-outline',
        color: '#6b7280',
    });

    const isEditing = !!partnerId;

    // ✅ Memoize roles to prevent unnecessary re-renders
    const memoizedRoles = useMemo(() => roles, [roles.length, roles.map(r => r.id).join(',')]);

    // ✅ Set default role when roles load (only once)
    useEffect(() => {
        if (memoizedRoles.length > 0 && !selectedType) {
            setSelectedType(memoizedRoles[0].id);
        }
    }, []);

    // ✅ Load partner data when editing
    useEffect(() => {
        if (isEditing && partnerId) {
            const partnerToEdit = partners.find(p => p.id === partnerId);
            if (partnerToEdit) {
                setFormData({
                    name: partnerToEdit.name || '',
                    phone: partnerToEdit.phone || '',
                    address: partnerToEdit.address || '',
                });
                setSelectedType(partnerToEdit.role || (roles[0]?.id || ''));
            }
        }
    }, [isEditing, partnerId, roles]);

    // ✅ Reset form when modal closes
    useEffect(() => {
        if (!visible) {
            setFormData({ name: '', phone: '', address: '' });
            setSelectedType(roles[0]?.id || '');
            setEditingTypeId(null);
            setNewTypeData({ name: '', icon: 'person-outline', color: '#6b7280' });
        }
    }, [visible]);

    // ✅ Form validation
    const validateForm = () => {
        if (!formData.name.trim()) {
            Alert.alert('Validation Error', 'Partner name is required');
            return false;
        }

        if (formData.phone && formData.phone.length < 10) {
            Alert.alert('Validation Error', 'Please enter a valid phone number');
            return false;
        }

        return true;
    };

    // ✅ Format phone number
    const formatPhoneNumber = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.startsWith('92')) {
            return cleaned.slice(0, 13);
        }
        return cleaned.slice(0, 11);
    };

    // ✅ Handle long press on role
    const handleLongPress = (typeId: string) => {
        const type = memoizedRoles.find(t => t.id === typeId);
        if (!type) return;

        Alert.alert(
            type.name,
            'What would you like to do?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Edit',
                    onPress: () => {
                        setEditingTypeId(typeId);
                        setNewTypeData({
                            name: type.name,
                            icon: type.icon || 'person-outline',
                            color: type.color || '#6b7280',
                        });
                        setShowAddTypeModal(true);
                    },
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => handleDeleteType(typeId),
                },
            ]
        );
    };

    // ✅ Delete role
    const handleDeleteType = (typeId: string) => {
        Alert.alert(
            'Delete Role',
            'Are you sure you want to delete this role?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const typeToDelete = memoizedRoles.find(t => t.id === typeId);
                            if (!typeToDelete) return;

                            console.log('🗑️ Deleting role:', typeToDelete.name);
                            await deleteRole(typeId);
                            console.log('✅ Role deleted successfully');

                            if (selectedType === typeId && memoizedRoles.length > 1) {
                                const remainingRole = memoizedRoles.find(t => t.id !== typeId);
                                if (remainingRole) {
                                    setSelectedType(remainingRole.id);
                                }
                            }
                            showSuccessToast('Role deleted successfully!');
                        } catch (error) {
                            console.error('❌ Failed to delete role:', error);
                            showErrorToast('Failed to delete role. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    // ✅ Add new role
    const handleAddNewType = async () => {
        if (!newTypeData.name.trim()) {
            Alert.alert('Validation Error', 'Role name is required');
            return;
        }

        try {
            console.log('➕ Creating new role:', newTypeData.name);
            const newRole = await createRole({
                name: newTypeData.name.trim(),
                icon: newTypeData.icon,
                color: newTypeData.color,
            });
            if (newRole) {
                setSelectedType(newRole.id);
            }
            setShowAddTypeModal(false);
            setNewTypeData({
                name: '',
                icon: 'person-outline',
                color: '#6b7280',
            });

            showSuccessToast(`${newTypeData.name.trim()} role added successfully!`);
        } catch (error) {
            console.error('❌ Failed to add role:', error);
            showErrorToast('Failed to add role. Please try again.');
        }
    };

    // ✅ Edit role
    const handleEditType = async () => {
        if (!newTypeData.name.trim() || !editingTypeId) {
            Alert.alert('Validation Error', 'Role name is required');
            return;
        }

        try {
            console.log('✏️ Updating role:', editingTypeId);
            await updateRole(editingTypeId, {
                name: newTypeData.name.trim(),
                icon: newTypeData.icon,
                color: newTypeData.color,
            });

            setShowAddTypeModal(false);
            setEditingTypeId(null);
            setNewTypeData({
                name: '',
                icon: 'person-outline',
                color: '#6b7280',
            });

            showSuccessToast('Role updated successfully!');
        } catch (error) {
            console.error('❌ Failed to update role:', error);
            showErrorToast('Failed to update role. Please try again.');
        }
    };

    // ✅ Submit form - Local-first with WatermelonDB
    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const selectedTypeData = memoizedRoles.find(type => type.id === selectedType);
            const roleName = selectedTypeData?.name || 'Partner';

            console.log('📝 Submitting partner:', {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                address: formData.address.trim(),
                role: roleName,
                isEditing
            });

            if (isEditing && partnerId) {
                console.log('✏️ Updating partner:', partnerId);
                await updatePartner(partnerId, {
                    name: formData.name.trim(),
                    phone: formData.phone.trim(),
                    address: formData.address.trim(),
                    role: selectedType,
                });

                console.log('✅ Partner updated successfully');
                showSuccessToast(`${roleName} updated successfully!`);
                onClose();
            } else {
                console.log('➕ Creating new partner');
                await createPartner({
                    name: formData.name.trim(),
                    phone: formData.phone.trim(),
                    address: formData.address.trim(),
                    role: selectedType,
                });

                console.log('✅ Partner created successfully');
                showSuccessToast(`${roleName} added successfully!`);
                onClose();
            }
        } catch (error) {
            console.error('❌ Add/Edit partner error:', error);
            showErrorToast('Failed to save partner. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={[styles.container, isDark && styles.containerDark]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                enabled={true}
            >
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={() => {
                        Keyboard.dismiss();
                        onClose();
                    }}
                />

                <View style={[styles.bottomSheet, isDark && styles.bottomSheetDark]}>
                    {/* Handle Bar */}
                    <View style={styles.handleContainer}>
                        <View style={styles.handleBar} />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, isDark && styles.titleDark]}>
                            {isEditing ? 'Edit Partner' : 'Add Partner'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={isDark ? 'white' : '#1c1c1e'} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        scrollEnabled={true}
                        contentContainerStyle={{ paddingBottom: 300 }}
                    >
                        {/* Role Selection */}
                        <View style={styles.section}>
                            <Text style={[styles.label, isDark && styles.labelDark]}>Partner Type</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.rolesScroll}
                                contentContainerStyle={styles.rolesContainer}
                            >
                                {memoizedRoles.map((role) => (
                                    <TouchableOpacity
                                        key={role.id}
                                        style={[
                                            styles.roleButton,
                                            selectedType === role.id && styles.roleButtonSelected,
                                            isDark && styles.roleButtonDark,
                                        ]}
                                        onPress={() => setSelectedType(role.id)}
                                        onLongPress={() => handleLongPress(role.id)}
                                    >
                                        <Text
                                            style={[
                                                styles.roleText,
                                                selectedType === role.id && styles.roleTextSelected,
                                                isDark && styles.roleTextDark,
                                            ]}
                                        >
                                            {role.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}

                                {/* Add Role Button */}
                                <TouchableOpacity
                                    style={[styles.addRoleButton, isDark && styles.addRoleButtonDark]}
                                    onPress={() => setShowAddTypeModal(true)}
                                >
                                    <Ionicons name="add" size={18} color="#10b981" />
                                </TouchableOpacity>
                            </ScrollView>
                        </View>

                        {/* Name Field */}
                        <View style={styles.section}>
                            <Text style={[styles.label, isDark && styles.labelDark]}>Full Name *</Text>
                            <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
                                <Ionicons name="person-outline" size={20} color="#6b7280" />
                                <TextInput
                                    style={[styles.input, isDark && styles.inputDark]}
                                    value={formData.name}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                                    placeholder="Enter full name"
                                    placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

                        {/* Phone Field */}
                        <View style={styles.section}>
                            <Text style={[styles.label, isDark && styles.labelDark]}>Phone Number</Text>
                            <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
                                <Ionicons name="call-outline" size={20} color="#6b7280" />
                                <TextInput
                                    style={[styles.input, isDark && styles.inputDark]}
                                    value={formData.phone}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, phone: formatPhoneNumber(text) }))}
                                    placeholder="03001234567"
                                    placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        {/* Address Field */}
                        <View style={styles.section}>
                            <Text style={[styles.label, isDark && styles.labelDark]}>Address</Text>
                            <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
                                <Ionicons name="location-outline" size={20} color="#6b7280" />
                                <TextInput
                                    style={[styles.input, isDark && styles.inputDark]}
                                    value={formData.address}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                                    placeholder="Enter address"
                                    placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                                    multiline
                                    numberOfLines={2}
                                />
                            </View>
                        </View>
                    </ScrollView>

                    {/* Button */}
                    <View style={styles.buttonContainer}>
                        <CapsuleButton
                            title={isSubmitting ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Partner' : 'Add Partner')}
                            onPress={handleSubmit}
                            variant="primary"
                            size="large"
                            disabled={isSubmitting || isLoading}
                        />
                    </View>

                    {/* Add Role Modal */}
                    <AddRoleModal
                        visible={showAddTypeModal}
                        onClose={() => {
                            setShowAddTypeModal(false);
                            setEditingTypeId(null);
                            setNewTypeData({
                                name: '',
                                icon: 'person-outline',
                                color: '#6b7280',
                            });
                        }}
                        editingTypeId={editingTypeId}
                        initialData={newTypeData}
                    />
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
});

interface AddRoleModalProps {
    visible: boolean;
    onClose: () => void;
    editingTypeId?: string | null;
    initialData?: {
        name: string;
        icon: string;
        color: string;
    };
}

export const AddRoleModal: React.FC<AddRoleModalProps> = observer(({
    visible,
    onClose,
    editingTypeId,
    initialData
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { createRole, updateRole } = useWatermelonRoles();

    const [newTypeData, setNewTypeData] = useState({
        name: '',
        icon: 'person-outline',
        color: '#6b7280',
    });

    useEffect(() => {
        if (initialData) {
            setNewTypeData(initialData);
        }
    }, [initialData, visible]);

    // ✅ Add new role
    const handleAddNewType = async () => {
        if (!newTypeData.name.trim()) {
            Alert.alert('Validation Error', 'Role name is required');
            return;
        }

        try {
            console.log('➕ Creating new role:', newTypeData.name);
            await createRole({
                name: newTypeData.name.trim(),
                icon: newTypeData.icon,
                color: newTypeData.color,
            });

            showSuccessToast(`${newTypeData.name.trim()} role added successfully!`);
            onClose();
        } catch (error) {
            console.error('❌ Failed to add role:', error);
            showErrorToast('Failed to add role. Please try again.');
        }
    };

    // ✅ Edit role
    const handleEditType = async () => {
        if (!newTypeData.name.trim() || !editingTypeId) {
            Alert.alert('Validation Error', 'Role name is required');
            return;
        }

        try {
            console.log('✏️ Updating role:', editingTypeId);
            await updateRole(editingTypeId, {
                name: newTypeData.name.trim(),
                icon: newTypeData.icon,
                color: newTypeData.color,
            });

            showSuccessToast('Role updated successfully!');
            onClose();
        } catch (error) {
            console.error('❌ Failed to update role:', error);
            showErrorToast('Failed to update role. Please try again.');
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => {
                        Keyboard.dismiss();
                        onClose();
                    }}
                />
                <View style={[styles.bottomSheet, isDark && styles.bottomSheetDark]}>
                    <View style={styles.handleContainer}>
                        <View style={styles.handleBar} />
                    </View>

                    <View style={styles.header}>
                        <Text style={[styles.title, isDark && styles.titleDark]}>
                            {editingTypeId ? 'Edit Role' : 'Add New Role'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={isDark ? 'white' : '#1c1c1e'} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <View style={styles.section}>
                            <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
                                <Ionicons name="person-outline" size={20} color="#6b7280" />
                                <TextInput
                                    style={[styles.input, isDark && styles.inputDark]}
                                    value={newTypeData.name}
                                    onChangeText={(text) => setNewTypeData(prev => ({ ...prev, name: text }))}
                                    placeholder="e.g., Customer, Supplier"
                                    placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                                    autoFocus
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <CapsuleButton
                            title={editingTypeId ? 'Update Role' : 'Add Role'}
                            onPress={editingTypeId ? handleEditType : handleAddNewType}
                            variant="primary"
                            size="large"
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    containerDark: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    backdrop: {
        flex: 1,
    },
    bottomSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '95%',
        minHeight: '75%',
        paddingBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    bottomSheetDark: {
        backgroundColor: '#1c1c1e',
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: '#d1d5db',
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1c1c1e',
        letterSpacing: 0.3,
    },
    titleDark: {
        color: 'white',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    labelDark: {
        color: '#d1d5db',
    },
    rolesScroll: {
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },
    rolesContainer: {
        gap: 8,
        paddingRight: 16,
    },
    roleButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    roleButtonSelected: {
        backgroundColor: '#dcfce7',
        borderColor: '#10b981',
    },
    roleButtonDark: {
        backgroundColor: '#374151',
    },
    roleText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
    roleTextSelected: {
        color: '#10b981',
        fontWeight: '600',
    },
    roleTextDark: {
        color: '#d1d5db',
    },
    addRoleButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addRoleButtonDark: {
        backgroundColor: '#064e3b',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    inputContainerDark: {
        backgroundColor: '#374151',
        borderColor: '#4b5563',
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#1c1c1e',
    },
    inputDark: {
        color: 'white',
    },
    buttonContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 24,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        flex: 1,
    },
});

export default AddPartnerBottomSheet;
