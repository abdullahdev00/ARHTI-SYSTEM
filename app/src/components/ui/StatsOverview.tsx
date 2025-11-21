import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useColorScheme, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatsOverviewProps {
    totalPartners: number;
    totalFarmers: number;
    totalBuyers: number;
    recentActivity: number;
}

interface StatItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: number;
    color: string;
    onPress?: () => void;
}

/**
 * 🎨 WHATSAPP-STYLE STATS OVERVIEW
 * ✅ Horizontal scrollable cards
 * ✅ Professional white/dark theme
 * ✅ Touch-optimized interactions
 * ✅ Compact design for maximum screen space
 */
export const StatsOverview: React.FC<StatsOverviewProps> = ({
    totalPartners,
    totalFarmers,
    totalBuyers,
    recentActivity,
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const stats = [
        {
            icon: 'people' as const,
            label: 'Total Partners',
            value: totalPartners,
            color: '#10b981',
        },
        {
            icon: 'leaf' as const,
            label: 'Farmers',
            value: totalFarmers,
            color: '#22c55e',
        },
        {
            icon: 'business' as const,
            label: 'Buyers',
            value: totalBuyers,
            color: '#3b82f6',
        },
        {
            icon: 'time' as const,
            label: 'Recent Activity',
            value: recentActivity,
            color: '#f59e0b',
        },
    ];

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {stats.map((stat, index) => (
                    <StatItem
                        key={index}
                        icon={stat.icon}
                        label={stat.label}
                        value={stat.value}
                        color={stat.color}
                    />
                ))}
            </ScrollView>
        </View>
    );
};

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, color, onPress }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <TouchableOpacity
            style={[styles.statCard, isDark && styles.statCardDark]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Icon Container */}
            <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>

            {/* Content */}
            <View style={styles.statContent}>
                <Text style={[styles.statValue, isDark && styles.statValueDark]}>
                    {value.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
                    {label}
                </Text>
            </View>

            {/* Subtle accent */}
            <View style={[styles.accent, { backgroundColor: color }]} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e5e5e7',
    },
    containerDark: {
        backgroundColor: '#1c1c1e',
        borderBottomColor: '#38383a',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 12,
    },
    statCard: {
        backgroundColor: '#f2f2f7',
        borderRadius: 12,
        padding: 16,
        minWidth: 120,
        position: 'relative',
        overflow: 'hidden',
    },
    statCardDark: {
        backgroundColor: '#2c2c2e',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statContent: {
        alignItems: 'flex-start',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1c1c1e',
        marginBottom: 2,
    },
    statValueDark: {
        color: 'white',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#8e8e93',
    },
    statLabelDark: {
        color: '#8e8e93',
    },
    accent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
});
