import React from 'react';
import { TouchableOpacity, Text, useColorScheme, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface CapsuleButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

/**
 * 🎨 PROFESSIONAL CAPSULE BUTTON
 * ✅ Perfect pill/capsule shape
 * ✅ Multiple variants and sizes
 * ✅ Professional colors and shadows
 * ✅ Dark mode compatible
 * ✅ Touch optimized
 */
export const CapsuleButton: React.FC<CapsuleButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    style,
    textStyle,
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const buttonStyles = [
        styles.button,
        styles[size],
        disabled ? styles.disabled :
            variant === 'primary' ? styles.primary :
                variant === 'secondary' ? (isDark ? styles.secondaryDark : styles.secondary) :
                    variant === 'outline' ? (isDark ? styles.outlineDark : styles.outline) :
                        variant === 'danger' ? styles.danger : {}
    ];

    const textStyles = [
        styles.text,
        styles[`${size}Text` as keyof typeof styles],
        disabled ? styles.disabledText :
            (variant === 'primary' || variant === 'danger') ? styles.whiteText :
                variant === 'secondary' ? (isDark ? styles.whiteText : styles.darkText) :
                    variant === 'outline' ? styles.primaryText : {}
    ];

    return (
        <TouchableOpacity
            style={[buttonStyles, style]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
        >
            <Text style={[textStyles, textStyle]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    // Base button styles
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    // Size variants
    small: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16, // height/2 for perfect capsule
        minHeight: 32,
    },
    medium: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24, // height/2 for perfect capsule
        minHeight: 48,
    },
    large: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 28, // height/2 for perfect capsule
        minHeight: 56,
    },

    // Color variants
    primary: {
        backgroundColor: '#10b981',
    },
    secondary: {
        backgroundColor: '#f2f2f7',
    },
    secondaryDark: {
        backgroundColor: '#2c2c2e',
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#10b981',
    },
    outlineDark: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#10b981',
    },
    danger: {
        backgroundColor: '#ef4444',
    },
    disabled: {
        backgroundColor: '#e5e5e7',
        shadowOpacity: 0,
        elevation: 0,
    },

    // Text styles
    text: {
        fontWeight: '600',
        textAlign: 'center',
    },
    smallText: {
        fontSize: 14,
    },
    mediumText: {
        fontSize: 16,
    },
    largeText: {
        fontSize: 18,
    },
    whiteText: {
        color: 'white',
    },
    darkText: {
        color: '#1c1c1e',
    },
    primaryText: {
        color: '#10b981',
    },
    disabledText: {
        color: '#8e8e93',
    },
});
