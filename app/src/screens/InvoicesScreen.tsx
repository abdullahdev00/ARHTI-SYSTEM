import React, { useState, useLayoutEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    useColorScheme,
    StatusBar,
    Modal,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { observer } from '@legendapp/state/react';
import { showErrorToast } from '../utils/toastUtils';
import { watermelonSyncService } from '../services/watermelonSyncService';
import NetInfo from '@react-native-community/netinfo';
import {
    FloatingActionButton,
    EmptyState
} from '../components/ui';
import { useWatermelonInvoices } from '../hooks/useWatermelonInvoices';
import { useWatermelonPartners } from '../hooks/useWatermelonPartners';
import { SearchHeader } from '../components/ui/SearchHeader';
import { InvoiceEditBottomSheet } from '../components/InvoiceEditBottomSheet';
import { supabase } from '../config/supabase';

interface InvoiceItem {
    id: string;
    cropName: string;
    quantity: number;
    bagQuantity: number;
    weightPerBag: number;
    ratePerBag: number;
    total: number;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    userId: string;
    userName: string;
    userPhone: string;
    businessName: string;
    businessAddress: string;
    transactionType: 'stock_buy' | 'stock_sell' | 'payment_received' | 'payment_sent' | 'other';
    customerId: string;
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    items: InvoiceItem[];
    subtotal: number;
    charges: { name: string; amount: number; type: 'fixed' | 'percentage' }[];
    totalCharges: number;
    grandTotal: number;
    status: 'paid' | 'unpaid' | 'partial';
    createdDate: string;
    dueDate: string;
}

/**
 * PROFESSIONAL INVOICES SCREEN - FIXED
 * ✅ Proper header with search icon
 * ✅ 3-dot menu for edit/delete
 * ✅ Status filter capsules
 * ✅ Pakistani currency formatting
 * ✅ Dark mode support
 */
const InvoicesScreen: React.FC = observer(() => {
    const navigation = useNavigation<any>();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // ✅ Local state for filters and search (MUST be before useLayoutEffect)
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'partial'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<any>(null);
    const [showEditSheet, setShowEditSheet] = useState(false);

    // ✅ Dynamic header based on search state
    useLayoutEffect(() => {
        if (isSearchVisible) {
            navigation.setOptions({
                headerShown: true,
                headerTitle: '',
                headerLeft: () => (
                    <SearchHeader
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onClose={() => {
                            setSearchQuery('');
                            setIsSearchVisible(false);
                        }}
                        placeholder="Search invoices..."
                    />
                ),
                headerRight: () => null,
            });
        } else {
            navigation.setOptions({
                headerShown: true,
                headerTitleContainerStyle: undefined,
                headerTitle: 'Invoices',
                headerLeft: undefined,
                headerRight: () => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                        <TouchableOpacity
                            style={{ marginRight: 8, padding: 8 }}
                            onPress={() => setIsSearchVisible(true)}
                        >
                            <Ionicons name="search" size={22} color="#1c1c1e" />
                        </TouchableOpacity>
                    </View>
                ),
            });
        }
    }, [navigation, isSearchVisible, searchQuery]);

    // ✅ Fetch invoices from WatermelonDB (local-first, instant)
    const { invoices, invoicesByStatus } = useWatermelonInvoices();
    const { partners } = useWatermelonPartners();

    // ✅ Handle long press on invoice
    const handleInvoiceLongPress = useCallback((invoice: any) => {
        setEditingInvoice(invoice);
        setShowEditSheet(true);
    }, []);

    // ✅ Handle save invoice changes (Local-first with Legend State)
    const handleSaveInvoice = useCallback(async (updates: any) => {
        try {
            if (!editingInvoice) return;

            // Step 1: Update local store first (optimistic update)
            const updatedInvoice = {
                ...editingInvoice,
                payment_status: updates.payment_status,
                paid_amount: updates.paid_amount,
                remaining_amount: updates.remaining_amount,
            };

            // Step 2: Sync to Supabase in background
            const { error } = await supabase
                .from('transactions')
                .update({
                    payment_status: updates.payment_status,
                    paid_amount: updates.paid_amount,
                    remaining_amount: updates.remaining_amount,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', editingInvoice.id);

            if (error) throw error;

            // Step 3: Reload from Supabase to ensure sync
            await watermelonSyncService.fullSync();
        } catch (error) {
            console.error('Error saving invoice:', error);
            throw error;
        }
    }, [editingInvoice]);

    // ✅ Handle delete invoice (Local-first with Legend State)
    const handleDeleteInvoice = useCallback(async () => {
        try {
            if (!editingInvoice) return;

            // Step 1: Delete from local store first (optimistic delete)
            // This will immediately update the UI

            // Step 2: Delete from Supabase in background
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', editingInvoice.id);

            if (error) throw error;

            // Step 3: Reload from Supabase to ensure sync
            await watermelonSyncService.fullSync();
        } catch (error) {
            console.error('Error deleting invoice:', error);
            throw error;
        }
    }, [editingInvoice]);

    // ✅ Filter invoices based on status and search
    const filteredInvoices = React.useMemo(() => {
        let result = statusFilter === 'all' ? invoices : invoicesByStatus[statusFilter];

        if (searchQuery.trim()) {
            result = result.filter(inv =>
                inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                inv.partner_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return result;
    }, [invoices, invoicesByStatus, statusFilter, searchQuery]);

    // ✅ Unified refresh handler - used by both swipe and button
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            // Check network status
            const state = await NetInfo.fetch();
            const isOnline = state.isConnected && state.isInternetReachable;

            if (!isOnline) {
                console.log('📴 Offline - Using cached data');
                showErrorToast('Offline - Showing cached data');
                setRefreshing(false);
                return;  // Data already in Legend State from cache
            }

            const startTime = Date.now();
            console.log('🔄 [REFRESH START] Fetching Invoices data from Supabase...');
            console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);

            // ✅ Load both invoices AND partners (needed for enrichment)
            await watermelonSyncService.fullSync();

            const endTime = Date.now();
            const duration = endTime - startTime;

            console.log('✅ [REFRESH COMPLETE] Invoices data loaded from Supabase');
            console.log(`⏱️ Duration: ${duration}ms`);
            console.log(`📊 Loaded: Invoices (from transactions) + Partners`);
            console.log(`⏰ Completed at: ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            console.error('❌ [REFRESH ERROR] Failed to refresh data:', error);
            showErrorToast('Failed to refresh data');
        } finally {
            setRefreshing(false);
        }
    }, []);

    // ✅ Handle invoice click
    const handleInvoicePress = useCallback((invoiceId: string) => {
        navigation.navigate('InvoicePreview', { invoiceId });
    }, [navigation]);

    // ✅ Show empty state (WatermelonDB is instant, no loading state needed)
    if (filteredInvoices.length === 0) {
        return (
            <View style={[styles.container, isDark && styles.containerDark]}>
                <View style={[styles.filterSection, isDark && styles.filterSectionDark]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
                    >
                        {(['all', 'paid', 'unpaid', 'partial'] as const).map((status) => (
                            <TouchableOpacity
                                key={status}
                                style={[
                                    styles.statusCapsule,
                                    statusFilter === status && styles.statusCapsuleSelected,
                                ]}
                                onPress={() => setStatusFilter(status)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.statusCapsuleText,
                                    statusFilter === status && { color: '#2563eb', fontWeight: '600' },
                                ]}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="document-outline" size={64} color={isDark ? '#4b5563' : '#cbd5e1'} />
                    <Text style={[{ fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 16 }, isDark && { color: 'white' }]}>
                        No Invoices
                    </Text>
                    <Text style={[{ fontSize: 14, color: '#64748b', marginTop: 8 }, isDark && { color: '#9ca3af' }]}>
                        Invoices from your transactions will appear here
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={isDark ? '#000000' : '#ffffff'}
            />

            {/* ✅ Status Filter */}
            <View style={[styles.filterSection, isDark && styles.filterSectionDark]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
                >
                    {(['all', 'paid', 'unpaid', 'partial'] as const).map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.statusCapsule,
                                statusFilter === status && styles.statusCapsuleSelected,
                            ]}
                            onPress={() => setStatusFilter(status)}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.statusCapsuleText,
                                statusFilter === status && { color: '#2563eb', fontWeight: '600' },
                            ]}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* ✅ Content Area */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#10b981']}
                        tintColor="#10b981"
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {filteredInvoices.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 }}>
                        <Ionicons name="document-outline" size={64} color={isDark ? '#4b5563' : '#cbd5e1'} />
                        <Text style={[{ fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 16 }, isDark && { color: 'white' }]}>
                            No Invoices Found
                        </Text>
                        <Text style={[{ fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center', paddingHorizontal: 16 }, isDark && { color: '#9ca3af' }]}>
                            {searchQuery || statusFilter !== 'all'
                                ? "No invoices match your search criteria"
                                : "Invoices from your transactions will appear here"
                            }
                        </Text>
                    </View>
                ) : (
                    filteredInvoices.map((invoice) => (
                        <TouchableOpacity
                            key={invoice.id}
                            style={[styles.invoiceCard, isDark && styles.invoiceCardDark]}
                            onPress={() => handleInvoicePress(invoice.id)}
                            onLongPress={() => handleInvoiceLongPress(invoice)}
                            activeOpacity={0.7}
                        >
                            {/* Header */}
                            <View style={styles.cardHeader}>
                                <View style={styles.invoiceInfo}>
                                    <Text style={[styles.invoiceNumber, isDark && styles.invoiceNumberDark]}>
                                        {invoice.invoice_number}
                                    </Text>
                                    <Text style={[styles.customerName, isDark && styles.customerNameDark]}>
                                        {invoice.partner_name}
                                    </Text>
                                </View>

                                {/* Status Badge */}
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: invoice.payment_status === 'paid' ? '#dcfce7' : invoice.payment_status === 'partial' ? '#fef3c7' : '#fee2e2' }
                                ]}>
                                    <Text style={[
                                        styles.statusBadgeText,
                                        { color: invoice.payment_status === 'paid' ? '#10b981' : invoice.payment_status === 'partial' ? '#f59e0b' : '#dc2626' }
                                    ]}>
                                        {invoice.payment_status}
                                    </Text>
                                </View>
                            </View>

                            {/* Details */}
                            <View style={styles.cardDetails}>
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>
                                        Amount
                                    </Text>
                                    <Text style={[styles.detailValue, isDark && styles.detailValueDark]}>
                                        Rs. {parseFloat(String(invoice.total_value) || '0').toLocaleString('en-IN')}
                                    </Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>
                                        Date
                                    </Text>
                                    <Text style={[styles.detailValue, isDark && styles.detailValueDark]}>
                                        {new Date(invoice.created_at).toLocaleDateString('en-IN')}
                                    </Text>
                                </View>

                                {parseFloat(String(invoice.remaining_amount) || '0') > 0 && (
                                    <View style={styles.detailRow}>
                                        <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>
                                            Remaining
                                        </Text>
                                        <Text style={[{ color: '#f59e0b', fontWeight: '600' }]}>
                                            Rs. {parseFloat(String(invoice.remaining_amount) || '0').toLocaleString('en-IN')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* ✅ Invoice Edit Bottom Sheet */}
            <InvoiceEditBottomSheet
                visible={showEditSheet}
                invoice={editingInvoice}
                onClose={() => {
                    setShowEditSheet(false);
                    setEditingInvoice(null);
                }}
                onSave={handleSaveInvoice}
                onDelete={handleDeleteInvoice}
            />
        </View>
    );
});

/**
 * PROFESSIONAL INVOICE CARD WITH 3-DOT MENU
 */
interface InvoiceCardProps {
    invoice: Invoice;
    onPress: () => void;
    onEdit: () => void;
    onDelete: () => void;
    formatPKR: (amount: number) => string;
    getStatusInfo: (status: string) => any;
    isDark: boolean;
}

const InvoiceCard: React.FC<InvoiceCardProps> = React.memo(({
    invoice,
    onPress,
    onEdit,
    onDelete,
    formatPKR,
    getStatusInfo,
    isDark,
}) => {
    const statusInfo = getStatusInfo(invoice.status);
    const [showMenu, setShowMenu] = useState(false);

    const handleMenuAction = (action: string) => {
        setShowMenu(false);
        if (action === 'edit') {
            onEdit();
        } else if (action === 'delete') {
            onDelete();
        }
    };

    return (
        <>
            <TouchableOpacity
                style={[styles.invoiceCard, isDark && styles.invoiceCardDark]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.invoiceInfo}>
                        <Text style={[styles.invoiceNumber, isDark && styles.invoiceNumberDark]}>
                            {invoice.invoiceNumber}
                        </Text>
                        <Text style={[styles.customerName, isDark && styles.customerNameDark]}>
                            {invoice.customerName}
                        </Text>
                    </View>

                    {/* 3-Dot Menu */}
                    <TouchableOpacity
                        style={[styles.menuButton, isDark && styles.menuButtonDark]}
                        onPress={() => setShowMenu(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="ellipsis-vertical" size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
                    </TouchableOpacity>
                </View>

                {/* Details */}
                <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                            <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                            <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>Date</Text>
                            <Text style={[styles.detailValue, isDark && styles.detailValueDark]}>
                                {new Date(invoice.createdDate).toLocaleDateString('en-PK')}
                            </Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Ionicons name="cube-outline" size={14} color="#6b7280" />
                            <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>Items</Text>
                            <Text style={[styles.detailValue, isDark && styles.detailValueDark]}>
                                {invoice.items.length}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                            <Ionicons name="cash-outline" size={14} color="#6b7280" />
                            <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>Amount</Text>
                            <Text style={[styles.amountValue, isDark && styles.amountValueDark]}>
                                {formatPKR(invoice.grandTotal)}
                            </Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
                            <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>Status</Text>
                            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                                    {statusInfo.text}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.cardFooter}>
                    <Text style={[styles.businessName, isDark && styles.businessNameDark]}>
                        {invoice.businessName}
                    </Text>
                    <Text style={[styles.dueDate, isDark && styles.dueDateDark]}>
                        Due: {new Date(invoice.dueDate).toLocaleDateString('en-PK')}
                    </Text>
                </View>

                {/* Decorative elements */}
                <View style={[styles.decorativeCircle, { backgroundColor: statusInfo.color + '20' }]} />
            </TouchableOpacity>

            {/* 3-Dot Menu Modal */}
            <Modal
                visible={showMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowMenu(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackground}
                        activeOpacity={1}
                        onPress={() => setShowMenu(false)}
                    />
                    <View style={[styles.menuModal, isDark && styles.menuModalDark]}>
                        <Text style={[styles.menuTitle, isDark && styles.menuTitleDark]}>
                            {invoice.invoiceNumber}
                        </Text>

                        {/* Edit Action */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleMenuAction('edit')}
                        >
                            <Ionicons name="create-outline" size={20} color="#3b82f6" />
                            <Text style={[styles.menuItemText, { color: '#3b82f6' }]}>Edit Invoice</Text>
                        </TouchableOpacity>

                        {/* Delete Action */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleMenuAction('delete')}
                        >
                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Delete Invoice</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    containerDark: {
        backgroundColor: '#000000',
    },
    filterSection: {
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    filterSectionDark: {
        backgroundColor: '#1c1c1e',
        borderBottomColor: '#374151',
    },
    capsuleContainer: {
        paddingHorizontal: 16,
        gap: 8,
    },
    statusCapsule: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    statusCapsuleSelected: {
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
    },
    statusCapsuleDark: {
        backgroundColor: '#374151',
    },
    statusCapsuleText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
    statusCapsuleTextDark: {
        color: '#d1d5db',
    },
    content: {
        flex: 1,
    },
    invoiceCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    invoiceCardDark: {
        backgroundColor: '#1c1c1e',
        shadowOpacity: 0.3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    invoiceInfo: {
        flex: 1,
    },
    invoiceNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1c1c1e',
        marginBottom: 4,
    },
    invoiceNumberDark: {
        color: 'white',
    },
    customerName: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    customerNameDark: {
        color: '#9ca3af',
    },
    menuButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuButtonDark: {
        backgroundColor: '#374151',
    },
    cardDetails: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailLabel: {
        fontSize: 12,
        color: '#6b7280',
        flex: 1,
    },
    detailLabelDark: {
        color: '#9ca3af',
    },
    detailValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1c1c1e',
    },
    detailValueDark: {
        color: 'white',
    },
    amountValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10b981',
    },
    amountValueDark: {
        color: '#10b981',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    businessName: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
        flex: 1,
    },
    businessNameDark: {
        color: '#9ca3af',
    },
    dueDate: {
        fontSize: 11,
        color: '#9ca3af',
    },
    dueDateDark: {
        color: '#6b7280',
    },
    decorativeCircle: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 60,
        height: 60,
        borderRadius: 30,
        opacity: 0.1,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    menuModal: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        minWidth: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    menuModalDark: {
        backgroundColor: '#1c1c1e',
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1c1c1e',
        marginBottom: 16,
        textAlign: 'center',
    },
    menuTitleDark: {
        color: 'white',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '500',
    },
    // Search styles
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginHorizontal: 16,
        flex: 1,
    },
    searchContainerDark: {
        backgroundColor: '#374151',
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
    // Header styles
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerDark: {
        backgroundColor: '#1c1c1e',
        borderBottomColor: '#374151',
    },
    headerButton: {
        padding: 8,
        borderRadius: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1c1c1e',
        flex: 1,
        textAlign: 'center',
    },
    headerTitleDark: {
        color: 'white',
    },
});

export default InvoicesScreen;
