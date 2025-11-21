import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Linking,
    Platform,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { observer } from '@legendapp/state/react';
import { useWatermelonPartners } from '../hooks/useWatermelonPartners';
import { useWatermelonRoles } from '../hooks/useWatermelonRoles';
import { useWatermelonInvoices } from '../hooks/useWatermelonInvoices';
import { watermelonSyncService } from '../services/watermelonSyncService';
import NetInfo from '@react-native-community/netinfo';
import { showErrorToast } from '../utils/toastUtils';
import { PartnerPaymentFAB } from '../components/ui/PartnerPaymentFAB';

const { width } = Dimensions.get('window');

/**
 * ✅ PROFESSIONAL PARTNER DETAIL SCREEN
 * - Local-first caching
 * - Real-time sync without refresh
 * - Beautiful UI/UX
 * - Fast performance
 */
const PartnerDetailScreen: React.FC = observer(() => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const isDark = false; // Light mode only

    const { partnerId } = route.params as { partnerId: string };
    const { partners } = useWatermelonPartners();
    const { roles } = useWatermelonRoles();
    const { invoices } = useWatermelonInvoices();

    // ✅ Get partner from WatermelonDB
    const partner = useMemo(() => {
        return partners.find((p: any) => p.id === partnerId);
    }, [partners, partnerId]);

    // ✅ Calculate balance from invoices
    const partnerInvoices = useMemo(() => {
        return invoices.filter((inv: any) => inv.partner_name === partner?.name);
    }, [invoices, partner?.name]);

    const totalBought = 0; // Placeholder - calculate from invoices if needed
    const totalSold = 0; // Placeholder - calculate from invoices if needed
    const netBalance = partnerInvoices.reduce((sum: number, inv: any) => sum + (inv.remaining_amount || 0), 0);

    const [refreshing, setRefreshing] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'overview' | 'history'>('overview');

    // ✅ Get role name
    const partnerRole = useMemo(() => {
        return roles.find(r => r.id === partner?.role)?.name || partner?.role || 'Partner';
    }, [partner?.role, roles]);

    // ✅ Handle refresh (WatermelonDB + Supabase sync)
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

    // ✅ Handle call
    const handleCall = useCallback(async () => {
        if (!partner?.phone) {
            Alert.alert('No Phone Number', 'This partner does not have a phone number registered.');
            return;
        }

        try {
            const cleanNumber = partner.phone.replace(/[^\d+]/g, '');
            const url = `tel:${cleanNumber}`;
            await Linking.openURL(url);
        } catch (error) {
            console.error('Error opening phone dialer:', error);
            Alert.alert('Error', 'Failed to open phone dialer. Please try again.');
        }
    }, [partner?.phone]);

    // ✅ Handle edit
    const handleEdit = useCallback(() => {
        if (partner) {
            // Navigate to edit - will use bottom sheet in PartnersScreen
            navigation.goBack();
            // Emit event to open bottom sheet for editing
            setTimeout(() => {
                navigation.navigate('Partners', { editPartnerId: partner.id });
            }, 100);
        }
    }, [partner, navigation]);

    // ✅ Set header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    // ✅ Show error if partner not found (WatermelonDB is instant, no loading state needed)
    if (!partner) {
        return (
            <View style={[styles.container, isDark && styles.containerDark, styles.centerContent]}>
                <Ionicons name="person-outline" size={80} color={isDark ? '#4b5563' : '#cbd5e1'} />
                <Text style={[styles.errorText, isDark && styles.errorTextDark]}>Partner not found</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            {/* Professional Header */}
            <View style={[styles.header, isDark && styles.headerDark]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color={isDark ? 'white' : '#1e293b'} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.headerTitleContainer}
                    onPress={() => {
                        // Open bottom sheet for partner details
                        Alert.alert('Partner Details', `${partner?.name}\n${partner?.phone || 'No phone'}\n${(partner as any)?.address || 'No address'}`);
                    }}
                >
                    <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
                        {partner?.name || 'Partner Details'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.headerActionButton}
                        onPress={handleCall}
                    >
                        <Ionicons name="call" size={20} color="#10b981" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerActionButton}
                        onPress={handleEdit}
                    >
                        <Ionicons name="create-outline" size={20} color="#10b981" />
                    </TouchableOpacity>
                </View>
            </View>


            {/* Tab Selector */}
            <View style={[styles.tabContainer, isDark && styles.tabContainerDark]}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        selectedTab === 'overview' && [styles.tabActive, isDark && styles.tabActiveDark],
                    ]}
                    onPress={() => setSelectedTab('overview')}
                >
                    <Ionicons
                        name={selectedTab === 'overview' ? 'grid' : 'grid-outline'}
                        size={18}
                        color={selectedTab === 'overview' ? '#10b981' : isDark ? '#9ca3af' : '#6b7280'}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            selectedTab === 'overview' && styles.tabTextActive,
                            isDark && styles.tabTextDark,
                        ]}
                    >
                        Overview
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tab,
                        selectedTab === 'history' && [styles.tabActive, isDark && styles.tabActiveDark],
                    ]}
                    onPress={() => setSelectedTab('history')}
                >
                    <Ionicons
                        name={selectedTab === 'history' ? 'time' : 'time-outline'}
                        size={18}
                        color={selectedTab === 'history' ? '#10b981' : isDark ? '#9ca3af' : '#6b7280'}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            selectedTab === 'history' && styles.tabTextActive,
                            isDark && styles.tabTextDark,
                        ]}
                    >
                        History
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#10b981']}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {selectedTab === 'overview' ? (
                    <View style={styles.overviewContent}>
                        {/* Stats Cards */}
                        <View style={styles.statsGrid}>
                            <View style={[styles.statCard, isDark && styles.statCardDark]}>
                                <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                                    <Ionicons name="person" size={24} color="#10b981" />
                                </View>
                                <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
                                    Partner Type
                                </Text>
                                <Text style={[styles.statValue, isDark && styles.statValueDark]}>
                                    {partnerRole}
                                </Text>
                            </View>

                            <View style={[styles.statCard, isDark && styles.statCardDark]}>
                                <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                                    <Ionicons name="calendar" size={24} color="#f59e0b" />
                                </View>
                                <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
                                    Added
                                </Text>
                                <Text style={[styles.statValue, isDark && styles.statValueDark]}>
                                    {new Date((partner as any).created_at || new Date()).toLocaleDateString('en-IN', {
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </Text>
                            </View>
                        </View>


                        {/* Financial Summary */}
                        <View style={styles.infoCardsSection}>
                            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                                Financial Summary
                            </Text>
                            <View style={styles.financialGrid}>
                                <View style={[styles.financialCard, isDark && styles.financialCardDark]}>
                                    <View style={[styles.financialIcon, { backgroundColor: '#dbeafe' }]}>
                                        <Ionicons name="arrow-down" size={24} color="#2563eb" />
                                    </View>
                                    <Text style={[styles.financialLabel, isDark && styles.financialLabelDark]}>
                                        You Bought
                                    </Text>
                                    <Text style={[styles.financialValue, isDark && styles.financialValueDark]}>
                                        Rs. {totalBought.toLocaleString('en-IN')}
                                    </Text>
                                </View>

                                <View style={[styles.financialCard, isDark && styles.financialCardDark]}>
                                    <View style={[styles.financialIcon, { backgroundColor: '#dcfce7' }]}>
                                        <Ionicons name="arrow-up" size={24} color="#10b981" />
                                    </View>
                                    <Text style={[styles.financialLabel, isDark && styles.financialLabelDark]}>
                                        You Sold
                                    </Text>
                                    <Text style={[styles.financialValue, isDark && styles.financialValueDark]}>
                                        Rs. {totalSold.toLocaleString('en-IN')}
                                    </Text>
                                </View>

                                <View style={[styles.financialCard, isDark && styles.financialCardDark]}>
                                    <View style={[styles.financialIcon, { backgroundColor: netBalance > 0 ? '#fee2e2' : '#fef3c7' }]}>
                                        <Ionicons
                                            name={netBalance > 0 ? "alert-circle" : "checkmark-circle"}
                                            size={24}
                                            color={netBalance > 0 ? "#dc2626" : "#f59e0b"}
                                        />
                                    </View>
                                    <Text style={[styles.financialLabel, isDark && styles.financialLabelDark]}>
                                        {netBalance > 0 ? 'You Owe' : netBalance < 0 ? 'They Owe' : 'Settled'}
                                    </Text>
                                    <Text style={[styles.financialValue, { color: netBalance > 0 ? '#dc2626' : netBalance < 0 ? '#10b981' : '#f59e0b' }]}>
                                        Rs. {Math.abs(netBalance).toLocaleString('en-IN')}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.historyContent}>
                        {partnerInvoices && partnerInvoices.length > 0 ? (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {partnerInvoices.map((transaction: any, idx: number) => (
                                    <View key={idx} style={[styles.transactionCard, isDark && styles.transactionCardDark]}>
                                        <View style={styles.transactionHeader}>
                                            <View style={styles.transactionTypeContainer}>
                                                <View style={[
                                                    styles.transactionTypeBadge,
                                                    { backgroundColor: '#dbeafe' }
                                                ]}>
                                                    <Ionicons
                                                        name="document-text"
                                                        size={16}
                                                        color="#2563eb"
                                                    />
                                                </View>
                                                <View>
                                                    <Text style={[styles.transactionType, isDark && styles.transactionTypeDark]}>
                                                        {transaction.invoice_number || 'Invoice'}
                                                    </Text>
                                                    <Text style={[styles.transactionDate, isDark && styles.transactionDateDark]}>
                                                        {transaction.invoice_date}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.transactionAmount}>
                                                <Text style={[styles.transactionValue, { color: '#2563eb' }]}>
                                                    Rs. {(transaction.grand_total || 0).toLocaleString('en-IN')}
                                                </Text>
                                                <View style={[
                                                    styles.statusBadge,
                                                    { backgroundColor: transaction.payment_status === 'paid' ? '#dcfce7' : transaction.payment_status === 'partial' ? '#fef3c7' : '#fee2e2' }
                                                ]}>
                                                    <Text style={[
                                                        styles.statusText,
                                                        { color: transaction.payment_status === 'paid' ? '#10b981' : transaction.payment_status === 'partial' ? '#f59e0b' : '#dc2626' }
                                                    ]}>
                                                        {transaction.payment_status}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                        {transaction.remaining_amount > 0 && (
                                            <View style={styles.transactionFooter}>
                                                <Text style={[styles.remainingText, isDark && styles.remainingTextDark]}>
                                                    {transaction.transaction_type === 'buy' ? 'You owe' : 'They owe'}: Rs. {parseFloat(transaction.remaining_amount || 0).toLocaleString('en-IN')}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </ScrollView>
                        ) : (
                            <View style={[styles.emptyState, isDark && styles.emptyStateDark]}>
                                <Ionicons name="time-outline" size={64} color={isDark ? '#4b5563' : '#cbd5e1'} />
                                <Text style={[styles.emptyStateTitle, isDark && styles.emptyStateTitleDark]}>
                                    No History Yet
                                </Text>
                                <Text style={[styles.emptyStateText, isDark && styles.emptyStateTextDark]}>
                                    Transactions will appear here
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Payment Floating Button */}
            <PartnerPaymentFAB
                onPaymentComing={() => {
                    console.log('Payment Coming');
                    Alert.alert('Payment Coming', 'Feature coming soon');
                }}
                onPaymentOutgoing={() => {
                    console.log('Payment Outgoing');
                    Alert.alert('Payment Outgoing', 'Feature coming soon');
                }}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    containerDark: {
        backgroundColor: '#0f172a',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748b',
    },
    loadingTextDark: {
        color: '#cbd5e1',
    },
    errorText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
        color: '#64748b',
    },
    errorTextDark: {
        color: '#cbd5e1',
    },
    header: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    headerDark: {
        backgroundColor: '#1e293b',
        borderBottomColor: '#334155',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        textAlign: 'center',
    },
    headerTitleDark: {
        color: 'white',
    },
    headerTitleContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerActionButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f0fdf4',
    },
    headerButton: {
        padding: 8,
        marginRight: 8,
    },
    partnerCard: {
        backgroundColor: 'white',
        marginHorizontal: 12,
        marginVertical: 12,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    partnerCardDark: {
        backgroundColor: '#1e293b',
    },
    partnerInfo: {
        flex: 1,
    },
    headerCard: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerCardDark: {
        backgroundColor: '#1e293b',
        borderBottomColor: '#334155',
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#dcfce7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarContainerDark: {
        backgroundColor: '#064e3b',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#10b981',
    },
    headerInfo: {
        flex: 1,
    },
    partnerName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 6,
    },
    partnerNameDark: {
        color: 'white',
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
    },
    roleBadgeDark: {
        backgroundColor: '#064e3b',
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10b981',
    },
    callButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    callButtonDark: {
        backgroundColor: '#059669',
    },
    infoSection: {
        backgroundColor: 'white',
        marginHorizontal: 12,
        marginVertical: 12,
        borderRadius: 16,
        padding: 16,
        gap: 16,
    },
    infoSectionDark: {
        backgroundColor: '#1e293b',
    },
    infoRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f0fdf4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoIconDark: {
        backgroundColor: '#064e3b',
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 4,
    },
    infoLabelDark: {
        color: '#9ca3af',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1e293b',
    },
    infoValueDark: {
        color: 'white',
    },
    financialGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
        justifyContent: 'space-between',
    },
    financialCard: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        marginBottom: 8,
    },
    financialCardDark: {
        backgroundColor: '#1e293b',
    },
    financialIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    financialLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 4,
        textAlign: 'center',
    },
    financialLabelDark: {
        color: '#9ca3af',
    },
    financialValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    financialValueDark: {
        color: 'white',
    },
    tabContainer: {
        backgroundColor: 'white',
        marginHorizontal: 12,
        marginVertical: 12,
        borderRadius: 12,
        flexDirection: 'row',
        padding: 4,
        gap: 4,
    },
    tabContainerDark: {
        backgroundColor: '#1e293b',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    tabActive: {
        backgroundColor: '#f0fdf4',
    },
    tabActiveDark: {
        backgroundColor: '#064e3b',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
    },
    tabTextDark: {
        color: '#9ca3af',
    },
    tabTextActive: {
        color: '#10b981',
    },
    content: {
        flex: 1,
        paddingHorizontal: 12,
    },
    overviewContent: {
        paddingVertical: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    statCardDark: {
        backgroundColor: '#1e293b',
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 6,
    },
    statLabelDark: {
        color: '#9ca3af',
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
        textAlign: 'center',
    },
    statValueDark: {
        color: 'white',
    },
    quickActionsSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 12,
    },
    sectionTitleDark: {
        color: 'white',
    },
    quickActionsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    actionCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        gap: 8,
    },
    actionCardDark: {
        backgroundColor: '#1e293b',
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1e293b',
        textAlign: 'center',
    },
    actionLabelDark: {
        color: 'white',
    },
    infoCardsSection: {
        marginBottom: 20,
    },
    detailCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
    },
    detailCardDark: {
        backgroundColor: '#1e293b',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    detailLabelDark: {
        color: '#9ca3af',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    detailValueDark: {
        color: 'white',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
    },
    dividerDark: {
        backgroundColor: '#334155',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#f0fdf4',
        borderRadius: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10b981',
    },
    historyContent: {
        paddingVertical: 40,
    },
    emptyState: {
        alignItems: 'center',
        gap: 12,
    },
    emptyStateDark: {},
    emptyStateTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    emptyStateTitleDark: {
        color: 'white',
    },
    emptyStateText: {
        fontSize: 14,
        color: '#64748b',
    },
    emptyStateTextDark: {
        color: '#9ca3af',
    },
    transactionCard: {
        backgroundColor: 'white',
        marginHorizontal: 12,
        marginVertical: 8,
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    transactionCardDark: {
        backgroundColor: '#1e293b',
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transactionTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    transactionTypeBadge: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    transactionType: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    transactionTypeDark: {
        color: 'white',
    },
    transactionDate: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
    },
    transactionDateDark: {
        color: '#9ca3af',
    },
    transactionAmount: {
        alignItems: 'flex-end',
        gap: 8,
    },
    transactionValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    transactionFooter: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    remainingText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#f59e0b',
    },
    remainingTextDark: {
        color: '#fbbf24',
    },
});

export default PartnerDetailScreen;
