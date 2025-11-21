import React from 'react';
import { View, TextInput, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchHeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onClose: () => void;
    onFilterPress?: () => void;
    filterCount?: number;
    placeholder?: string;
}

/**
 * REUSABLE SEARCH HEADER COMPONENT
 * WhatsApp-style search header that replaces entire header
 * Can be used in any screen with navigation.setOptions
 * 
 * Usage:
 * navigation.setOptions({
 *   headerTitle: '',
 *   headerLeft: () => (
 *     <SearchHeader
 *       searchQuery={searchQuery}
 *       onSearchChange={setSearchQuery}
 *       onClose={() => setIsSearchVisible(false)}
 *       onFilterPress={() => setIsFilterModalOpen(true)}
 *       filterCount={getActiveFiltersCount()}
 *       placeholder="Search partners..."
 *     />
 *   ),
 *   headerRight: () => null,
 * });
 */
export const SearchHeader: React.FC<SearchHeaderProps> = ({
    searchQuery,
    onSearchChange,
    onClose,
    onFilterPress,
    filterCount = 0,
    placeholder = "Search...",
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            paddingHorizontal: 16,
            marginLeft: 0,
            marginRight: 0,
        }}>
            {/* Back Button */}
            <TouchableOpacity
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                }}
                onPress={onClose}
                activeOpacity={0.7}
            >
                <Ionicons
                    name="arrow-back"
                    size={22}
                    color={isDark ? 'white' : '#1c1c1e'}
                />
            </TouchableOpacity>

            {/* Search Input - Takes Maximum Space */}
            <View style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? '#38383a' : '#f2f2f7',
                borderRadius: 22,
                paddingHorizontal: 16,
                paddingVertical: 10,
                marginRight: onFilterPress ? 12 : 0,
            }}>
                <Ionicons
                    name="search"
                    size={18}
                    color="#8e8e93"
                    style={{ marginRight: 10 }}
                />
                <TextInput
                    style={{
                        flex: 1,
                        fontSize: 16,
                        color: isDark ? 'white' : '#1c1c1e',
                        padding: 0,
                        height: 22,
                    }}
                    placeholder={placeholder}
                    placeholderTextColor="#8e8e93"
                    value={searchQuery}
                    onChangeText={onSearchChange}
                    returnKeyType="search"
                    autoFocus={true}
                />
            </View>

            {/* Filter Button - Optional */}
            {onFilterPress && (
                <TouchableOpacity
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: isDark ? '#38383a' : '#f2f2f7',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'relative',
                    }}
                    onPress={onFilterPress}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="options"
                        size={18}
                        color={filterCount > 0 ? '#10b981' : '#8e8e93'}
                    />
                    {filterCount > 0 && (
                        <View style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#10b981',
                        }} />
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
};
