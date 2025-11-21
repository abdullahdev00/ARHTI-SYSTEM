import React from 'react';
import { TouchableOpacity, useColorScheme, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FloatingActionButtonProps {
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
}

/**
 * 🎨 WHATSAPP-STYLE FLOATING ACTION BUTTON
 * ✅ Positioned above bottom tab bar
 * ✅ WhatsApp green color
 * ✅ Professional shadows
 * ✅ Touch optimized
 */
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
    onPress,
    icon = 'add',
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <TouchableOpacity
            style={[styles.container, isDark && styles.containerDark]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Ionicons name={icon} size={24} color="white" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30, // Closer to bottom tab bar
        right: 20,
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
        zIndex: 1000,
    },
    containerDark: {
        shadowOpacity: 0.4,
    },
});
