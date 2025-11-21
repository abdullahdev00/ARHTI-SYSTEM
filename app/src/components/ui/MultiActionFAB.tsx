import React, { useState, useRef } from 'react';
import {
    TouchableOpacity,
    useColorScheme,
    StyleSheet,
    View,
    Animated,
    Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface MultiActionFABProps {
    onCreateStock: () => void;
    onBuy: () => void;
    onSell: () => void;
}

/**
 * 🎨 MULTI-ACTION FLOATING BUTTON
 * ✅ 3 action buttons with smooth animation
 * ✅ Circular expansion pattern
 * ✅ Professional shadows and styling
 * ✅ Dark mode support
 */
export const MultiActionFAB: React.FC<MultiActionFABProps> = ({
    onCreateStock,
    onBuy,
    onSell,
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const [isExpanded, setIsExpanded] = useState(false);

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    const toggleExpand = () => {
        if (isExpanded) {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
        setIsExpanded(!isExpanded);
    };

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    const handleCreateStock = () => {
        toggleExpand();
        onCreateStock();
    };

    const handleBuy = () => {
        toggleExpand();
        onBuy();
    };

    const handleSell = () => {
        toggleExpand();
        onSell();
    };

    return (
        <View style={[styles.container, { bottom: insets.bottom + 20, right: 20 }]}>
            {/* Backdrop */}
            {isExpanded && (
                <TouchableOpacity
                    style={styles.backdrop}
                    onPress={toggleExpand}
                    activeOpacity={0}
                />
            )}

            {/* Action Buttons - Stacked Vertically */}
            {/* Create Stock Button */}
            <Animated.View
                style={[
                    styles.actionButtonContainer,
                    {
                        opacity: scaleAnim,
                        transform: [
                            {
                                translateY: scaleAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -70],
                                }),
                            },
                        ],
                    },
                ]}
                pointerEvents={isExpanded ? 'auto' : 'none'}
            >
                <TouchableOpacity
                    style={[styles.actionButton, styles.createBtn, isDark && styles.actionButtonDark]}
                    onPress={handleCreateStock}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add-circle" size={24} color="white" />
                </TouchableOpacity>
            </Animated.View>

            {/* Buy Button */}
            <Animated.View
                style={[
                    styles.actionButtonContainer,
                    {
                        opacity: scaleAnim,
                        transform: [
                            {
                                translateY: scaleAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -140],
                                }),
                            },
                        ],
                    },
                ]}
                pointerEvents={isExpanded ? 'auto' : 'none'}
            >
                <TouchableOpacity
                    style={[styles.actionButton, styles.buyBtn, isDark && styles.actionButtonDark]}
                    onPress={handleBuy}
                    activeOpacity={0.8}
                >
                    <Ionicons name="cart" size={24} color="white" />
                </TouchableOpacity>
            </Animated.View>

            {/* Sell Button */}
            <Animated.View
                style={[
                    styles.actionButtonContainer,
                    {
                        opacity: scaleAnim,
                        transform: [
                            {
                                translateY: scaleAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -210],
                                }),
                            },
                        ],
                    },
                ]}
                pointerEvents={isExpanded ? 'auto' : 'none'}
            >
                <TouchableOpacity
                    style={[styles.actionButton, styles.sellBtn, isDark && styles.actionButtonDark]}
                    onPress={handleSell}
                    activeOpacity={0.8}
                >
                    <Ionicons name="cash" size={24} color="white" />
                </TouchableOpacity>
            </Animated.View>

            {/* Main FAB Button */}
            <Animated.View
                style={[
                    styles.mainButton,
                    {
                        transform: [{ rotate: rotateInterpolate }],
                    },
                ]}
            >
                <TouchableOpacity
                    style={[styles.mainButtonContent, isDark && styles.mainButtonDark]}
                    onPress={toggleExpand}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={28} color="white" />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: 56,
        height: 56,
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
    },
    mainButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 56,
        height: 56,
    },
    mainButtonContent: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    mainButtonDark: {
        shadowOpacity: 0.4,
    },
    actionButtonContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        flexDirection: 'row',
        gap: 4,
    },
    actionButtonDark: {
        shadowOpacity: 0.35,
    },
    createBtn: {
        backgroundColor: '#3b82f6', // Blue
    },
    buyBtn: {
        backgroundColor: '#10b981', // Green
    },
    sellBtn: {
        backgroundColor: '#f59e0b', // Orange
    },
    actionLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: 'white',
    },
});
