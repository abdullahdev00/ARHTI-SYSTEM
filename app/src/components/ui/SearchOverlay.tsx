import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Animated,
    useColorScheme,
    StyleSheet,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchOverlayProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    filterCount: number;
    onFilterPress: () => void;
    placeholder?: string;
    isVisible: boolean;
    onClose: () => void;
}

/**
 * 🎨 REUSABLE SEARCH OVERLAY COMPONENT
 * ✅ Can be used on any page
 * ✅ Smooth animations
 * ✅ Auto keyboard focus
 * ✅ Filter button integration
 */
export const SearchOverlay: React.FC<SearchOverlayProps> = ({
    searchQuery,
    onSearchChange,
    filterCount,
    onFilterPress,
    placeholder = "Search...",
    isVisible,
    onClose,
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const searchInputRef = useRef<TextInput>(null);
    const animatedValue = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (isVisible) {
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 250,
                useNativeDriver: false,
            }).start(() => {
                searchInputRef.current?.focus();
            });
        } else {
            Keyboard.dismiss();
            Animated.timing(animatedValue, {
                toValue: 0,
                duration: 250,
                useNativeDriver: false,
            }).start();
        }
    }, [isVisible]);

    const handleClose = () => {
        onSearchChange(''); // Clear search
        onClose();
    };

    if (!isVisible) return null;

    const searchOpacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <Animated.View style={[styles.container, isDark && styles.containerDark, { opacity: searchOpacity }]}>
            <View style={styles.searchHeader}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleClose}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color={isDark ? 'white' : '#1c1c1e'}
                    />
                </TouchableOpacity>

                <View style={[styles.searchInputContainer, isDark && styles.searchInputContainerDark]}>
                    <TextInput
                        ref={searchInputRef}
                        style={[styles.searchInput, isDark && styles.searchInputDark]}
                        placeholder={placeholder}
                        placeholderTextColor={isDark ? '#8e8e93' : '#8e8e93'}
                        value={searchQuery}
                        onChangeText={onSearchChange}
                        returnKeyType="search"
                        autoFocus={true}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.filterButton, filterCount > 0 && styles.filterButtonActive]}
                    onPress={onFilterPress}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="options"
                        size={20}
                        color={filterCount > 0 ? '#10b981' : (isDark ? '#8e8e93' : '#8e8e93')}
                    />
                    {filterCount > 0 && (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>{filterCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 44, // Replace header (only status bar height)
        left: 0,
        right: 0,
        backgroundColor: 'white',
        paddingTop: 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e5e5e7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 1000,
    },
    containerDark: {
        backgroundColor: '#1c1c1e',
        borderBottomColor: '#38383a',
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchInputContainer: {
        flex: 1,
        backgroundColor: '#f2f2f7',
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 36,
        justifyContent: 'center',
    },
    searchInputContainerDark: {
        backgroundColor: '#38383a',
    },
    searchInput: {
        fontSize: 16,
        color: '#1c1c1e',
        padding: 0,
    },
    searchInputDark: {
        color: 'white',
    },
    filterButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f2f2f7',
        position: 'relative',
    },
    filterButtonActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    filterBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#10b981',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    filterBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '600',
    },
});
