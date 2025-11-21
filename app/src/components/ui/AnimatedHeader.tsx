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

interface AnimatedHeaderProps {
    title: string;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    filterCount: number;
    onFilterPress: () => void;
    onMenuPress?: () => void;
}

/**
 * 🎨 WHATSAPP-STYLE ANIMATED HEADER
 * ✅ Click search icon → animated search bar
 * ✅ Smooth animations like WhatsApp
 * ✅ Auto keyboard focus
 * ✅ Filter button in search mode
 * ✅ Back button to close search
 */
export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
    title,
    searchQuery,
    onSearchChange,
    filterCount,
    onFilterPress,
    onMenuPress,
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [isSearchMode, setIsSearchMode] = useState(false);
    const searchInputRef = useRef<TextInput>(null);
    const animatedValue = useRef(new Animated.Value(0)).current;

    const openSearch = () => {
        setIsSearchMode(true);
        Animated.timing(animatedValue, {
            toValue: 1,
            duration: 250,
            useNativeDriver: false,
        }).start(() => {
            searchInputRef.current?.focus();
        });
    };

    const closeSearch = () => {
        Keyboard.dismiss();
        onSearchChange(''); // Clear search
        Animated.timing(animatedValue, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
        }).start(() => {
            setIsSearchMode(false);
        });
    };

    const searchBarWidth = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const titleOpacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
    });

    const searchOpacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            {/* 📱 Normal Header Mode */}
            {!isSearchMode && (
                <Animated.View style={[styles.normalHeader, { opacity: titleOpacity }]}>
                    <View style={styles.leftSection}>
                        <Text style={[styles.title, isDark && styles.titleDark]}>
                            {title}
                        </Text>
                    </View>

                    <View style={styles.rightSection}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={openSearch}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="search"
                                size={22}
                                color={isDark ? 'white' : '#1c1c1e'}
                            />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}

            {/* 🔍 Search Header Mode */}
            {isSearchMode && (
                <Animated.View style={[styles.searchHeader, { width: searchBarWidth, opacity: searchOpacity }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={closeSearch}
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
                            placeholder="Search partners..."
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
                </Animated.View>
            )}
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
    normalHeader: {
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
