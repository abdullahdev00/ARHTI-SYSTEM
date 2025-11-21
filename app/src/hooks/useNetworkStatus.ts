/**
 * Network Status Hook
 * Detects network connectivity and triggers sync when coming online
 */

import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncMessageService } from '../services/syncMessageService';
import { useAuth } from '../contexts/SupabaseAuthContext';

export const useNetworkStatus = () => {
    const { userProfile } = useAuth();
    const [isOnline, setIsOnline] = useState(true);
    const [isCheckingNetwork, setIsCheckingNetwork] = useState(false);

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        const setupNetworkListener = async () => {
            try {
                // Check initial network state
                const state = await NetInfo.fetch();
                const initialOnline = state.isConnected && state.isInternetReachable;
                setIsOnline(initialOnline);

                // Subscribe to network changes
                unsubscribe = NetInfo.addEventListener((state) => {
                    const wasOffline = !isOnline;
                    const isNowOnline = state.isConnected && state.isInternetReachable;

                    console.log(`🌐 Network status: ${isNowOnline ? 'ONLINE' : 'OFFLINE'}`);

                    setIsOnline(isNowOnline);

                    // If coming back online, process offline messages
                    if (wasOffline && isNowOnline && userProfile?.id) {
                        console.log('🔌 Back online! Processing offline messages...');
                        setIsCheckingNetwork(true);

                        syncMessageService
                            .processOfflineMessages(userProfile.id)
                            .finally(() => {
                                setIsCheckingNetwork(false);
                            });
                    }
                });
            } catch (error) {
                console.error('❌ Error setting up network listener:', error);
            }
        };

        setupNetworkListener();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [isOnline, userProfile?.id]);

    return { isOnline, isCheckingNetwork };
};
