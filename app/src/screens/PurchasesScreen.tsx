import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    StatusBar,
    SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { observer } from '@legendapp/state/react';
import { useWatermelonPurchases } from '../hooks/useWatermelonPurchases';
import { formatCurrency } from '../utils/formatters';

/**
 * 🛍️ PURCHASES SCREEN
 * - Displays list of all purchases
 * - Supports filtering by partner or crop
 * - Shows total purchase value
 * - Uses WatermelonDB for reactive data
 */
const PurchasesScreen: React.FC = observer(() => {
    const navigation = useNavigation<any>();
    const { purchases, isLoading } = useWatermelonPurchases();
    const [searchQuery, setSearchQuery] = useState('');

    // Filter purchases based on search query
    const filteredPurchases = purchases.filter(p =>
        p.partner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.crop_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate totals
    const totalAmount = filteredPurchases.reduce((sum, p) => sum + p.total_amount, 0);
    const totalQuantity = filteredPurchases.reduce((sum, p) => sum + p.quantity, 0);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('PurchaseDetail', { id: item.id })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.partnerInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.partner_name.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text style={styles.partnerName}>{item.partner_name}</Text>
                        <Text style={styles.date}>{new Date(item.purchase_date).toLocaleDateString()}</Text>
                    </View>
                </View>
                <View style={styles.amountContainer}>
                    <Text style={styles.amount}>{formatCurrency(item.total_amount)}</Text>
                    <Text style={styles.statusBadge}>Paid</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Crop</Text>
                    <Text style={styles.detailValue}>{item.crop_name}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Quantity</Text>
                    <Text style={styles.detailValue}>{item.quantity} kg</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Rate</Text>
                    <Text style={styles.detailValue}>{formatCurrency(item.rate)}/kg</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Purchases</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate('AddPurchase')}
                    >
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by partner or crop..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                {/* Summary Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Total Value</Text>
                        <Text style={styles.statValue}>{formatCurrency(totalAmount)}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Total Quantity</Text>
                        <Text style={styles.statValue}>{totalQuantity} kg</Text>
                    </View>
                </View>
            </View>

            {/* Content */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10b981" />
                </View>
            ) : (
                <FlatList
                    data={filteredPurchases}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="cart-outline" size={64} color="#d1d5db" />
                            <Text style={styles.emptyText}>No purchases found</Text>
                            <Text style={styles.emptySubtext}>Add a new purchase to get started</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    addButton: {
        backgroundColor: '#10b981',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    statsContainer: {
        flexDirection: 'row',
        marginTop: 16,
        backgroundColor: '#ecfdf5',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#d1fae5',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#059669',
        marginBottom: 4,
        fontWeight: '500',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#047857',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#d1fae5',
        marginHorizontal: 12,
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    partnerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e0e7ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4f46e5',
    },
    partnerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    date: {
        fontSize: 12,
        color: '#6b7280',
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    statusBadge: {
        fontSize: 10,
        fontWeight: '600',
        color: '#059669',
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    divider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginVertical: 12,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
    },
});

export default PurchasesScreen;
