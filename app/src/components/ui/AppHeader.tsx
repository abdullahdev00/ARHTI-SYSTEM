import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AppHeaderProps {
    title: string;
    showSearch?: boolean;
    onSearchPress?: () => void;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightPress?: () => void;
}

/**
 * 🎨 CONSISTENT APP HEADER
 * ✅ Same height across all pages
 * ✅ Same title position
 * ✅ Optional search icon
 * ✅ Professional styling
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
    title,
    showSearch = false,
    onSearchPress,
    rightIcon,
    onRightPress,
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <View style={styles.header}>
                <View style={styles.leftSection}>
                    <Text style={[styles.title, isDark && styles.titleDark]}>
                        {title}
                    </Text>
                </View>

                <View style={styles.rightSection}>
                    {showSearch && onSearchPress && (
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={onSearchPress}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="search"
                                size={22}
                                color={isDark ? 'white' : '#1c1c1e'}
                            />
                        </TouchableOpacity>
                    )}

                    {rightIcon && onRightPress && (
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={onRightPress}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={rightIcon}
                                size={22}
                                color={isDark ? 'white' : '#1c1c1e'}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        paddingTop: 44, // Status bar height
        paddingBottom: 8,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e5e5e7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    containerDark: {
        backgroundColor: '#1c1c1e',
        borderBottomColor: '#38383a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1c1c1e',
    },
    titleDark: {
        color: 'white',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
