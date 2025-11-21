import React, { useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, StyleSheet, Modal, GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface StockBag {
    id: string;
    weight_per_bag: number;
    quantity_bags: number;
    price_per_bag: number;
    total_weight: number;
    total_value: number;
}

interface StockItem {
    id: string;
    name: string;
    category: string;
    bags: StockBag[];
    total_bags: number;
    total_weight: number;
    total_value: number;
    average_price_per_kg: number;
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
    last_updated: string;
}

interface StockCardProps {
    item: StockItem;
    onPress?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

/**
 * PROFESSIONAL STOCK CARD COMPONENT - REDESIGNED
 * ✅ Multiple bags support with different weights
 * ✅ 3-dot menu with Buy/Sell/Edit/Delete actions
 * ✅ Pakistani currency formatting
 * ✅ WhatsApp-style professional design
 * ✅ Glass morphism effects
 */
export const StockCard: React.FC<StockCardProps> = ({
    item,
    onPress,
    onEdit,
    onDelete,
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [showMenu, setShowMenu] = useState(false);

    // Format Pakistani currency
    const formatPKR = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Get status color and icon
    const getStatusInfo = () => {
        switch (item.status) {
            case 'in_stock':
                return { color: '#10b981', icon: 'checkmark-circle', text: 'In Stock' };
            case 'low_stock':
                return { color: '#f59e0b', icon: 'warning', text: 'Low Stock' };
            case 'out_of_stock':
                return { color: '#ef4444', icon: 'close-circle', text: 'Out of Stock' };
            default:
                return { color: '#6b7280', icon: 'help-circle', text: 'Unknown' };
        }
    };

    const statusInfo = getStatusInfo();

    // Handle menu actions
    const handleMenuAction = (action: string) => {
        setShowMenu(false);
        switch (action) {
            case 'edit':
                onEdit?.();
                break;
            case 'delete':
                onDelete?.();
                break;
        }
    };

    // Handle long press to open menu
    const handleLongPress = () => {
        setShowMenu(true);
    };

    return (
        <>
            <TouchableOpacity
                style={[styles.container, isDark && styles.containerDark]}
                onPress={onPress}
                onLongPress={handleLongPress}
                activeOpacity={0.7}
                delayLongPress={500}
            >
                {/* Glass morphism background */}
                <LinearGradient
                    colors={isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                    style={styles.gradient}
                />

                {/* Header with name and 3-dot menu */}
                <View style={styles.header}>
                    <View style={styles.titleSection}>
                        <Text style={[styles.name, isDark && styles.nameDark]}>{item.name}</Text>
                        <Text style={[styles.category, isDark && styles.categoryDark]}>{item.category}</Text>
                    </View>

                    {/* 3-Dot Menu Button */}
                    <TouchableOpacity
                        style={[styles.menuButton, isDark && styles.menuButtonDark]}
                        onPress={() => setShowMenu(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="ellipsis-vertical" size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
                    </TouchableOpacity>
                </View>

                {/* Multiple Bags Section */}
                <View style={styles.bagsSection}>
                    <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                        Stock Details
                    </Text>

                    {item.bags.length > 0 ? (
                        item.bags.map((bag, index) => (
                            <View key={bag.id} style={styles.bagRow}>
                                <View style={styles.bagInfo}>
                                    <Text style={[styles.bagWeight, isDark && styles.bagWeightDark]}>
                                        {bag.weight_per_bag}kg
                                    </Text>
                                    <Text style={[styles.bagQuantity, isDark && styles.bagQuantityDark]}>
                                        × {bag.quantity_bags} bags
                                    </Text>
                                </View>
                                <View style={styles.bagValue}>
                                    <Text style={[styles.bagPrice, isDark && styles.bagPriceDark]}>
                                        {formatPKR(bag.price_per_bag)}/bag
                                    </Text>
                                    <Text style={[styles.bagTotal, isDark && styles.bagTotalDark]}>
                                        {formatPKR(bag.total_value)}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyBags}>
                            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                                No stock available
                            </Text>
                        </View>
                    )}
                </View>

                {/* Summary Section */}
                <View style={styles.summary}>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Ionicons name="cube-outline" size={16} color="#6b7280" />
                            <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Total Bags</Text>
                            <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                                {item.total_bags}
                            </Text>
                        </View>

                        <View style={styles.summaryItem}>
                            <Ionicons name="scale-outline" size={16} color="#6b7280" />
                            <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Total Weight</Text>
                            <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                                {item.total_weight}kg
                            </Text>
                        </View>
                    </View>

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Ionicons name="cash-outline" size={16} color="#6b7280" />
                            <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Total Value</Text>
                            <Text style={[styles.totalValue, isDark && styles.totalValueDark]}>
                                {formatPKR(item.total_value)}
                            </Text>
                        </View>

                        <View style={styles.summaryItem}>
                            <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.color} />
                            <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Status</Text>
                            <Text style={[styles.statusText, { color: statusInfo.color }]}>
                                {statusInfo.text}
                            </Text>
                        </View>
                    </View>
                </View>


                {/* Footer with average price and last updated */}
                <View style={styles.footer}>
                    <View style={styles.footerLeft}>
                        <Text style={[styles.averagePrice, isDark && styles.averagePriceDark]}>
                            Avg: {formatPKR(item.average_price_per_kg)}/kg
                        </Text>
                    </View>
                    <View style={styles.footerRight}>
                        <Ionicons name="time-outline" size={12} color="#9ca3af" />
                        <Text style={styles.lastUpdated}>
                            {new Date(item.last_updated).toLocaleDateString('en-PK')}
                        </Text>
                    </View>
                </View>

                {/* Decorative elements */}
                <View style={[styles.decorativeCircle, { backgroundColor: statusInfo.color + '20' }]} />
                <View style={[styles.decorativeLine, isDark && styles.decorativeLineDark]} />
            </TouchableOpacity>

            {/* 3-Dot Action Menu Modal - FIXED */}
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
                        <View style={styles.menuHeader}>
                            <Text style={[styles.menuTitle, isDark && styles.menuTitleDark]}>
                                {item.name}
                            </Text>
                            <TouchableOpacity
                                style={styles.closeMenuBtn}
                                onPress={() => setShowMenu(false)}
                            >
                                <Ionicons name="close" size={20} color={isDark ? 'white' : '#1c1c1e'} />
                            </TouchableOpacity>
                        </View>

                        {/* Edit Action */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleMenuAction('edit')}
                        >
                            <Ionicons name="create-outline" size={20} color="#3b82f6" />
                            <Text style={[styles.menuItemText, { color: '#3b82f6' }]}>Edit Item</Text>
                        </TouchableOpacity>

                        {/* Delete Action */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleMenuAction('delete')}
                        >
                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Delete Item</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    containerDark: {
        backgroundColor: '#1c1c1e',
        shadowColor: '#000',
        shadowOpacity: 0.3,
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 16,
        paddingBottom: 12,
    },
    titleSection: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1c1c1e',
        marginBottom: 4,
    },
    nameDark: {
        color: 'white',
    },
    category: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    categoryDark: {
        color: '#9ca3af',
    },
    menuButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuButtonDark: {
        backgroundColor: '#374151',
    },
    bagsSection: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1c1c1e',
        marginBottom: 12,
    },
    sectionTitleDark: {
        color: 'white',
    },
    bagRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginBottom: 8,
    },
    bagInfo: {
        flex: 1,
    },
    bagWeight: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1c1c1e',
    },
    bagWeightDark: {
        color: 'white',
    },
    bagQuantity: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    bagQuantityDark: {
        color: '#9ca3af',
    },
    bagValue: {
        alignItems: 'flex-end',
    },
    bagPrice: {
        fontSize: 12,
        color: '#6b7280',
    },
    bagPriceDark: {
        color: '#9ca3af',
    },
    bagTotal: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10b981',
        marginTop: 2,
    },
    bagTotalDark: {
        color: '#10b981',
    },
    emptyBags: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    emptyTextDark: {
        color: '#9ca3af',
    },
    summary: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6b7280',
        flex: 1,
    },
    summaryLabelDark: {
        color: '#9ca3af',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1c1c1e',
    },
    summaryValueDark: {
        color: 'white',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#10b981',
    },
    totalValueDark: {
        color: '#10b981',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    footerLeft: {
        flex: 1,
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    averagePrice: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    averagePriceDark: {
        color: '#9ca3af',
    },
    lastUpdated: {
        fontSize: 11,
        color: '#9ca3af',
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
    decorativeLine: {
        position: 'absolute',
        bottom: 0,
        left: 16,
        right: 16,
        height: 2,
        backgroundColor: '#10b981',
        opacity: 0.2,
    },
    decorativeLineDark: {
        backgroundColor: '#10b981',
    },
    // Action Buttons Styles
    actionButtonsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
        gap: 6,
    },

    actionBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
    },
    menuModal: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        minWidth: 200,
        maxWidth: 280,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 1000,
    },
    menuModalDark: {
        backgroundColor: '#1c1c1e',
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1c1c1e',
        flex: 1,
    },
    menuTitleDark: {
        color: 'white',
    },
    closeMenuBtn: {
        padding: 8,
        marginRight: -8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        gap: 12,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '500',
    },
});
