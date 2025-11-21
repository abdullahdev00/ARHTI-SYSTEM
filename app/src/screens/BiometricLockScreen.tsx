import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBiometric } from '../contexts/BiometricContext';

const { width, height } = Dimensions.get('window');

interface BiometricLockScreenProps {
    onUnlock: () => void;
}

/**
 * ✅ PROFESSIONAL BIOMETRIC LOCK SCREEN
 * - Beautiful UI with gradient-like design
 * - Fingerprint/Face ID authentication
 * - Retry mechanism
 * - Fallback to manual unlock
 */
const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({ onUnlock }) => {
    const { authenticate, isAuthenticating, biometricType, isBiometricEnabled, verifyPIN, hasPIN } = useBiometric();
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockMessage, setLockMessage] = useState('');
    const [showPINModal, setShowPINModal] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');

    // Auto-trigger biometric on mount
    useEffect(() => {
        if (isBiometricEnabled) {
            triggerBiometric();
        }
    }, []);

    const triggerBiometric = async () => {
        try {
            const success = await authenticate();
            if (success) {
                onUnlock();
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);

                if (newAttempts >= 3) {
                    setIsLocked(true);
                    setLockMessage('Too many failed attempts. Try again in 30 seconds.');
                    setTimeout(() => {
                        setIsLocked(false);
                        setAttempts(0);
                        setLockMessage('');
                    }, 30000);
                } else {
                    setLockMessage(`Failed. ${3 - newAttempts} attempts remaining`);
                }
            }
        } catch (error) {
            console.error('Biometric error:', error);
        }
    };

    const handleManualUnlock = () => {
        setShowPINModal(true);
        setPinInput('');
        setPinError('');
    };

    const handlePINSubmit = async () => {
        if (pinInput.length !== 4) {
            setPinError('PIN must be 4 digits');
            return;
        }

        if (!hasPIN) {
            setPinError('No PIN set. Please set a PIN in Settings.');
            return;
        }

        // Verify PIN against stored PIN
        const isValid = await verifyPIN(pinInput);
        if (isValid) {
            setPinError('');
            setPinInput('');
            setShowPINModal(false);
            onUnlock();
        } else {
            setPinError('Invalid PIN. Try again.');
            setPinInput('');
        }
    };

    const handlePINCancel = () => {
        setShowPINModal(false);
        setPinInput('');
        setPinError('');
    };

    return (
        <View style={styles.container}>
            {/* Background gradient effect */}
            <View style={styles.background}>
                <View style={styles.topCircle} />
                <View style={styles.bottomCircle} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Lock Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconBackground}>
                        <Ionicons
                            name={isLocked ? 'lock-closed' : 'finger-print'}
                            size={64}
                            color="#2196F3"
                        />
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>ARHTI System</Text>
                <Text style={styles.subtitle}>Biometric Lock</Text>

                {/* Status Message */}
                {lockMessage ? (
                    <Text style={[styles.statusMessage, isLocked && styles.errorMessage]}>
                        {lockMessage}
                    </Text>
                ) : (
                    <Text style={styles.statusMessage}>
                        {isAuthenticating ? 'Verifying...' : `Use ${biometricType || 'biometric'} to unlock`}
                    </Text>
                )}

                {/* Biometric Button */}
                <TouchableOpacity
                    style={[
                        styles.biometricButton,
                        isAuthenticating && styles.biometricButtonDisabled,
                        isLocked && styles.biometricButtonLocked,
                    ]}
                    onPress={triggerBiometric}
                    disabled={isAuthenticating || isLocked}
                >
                    {isAuthenticating ? (
                        <ActivityIndicator size="large" color="white" />
                    ) : (
                        <>
                            <Ionicons name="finger-print" size={48} color="white" />
                            <Text style={styles.biometricButtonText}>
                                {isLocked ? 'Locked' : 'Tap to Authenticate'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Attempts Counter */}
                {attempts > 0 && !isLocked && (
                    <Text style={styles.attemptsText}>
                        Attempts: {attempts}/3
                    </Text>
                )}

                {/* Manual Unlock Option */}
                <TouchableOpacity
                    style={styles.manualUnlockButton}
                    onPress={handleManualUnlock}
                    disabled={isLocked}
                >
                    <Ionicons name="keypad-outline" size={20} color="#2196F3" />
                    <Text style={styles.manualUnlockText}>Enter PIN</Text>
                </TouchableOpacity>
            </View>

            {/* Footer Info */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>Secure Authentication</Text>
            </View>

            {/* PIN Modal */}
            <Modal
                visible={showPINModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handlePINCancel}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Enter PIN</Text>
                            <Text style={styles.modalSubtitle}>Enter your 4-digit PIN to unlock</Text>

                            <TextInput
                                style={styles.pinInput}
                                placeholder="0000"
                                placeholderTextColor="#ccc"
                                keyboardType="number-pad"
                                secureTextEntry={true}
                                maxLength={4}
                                value={pinInput}
                                onChangeText={setPinInput}
                                editable={!isLocked}
                            />

                            {pinError ? (
                                <Text style={styles.pinError}>{pinError}</Text>
                            ) : null}

                            <View style={styles.modalButtonContainer}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={handlePINCancel}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.submitButton]}
                                    onPress={handlePINSubmit}
                                    disabled={pinInput.length !== 4 || isLocked}
                                >
                                    <Text style={styles.submitButtonText}>Unlock</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    topCircle: {
        position: 'absolute',
        width: width * 1.5,
        height: width * 1.5,
        borderRadius: width * 0.75,
        backgroundColor: '#e3f2fd',
        top: -width * 0.5,
        left: -width * 0.25,
    },
    bottomCircle: {
        position: 'absolute',
        width: width * 1.2,
        height: width * 1.2,
        borderRadius: width * 0.6,
        backgroundColor: '#e8f5e9',
        bottom: -width * 0.4,
        right: -width * 0.2,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        zIndex: 1,
    },
    iconContainer: {
        marginBottom: 40,
    },
    iconBackground: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1c1c1e',
        marginBottom: 4,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginBottom: 24,
    },
    statusMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
        minHeight: 20,
    },
    errorMessage: {
        color: '#f44336',
        fontWeight: '600',
    },
    biometricButton: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    biometricButtonDisabled: {
        opacity: 0.7,
    },
    biometricButtonLocked: {
        backgroundColor: '#ccc',
        shadowColor: '#999',
    },
    biometricButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'white',
        marginTop: 8,
        textAlign: 'center',
    },
    attemptsText: {
        fontSize: 12,
        color: '#f44336',
        fontWeight: '600',
        marginBottom: 16,
    },
    manualUnlockButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#2196F3',
        marginTop: 16,
    },
    manualUnlockText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2196F3',
        marginLeft: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 32,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
    },
    // PIN Modal Styles
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '85%',
        maxWidth: 320,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1c1c1e',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center',
    },
    pinInput: {
        width: '100%',
        height: 56,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
        color: '#1c1c1e',
        marginBottom: 12,
        letterSpacing: 8,
    },
    pinError: {
        fontSize: 12,
        color: '#f44336',
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        marginTop: 8,
    },
    modalButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    submitButton: {
        backgroundColor: '#2196F3',
    },
    submitButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
});

export default BiometricLockScreen;
