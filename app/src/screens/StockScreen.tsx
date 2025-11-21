import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    useColorScheme,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { observer } from '@legendapp/state/react';
import { useWatermelonStockItems } from '../hooks/useWatermelonStockItems';
import { useFilterSystem } from '../hooks';
import { getFilterConfig } from '../config';
import { FilterBottomSheet } from '../components';
import { showErrorToast } from '../utils/toastUtils';
import { watermelonSyncService } from '../services/watermelonSyncService';
import NetInfo from '@react-native-community/netinfo';
import {
    StockCard,
    EmptyState,
    MultiActionFAB,
    SearchHeader
} from '../components/ui';
import { AddStockBottomSheet } from '../components/AddStockBottomSheet';
import { EditStockBottomSheet } from '../components/EditStockBottomSheet';
import { BuyStockBottomSheet } from '../components/BuyStockBottomSheet';
import { SellStockBottomSheet } from '../components/SellStockBottomSheet';

interface StockBag {
    id: string;
    weight_per_bag: number; // 40kg, 50kg, 60kg etc
    quantity_bags: number;  // How many bags of this weight
    price_per_bag: number;  // Price per bag
    total_weight: number;   // weight_per_bag * quantity_bags
    total_value: number;    // price_per_bag * quantity_bags
}

interface StockItem {
    id: string;
    name: string;
    category: string;
    bags: StockBag[];       // Multiple bag variants
    total_bags: number;     // Sum of all bags
    total_weight: number;   // Sum of all weights
    total_value: number;    // Sum of all values
    average_price_per_kg: number; // Average price per kg
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
    last_updated: string;
}

/**
 * STOCK MANAGEMENT SCREEN - WHATSAPP STYLE REDESIGN
 * Professional UI/UX matching Dashboard and Partners design
 * SearchHeader integration
 * FloatingActionButton
 * Pakistani currency (PKR)
 * Legend State + Supabase backend
 * Real-time sync
 * Professional components
 * ✅ SearchHeader integration
 * ✅ FloatingActionButton
 * ✅ Pakistani currency (PKR)
 * ✅ Legend State + Supabase backend
 * ✅ Real-time sync
 * ✅ Professional components
 */
const StockScreen: React.FC = observer(() => {
    const navigation = useNavigation<any>();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // ✅ WatermelonDB stock items (local-first, instant)
    const { stockItems: allStockItems, deleteStockItem } = useWatermelonStockItems();

    // ✅ UI state
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isAddStockVisible, setIsAddStockVisible] = useState(false);
    const [isEditStockVisible, setIsEditStockVisible] = useState(false);
    const [editingStockId, setEditingStockId] = useState<string | undefined>();
    const [isBuyStockVisible, setIsBuyStockVisible] = useState(false);
    const [buyingStockItem, setBuyingStockItem] = useState<any>(undefined);
    const [isSellStockVisible, setIsSellStockVisible] = useState(false);
    const [sellingStockItem, setSellingStockItem] = useState<any>(undefined);

    // ✅ Convert to display format with variants
    const stockItems: StockItem[] = (allStockItems || []).map((item: any) => {
        const variants = item.parsedVariants || [];
        return {
            id: item.id,
            name: item.itemName,
            category: item.categoryName || 'Stock Items',
            bags: variants.map((v: any) => ({
                id: v.id,
                weight_per_bag: v.weight_kg,
                quantity_bags: v.quantity,
                price_per_bag: v.rate_per_bag,
                total_weight: v.weight_kg * v.quantity,
                total_value: v.total_value
            })),
            total_bags: item.totalBags || 0,
            total_weight: item.totalQuantity || 0,
            total_value: item.totalValue || 0,
            average_price_per_kg: item.totalQuantity > 0 ? (item.totalValue / item.totalQuantity) : 0,
            status: (item.totalQuantity || 0) > 0 ? 'in_stock' : 'out_of_stock',
            last_updated: new Date(item.updatedAt || Date.now()).toISOString(),
        };
    });

    // ✅ Filter system for search and filtering
    const filterConfig = getFilterConfig('stock');
    const {
        filteredData: filteredStock,
        searchQuery: filterSearchQuery,
        setSearchQuery: setFilterSearchQuery,
        isFilterModalOpen: filterModalOpen,
        setIsFilterModalOpen: setFilterModalOpen,
        getActiveFiltersCount,
    } = useFilterSystem(stockItems, filterConfig);

    // Use search query from header or filter system
    const displayedStock = isSearchVisible
        ? stockItems.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : filteredStock;

    // ✅ Stats calculation
    const totalStockValue = stockItems.reduce((sum: number, item: any) => sum + (item.total_value || 0), 0);
    const inStockItems = stockItems.filter((item: any) => item.status === 'in_stock').length;
    const lowStockItems = stockItems.filter((item: any) => item.status === 'low_stock').length;

    // ✅ Navigation handlers
    const navigateToAddStock = () => {
        setIsAddStockVisible(true);
    };


    // ✅ Edit stock handler
    const handleEditStock = useCallback((stockId: string) => {
        setEditingStockId(stockId);
        setIsEditStockVisible(true);
    }, []);

    // ✅ Delete stock handler
    const handleDeleteStock = useCallback(async (stockId: string) => {
        try {
            await deleteStockItem(stockId);
            console.log('✅ Stock item deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            showErrorToast('Failed to delete stock item');
        }
    }, [deleteStockItem]);

    // ✅ Dynamic header based on search state
    React.useLayoutEffect(() => {
        if (isSearchVisible) {
            navigation.setOptions({
                headerTitle: '',
                headerLeft: () => (
                    <SearchHeader
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onClose={() => {
                            setSearchQuery('');
                            setIsSearchVisible(false);
                        }}
                        onFilterPress={() => setIsFilterModalOpen(true)}
                        filterCount={getActiveFiltersCount()}
                        placeholder="Search stock..."
                    />
                ),
                headerRight: () => null,
            });
        } else {
            navigation.setOptions({
                headerTitleContainerStyle: undefined,
                headerTitle: 'Stock Management',
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
    }, [navigation, isSearchVisible, searchQuery, setIsFilterModalOpen, getActiveFiltersCount]);

    // ✅ Unified refresh handler - used by both swipe and button
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            // Check network status
            const state = await NetInfo.fetch();
            const isOnline = state.isConnected && state.isInternetReachable;

            if (!isOnline) {
                console.log('📴 Offline - Cannot refresh');
                showErrorToast('You are offline');
                setRefreshing(false);
                return;
            }

            const startTime = Date.now();
            console.log('🔄 [REFRESH START] Fetching Stock data from Supabase...');
            console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);

            // Fetch Stock Items, Categories, and Charges data
            await watermelonSyncService.fullSync();

            const endTime = Date.now();
            const duration = endTime - startTime;

            console.log('✅ [REFRESH COMPLETE] Stock data loaded from Supabase');
            console.log(`⏱️ Duration: ${duration}ms`);
            console.log(`📊 Loaded: Stock Items + Categories + Charges`);
            console.log(`⏰ Completed at: ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            console.error('❌ [REFRESH ERROR] Failed to refresh data:', error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const renderItem = ({ item }: { item: StockItem }) => (
        <StockCard
            item={item}
            onEdit={() => handleEditStock(item.id)}
            onDelete={() => handleDeleteStock(item.id)}
        />
    );

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            {/* Content Area */}
            <FlatList
                data={displayedStock}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#10b981']}
                        tintColor="#10b981"
                    />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <EmptyState
                        icon="cube-outline"
                        title="No Stock Items Found"
                        subtitle="Add your first stock item to get started with inventory management"
                        buttonText="Add Stock Item"
                        onButtonPress={navigateToAddStock}
                    />
                }
            />

            {/* ✅ Filter Bottom Sheet */}
            <FilterBottomSheet
                visible={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                title="Filter Stock Items"
                filterOptions={[
                    {
                        key: 'status',
                        label: 'Stock Status',
                        type: 'multi-select',
                        options: [
                            { value: 'in_stock', label: 'In Stock' },
                            { value: 'low_stock', label: 'Low Stock' },
                            { value: 'out_of_stock', label: 'Out of Stock' },
                        ],
                    },
                    {
                        key: 'category',
                        label: 'Category',
                        type: 'multi-select',
                        options: [
                            { value: 'grains', label: 'Grains' },
                            { value: 'pulses', label: 'Pulses' },
                            { value: 'oilseeds', label: 'Oilseeds' },
                        ],
                    },
                ]}
                selectedFilters={{}}
                onFilterChange={(key: string, value: any) => {
                    console.log('Filter change:', key, value);
                }}
                onClearAll={() => {
                    console.log('Clear all filters');
                }}
                resultCount={displayedStock.length}
            />

            {/* 🎨 MULTI-ACTION FLOATING BUTTON */}
            <MultiActionFAB
                onCreateStock={() => setIsAddStockVisible(true)}
                onBuy={() => {
                    setBuyingStockItem(undefined);
                    setIsBuyStockVisible(true);
                }}
                onSell={() => {
                    setSellingStockItem(undefined);
                    setIsSellStockVisible(true);
                }}
            />

            {/* Add Stock Bottom Sheet */}
            <AddStockBottomSheet
                visible={isAddStockVisible}
                onClose={() => setIsAddStockVisible(false)}
            />

            {/* Edit Stock Bottom Sheet */}
            <EditStockBottomSheet
                visible={isEditStockVisible}
                onClose={() => {
                    setIsEditStockVisible(false);
                    setEditingStockId(undefined);
                }}
                stockItemId={editingStockId}
            />

            {/* Buy Stock Bottom Sheet */}
            <BuyStockBottomSheet
                visible={isBuyStockVisible}
                onClose={() => {
                    setIsBuyStockVisible(false);
                    setBuyingStockItem(undefined);
                }}
                stockItem={buyingStockItem}
            />

            {/* Sell Stock Bottom Sheet */}
            <SellStockBottomSheet
                visible={isSellStockVisible}
                onClose={() => {
                    setIsSellStockVisible(false);
                    setSellingStockItem(undefined);
                }}
                stockItem={sellingStockItem}
            />
        </View>
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
    content: {
        flex: 1,
        paddingTop: 8,
    },
});

export default StockScreen;
