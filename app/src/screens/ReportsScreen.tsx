import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useWatermelonPurchases } from '../hooks/useWatermelonPurchases';
import { useWatermelonPartners } from '../hooks/useWatermelonPartners';
import { watermelonSyncService } from '../services/watermelonSyncService';
import NetInfo from '@react-native-community/netinfo';
import { showErrorToast } from '../utils/toastUtils';

type PeriodType = 'week' | 'month' | 'year';

// ===== HELPER FUNCTIONS =====
const getDateRange = (period: PeriodType) => {
    const now = new Date();
    const startDate = new Date();

    if (period === 'week') {
        startDate.setDate(now.getDate() - 28); // 4 weeks back
    } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 11); // 12 months back
    } else {
        startDate.setFullYear(now.getFullYear() - 2); // 2 years back
    }

    return startDate;
};

const getMonthlyBreakdown = (purchases: any[], period: PeriodType) => {
    const monthlyMap = new Map();
    const currentDate = new Date();
    const startDate = getDateRange(period);

    if (period === 'week') {
        // Last 4 weeks
        for (let i = 3; i >= 0; i--) {
            const date = new Date(currentDate);
            date.setDate(date.getDate() - i * 7);
            const weekKey = date.toISOString().slice(0, 10);
            const weekLabel = `W${Math.ceil(date.getDate() / 7)}`;
            monthlyMap.set(weekKey, { month: weekLabel, amount: 0, count: 0 });
        }
    } else if (period === 'month') {
        // Last 12 months
        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthKey = date.toISOString().slice(0, 7);
            const monthName = date.toLocaleDateString('en', { month: 'short' });
            monthlyMap.set(monthKey, { month: monthName, amount: 0, count: 0 });
        }
    } else {
        // Last 2 years (by month)
        for (let i = 23; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthKey = date.toISOString().slice(0, 7);
            const monthName = date.toLocaleDateString('en', { month: 'short' });
            monthlyMap.set(monthKey, { month: monthName, amount: 0, count: 0 });
        }
    }

    purchases.forEach((purchase: any) => {
        try {
            const dateField = purchase.purchase_date || purchase.created_at;
            if (!dateField) return;
            const purchaseDate = new Date(dateField);
            if (purchaseDate < startDate) return;

            let key: string;
            if (period === 'week') {
                key = dateField.slice(0, 10);
            } else {
                key = dateField.slice(0, 7);
            }

            if (monthlyMap.has(key)) {
                const data = monthlyMap.get(key);
                data.amount += (purchase.total_amount || 0);
                data.count += 1;
            }
        } catch (e) {
            //
        }
    });

    return Array.from(monthlyMap.values());
};

const getTopPartners = (purchases: any[], partners: any[], period: PeriodType) => {
    const partnerMap = new Map();
    const startDate = getDateRange(period);

    purchases.forEach((purchase: any) => {
        try {
            const dateField = purchase.purchase_date || purchase.created_at;
            if (!dateField) return;
            const purchaseDate = new Date(dateField);
            if (purchaseDate < startDate) return;

            const partnerId = purchase.partner_id;
            if (!partnerId) return;

            if (!partnerMap.has(partnerId)) {
                const partner = partners.find((p: any) => p.id === partnerId);
                partnerMap.set(partnerId, {
                    id: partnerId,
                    name: partner?.name || 'Unknown',
                    amount: 0,
                    count: 0
                });
            }
            const data = partnerMap.get(partnerId);
            data.amount += (purchase.total_amount || 0);
            data.count += 1;
        } catch (e) {
            //
        }
    });

    return Array.from(partnerMap.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);
};

// ===== MAIN COMPONENT =====
const ReportsScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const { purchases } = useWatermelonPurchases();
    const { partners } = useWatermelonPartners();
    const [refreshing, setRefreshing] = useState(false);
    const [period, setPeriod] = useState<PeriodType>('month');

    // Memoize metrics to prevent infinite loops
    const metrics = useMemo(() => {
        console.log('Calculating metrics for period:', period);
        console.log(`Purchases: ${purchases.length}, Partners: ${partners.length}`);

        const totalPurchases = purchases.length;
        const totalAmount = purchases.reduce((sum: number, p: any) => sum + (p.total_amount || 0), 0);
        const averageAmount = totalPurchases > 0 ? Math.round(totalAmount / totalPurchases) : 0;
        const totalPartners = partners.length;

        const monthlyData = getMonthlyBreakdown(purchases, period);
        const topPartners = getTopPartners(purchases, partners, period);

        console.log(`Metrics: ${totalPurchases} purchases, ${totalAmount} total, ${totalPartners} partners`);
        console.log('Top partners:', topPartners);

        return {
            totalPurchases,
            totalAmount,
            totalPartners,
            averageAmount,
            monthlyData,
            topPartners
        };
    }, [purchases, partners, period]);

    useFocusEffect(
        useCallback(() => {
            console.log('Reports screen focused');
        }, [])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const state = await NetInfo.fetch();
            const isOnline = state.isConnected && state.isInternetReachable;

            if (!isOnline) {
                showErrorToast('Offline - Showing cached data');
                setRefreshing(false);
                return;
            }

            await watermelonSyncService.fullSync();
        } catch (error) {
            console.error('Refresh error:', error);
            showErrorToast('Failed to refresh data');
        } finally {
            setRefreshing(false);
        }
    }, []);

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.content}
            >
                {/* Period Selector */}
                <View style={styles.periodContainer}>
                    <PeriodButton
                        label="Week"
                        isActive={period === 'week'}
                        onPress={() => setPeriod('week')}
                    />
                    <PeriodButton
                        label="Month"
                        isActive={period === 'month'}
                        onPress={() => setPeriod('month')}
                    />
                    <PeriodButton
                        label="Year"
                        isActive={period === 'year'}
                        onPress={() => setPeriod('year')}
                    />
                </View>

                {/* Stats Cards */}
                <StatsCard
                    icon="receipt-outline"
                    iconColor="#2563eb"
                    value={metrics.totalPurchases.toString()}
                    label="Total Purchases"
                />
                <StatsCard
                    icon="cash-outline"
                    iconColor="#10b981"
                    value={`Rs ${metrics.totalAmount.toLocaleString('en-PK')}`}
                    label="Total Amount"
                />
                <StatsCard
                    icon="people-outline"
                    iconColor="#f59e0b"
                    value={metrics.totalPartners.toString()}
                    label="Active Partners"
                />
                <StatsCard
                    icon="trending-up-outline"
                    iconColor="#8b5cf6"
                    value={`Rs ${metrics.averageAmount.toLocaleString('en-PK')}`}
                    label="Average Per Purchase"
                />

                {/* Monthly Chart */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Monthly Trends</Text>
                    <View style={styles.chartCard}>
                        <MonthlyChart data={metrics.monthlyData} />
                    </View>
                </View>

                {/* Top Partners */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Top Partners</Text>
                    <View style={styles.listCard}>
                        {metrics.topPartners.length > 0 ? (
                            metrics.topPartners.map((partner, idx) => (
                                <PartnerRow key={partner.id} rank={idx + 1} partner={partner} />
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No partner data available</Text>
                        )}
                    </View>
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>
        </View>
    );
};

// ===== REUSABLE COMPONENTS =====
const PeriodButton = ({ label, isActive, onPress }: any) => (
    <TouchableOpacity
        style={[styles.periodButton, isActive && styles.periodButtonActive]}
        onPress={onPress}
    >
        <Text style={[styles.periodButtonText, isActive && styles.periodButtonTextActive]}>
            {label}
        </Text>
    </TouchableOpacity>
);

const StatsCard = ({ icon, iconColor, value, label }: any) => (
    <View style={styles.statsCard}>
        <View style={[styles.statsIcon, { backgroundColor: `${iconColor}20` }]}>
            <Ionicons name={icon as any} size={24} color={iconColor} />
        </View>
        <View style={styles.statsContent}>
            <Text style={styles.statsValue}>{value}</Text>
            <Text style={styles.statsLabel}>{label}</Text>
        </View>
    </View>
);

const MonthlyChart = ({ data }: any) => {
    const maxAmount = Math.max(...data.map((d: any) => d.amount), 1);
    return (
        <View style={styles.chart}>
            <View style={styles.bars}>
                {data.map((item: any, idx: number) => (
                    <View key={idx} style={styles.barGroup}>
                        <View
                            style={[
                                styles.bar,
                                {
                                    height: Math.max((item.amount / maxAmount) * 100, 10),
                                    backgroundColor: `hsl(${220 + idx * 30}, 70%, 60%)`
                                }
                            ]}
                        />
                        <Text style={styles.barLabel}>{item.month}</Text>
                        <Text style={styles.barValue}>Rs{Math.round(item.amount / 1000)}k</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const PartnerRow = ({ rank, partner }: any) => (
    <View style={styles.partnerRow}>
        <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{rank}</Text>
        </View>
        <View style={styles.partnerInfo}>
            <Text style={styles.partnerName}>{partner.name}</Text>
            <Text style={styles.partnerStats}>{partner.count} purchases</Text>
        </View>
        <Text style={styles.partnerAmount}>Rs {partner.amount.toLocaleString('en-PK')}</Text>
    </View>
);

// ===== STYLES =====
const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 16,
        backgroundColor: '#f8fafc'
    },
    content: {
        paddingBottom: 32
    },
    periodContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 20,
        gap: 8
    },
    periodButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'white',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    periodButtonActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb'
    },
    periodButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b'
    },
    periodButtonTextActive: {
        color: 'white'
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2
    },
    statsIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    statsContent: {
        flex: 1
    },
    statsValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4
    },
    statsLabel: {
        fontSize: 12,
        color: '#64748b'
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 12
    },
    chartCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2
    },
    chart: {
        alignItems: 'center'
    },
    bars: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: 180,
        width: '100%'
    },
    barGroup: {
        alignItems: 'center',
        flex: 1
    },
    bar: {
        width: '70%',
        borderRadius: 4,
        minHeight: 4
    },
    barLabel: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 8,
        fontWeight: '500'
    },
    barValue: {
        fontSize: 10,
        color: '#94a3b8',
        marginTop: 2
    },
    listCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2
    },
    partnerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    rankText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white'
    },
    partnerInfo: {
        flex: 1
    },
    partnerName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2
    },
    partnerStats: {
        fontSize: 12,
        color: '#64748b'
    },
    partnerAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10b981'
    },
    emptyText: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        paddingVertical: 20
    }
});

export default ReportsScreen;
