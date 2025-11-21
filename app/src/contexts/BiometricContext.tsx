import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Try to import expo-local-authentication, fallback if not available
let LocalAuthentication: any = null;
try {
    LocalAuthentication = require('expo-local-authentication');
} catch (error) {
    console.warn('expo-local-authentication not available, biometric will be disabled');
}

interface BiometricContextType {
    isBiometricAvailable: boolean;
    isBiometricEnabled: boolean;
    isAuthenticating: boolean;
    enableBiometric: () => Promise<boolean>;
    disableBiometric: () => Promise<void>;
    authenticate: () => Promise<boolean>;
    biometricType: string | null;
    verifyPIN: (pin: string) => Promise<boolean>;
    setPIN: (newPin: string) => Promise<boolean>;
    hasPIN: boolean;
}

const BiometricContext = createContext<BiometricContextType | undefined>(undefined);

export const BiometricProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [biometricType, setBiometricType] = useState<string | null>(null);
    const [hasPIN, setHasPIN] = useState(false);

    // Check biometric availability on mount
    useEffect(() => {
        const checkBiometricAvailability = async () => {
            try {
                if (!LocalAuthentication) {
                    setIsBiometricAvailable(false);
                    return;
                }
                const compatible = await LocalAuthentication.hasHardwareAsync();
                setIsBiometricAvailable(compatible);

                if (compatible && LocalAuthentication) {
                    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
                    const typeNames = types
                        .map((type: any) => {
                            switch (type) {
                                case LocalAuthentication.AuthenticationType.FINGERPRINT:
                                    return 'Fingerprint';
                                case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
                                    return 'Face ID';
                                case LocalAuthentication.AuthenticationType.IRIS:
                                    return 'Iris';
                                default:
                                    return 'Biometric';
                            }
                        })
                        .join(' / ');
                    setBiometricType(typeNames);
                }

                // Load biometric preference from storage
                const enabled = await AsyncStorage.getItem('biometricEnabled');
                setIsBiometricEnabled(enabled === 'true');

                // Load PIN preference from storage
                const pinExists = await AsyncStorage.getItem('userPIN');
                setHasPIN(pinExists !== null);
            } catch (error) {
                console.error('Error checking biometric availability:', error);
                setIsBiometricAvailable(false);
            }
        };

        checkBiometricAvailability();
    }, []);

    // Enable biometric authentication
    const enableBiometric = useCallback(async (): Promise<boolean> => {
        if (!isBiometricAvailable || !LocalAuthentication) {
            console.warn('Biometric not available on this device');
            return false;
        }

        try {
            setIsAuthenticating(true);

            // First, authenticate to confirm user identity
            const result = await LocalAuthentication.authenticateAsync({
                disableDeviceFallback: false,
                reason: 'Authenticate to enable biometric lock',
            });

            if (result.success) {
                // Save preference to storage
                await AsyncStorage.setItem('biometricEnabled', 'true');
                setIsBiometricEnabled(true);
                console.log('✅ Biometric authentication enabled');
                return true;
            } else {
                console.log('⚠️ Biometric authentication cancelled');
                return false;
            }
        } catch (error) {
            console.error('Error enabling biometric:', error);
            return false;
        } finally {
            setIsAuthenticating(false);
        }
    }, [isBiometricAvailable]);

    // Disable biometric authentication
    const disableBiometric = useCallback(async (): Promise<void> => {
        try {
            await AsyncStorage.setItem('biometricEnabled', 'false');
            setIsBiometricEnabled(false);
            console.log('✅ Biometric authentication disabled');
        } catch (error) {
            console.error('Error disabling biometric:', error);
        }
    }, []);

    // Authenticate with biometric
    const authenticate = useCallback(async (): Promise<boolean> => {
        if (!isBiometricAvailable || !isBiometricEnabled || !LocalAuthentication) {
            return false;
        }

        try {
            setIsAuthenticating(true);

            const result = await LocalAuthentication.authenticateAsync({
                disableDeviceFallback: true,
                reason: 'Authenticate to access ARHTI System',
            });

            return result.success;
        } catch (error) {
            console.error('Error during biometric authentication:', error);
            return false;
        } finally {
            setIsAuthenticating(false);
        }
    }, [isBiometricAvailable, isBiometricEnabled]);

    // Verify PIN
    const verifyPIN = useCallback(async (pin: string): Promise<boolean> => {
        try {
            const storedPIN = await AsyncStorage.getItem('userPIN');
            return pin === storedPIN;
        } catch (error) {
            console.error('Error verifying PIN:', error);
            return false;
        }
    }, []);

    // Set/Update PIN
    const setPIN = useCallback(async (newPin: string): Promise<boolean> => {
        try {
            if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
                console.warn('PIN must be exactly 4 digits');
                return false;
            }
            await AsyncStorage.setItem('userPIN', newPin);
            setHasPIN(true);
            console.log('✅ PIN set successfully');
            return true;
        } catch (error) {
            console.error('Error setting PIN:', error);
            return false;
        }
    }, []);

    return (
        <BiometricContext.Provider
            value={{
                isBiometricAvailable,
                isBiometricEnabled,
                isAuthenticating,
                enableBiometric,
                disableBiometric,
                authenticate,
                biometricType,
                verifyPIN,
                setPIN,
                hasPIN,
            }}
        >
            {children}
        </BiometricContext.Provider>
    );
};

export const useBiometric = () => {
    const context = useContext(BiometricContext);
    if (!context) {
        throw new Error('useBiometric must be used within BiometricProvider');
    }
    return context;
};
