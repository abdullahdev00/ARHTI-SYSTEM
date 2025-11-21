import React from 'react';
import { View, TextInput, TouchableOpacity, useColorScheme, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchFilterBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    filterCount: number;
    onFilterPress: () => void;
    onClose?: () => void;
}

/**
 * WHATSAPP-STYLE SEARCH FILTER BAR
 * Professional white/dark theme
 * Glass morphism effects
 * Compact design for maximum screen space
 * Touch-optimized interactions
 * ✅ Compact design for maximum screen space
 * ✅ Touch-optimized interactions
 */
export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
    searchQuery,
    onSearchChange,
    filterCount,
    onFilterPress,
    onClose,
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            {/* ← Back Button */}
            {onClose && (
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onClose}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="arrow-back"
                        size={22}
                        color={isDark ? 'white' : '#1c1c1e'}
                    />
                </TouchableOpacity>
            )}

            {/* 🔍 Search Input */}
            <View style={[styles.searchContainer, isDark && styles.searchContainerDark]}>
                <Ionicons
                    name="search"
                    size={18}
                    color={isDark ? '#8e8e93' : '#8e8e93'}
                    style={styles.searchIcon}
                />
                <TextInput
                    style={[styles.searchInput, isDark && styles.searchInputDark]}
                    placeholder="Search partners..."
                    placeholderTextColor={isDark ? '#8e8e93' : '#8e8e93'}
                    value={searchQuery}
                    onChangeText={onSearchChange}
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                    autoFocus={true}
                />
            </View>

            {/* 🎛️ Filter Button */}
            <TouchableOpacity
                style={[styles.filterButton, isDark && styles.filterButtonDark]}
                onPress={onFilterPress}
                activeOpacity={0.7}
            >
                <Ionicons
                    name="options"
                    size={18}
                    color={filterCount > 0 ? '#10b981' : (isDark ? '#8e8e93' : '#8e8e93')}
                />
                {filterCount > 0 && (
                    <View style={styles.filterBadge}>
                        <View style={styles.filterBadgeInner} />
                    </View>
                )}
            </TouchableOpacity>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 44, // Below status bar
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e5e5e7',
        gap: 12,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    containerDark: {
        backgroundColor: '#1c1c1e',
        borderBottomColor: '#38383a',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f2f2f7',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    searchContainerDark: {
        backgroundColor: '#38383a',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1c1c1e',
        padding: 0,
    },
    searchInputDark: {
        color: 'white',
    },
    filterButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f2f2f7',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    filterButtonDark: {
        backgroundColor: '#38383a',
    },
    filterBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterBadgeInner: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'white',
    },
});
