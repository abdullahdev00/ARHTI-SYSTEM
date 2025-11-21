import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, useColorScheme, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { observer } from '@legendapp/state/react';
import { useWatermelonPartners } from '../hooks/useWatermelonPartners';
import { useWatermelonStockItems } from '../hooks/useWatermelonStockItems';
import { useWatermelonPurchases } from '../hooks/useWatermelonPurchases';
import { StockVariant } from '../database/stock-schema';
import { generateInvoicePDF, InvoiceData } from '../utils/invoicePdfGenerator';

interface Charge {
    id: string;
    name: string;
    type: 'fixed' | 'percentage';
    value: number;
    is_active: boolean;
}

interface BuyStockBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    stockItem?: any; // Using any for now as StockItem type might differ
}

const PADDING = 16;
const SPACING = 16;
type Step = 'partner' | 'crop' | 'bags' | 'review';

interface BuyItem {
    itemId: string;
    itemName: string;
    variants: { [variantId: string]: number };
    totalBags: number;
    totalQuantity: number;
    totalValue: number;
}

export const BuyStockBottomSheet: React.FC<BuyStockBottomSheetProps> = observer(({ visible, onClose, stockItem }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    // ✅ WatermelonDB Hooks
    const { partners } = useWatermelonPartners();
    const { stockItems, categories } = useWatermelonStockItems();
    const { createBuyTransaction } = useWatermelonPurchases();

    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState<Step>('partner');

    // Derived state
    const availableRoles = Array.from(new Set(partners.map(p => p.role)));
    const availableCategories = Array.from(new Set(stockItems.map(item => item.categoryId || 'uncategorized')));

    const [selectedRole, setSelectedRole] = useState<string>('');
    const [selectedPartner, setSelectedPartner] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedCrop, setSelectedCrop] = useState<string>('');
    const [selectedCropItem, setSelectedCropItem] = useState<any>(null);
    const [selectedVariants, setSelectedVariants] = useState<{ [variantId: string]: number }>({});
    const [currentBagWeight, setCurrentBagWeight] = useState('');
    const [currentBagRate, setCurrentBagRate] = useState('');
    const [currentBagQuantity, setCurrentBagQuantity] = useState('0');
    const [buyItems, setBuyItems] = useState<BuyItem[]>([]);
    const [printInvoice, setPrintInvoice] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'partial'>('unpaid');
    const [paidAmount, setPaidAmount] = useState('');
    const [charges, setCharges] = useState<Charge[]>([]); // TODO: Implement Charges Hook
    const [applyCharges, setApplyCharges] = useState(true);

    // Pre-select stock item if passed prop
    useEffect(() => {
        if (visible && stockItem) {
            setSelectedCrop(stockItem.id);
            setSelectedCropItem(stockItem);
            setCurrentStep('bags');
        }
    }, [visible, stockItem]);

    const filteredPartners = selectedRole ? partners.filter(p => p.role === selectedRole) : partners;

    // Calculate totals from selected variants
    // Note: Since WatermelonDB StockItem schema doesn't have persistent variants yet,
    // we are simulating variants or using what's available in the UI state.
    // For this refactor, we assume selectedCropItem might have simulated variants from EditStockBottomSheet logic
    // OR we allow user to add ad-hoc variants here if the item has none.

    // Helper to get variants for the selected item
    const getVariantsForItem = (item: any) => {
        // If item has no variants (schema limit), we provide a default one based on total quantity
        if (!item) return [];
        // For now, we can't easily "get" variants from DB as they aren't stored.
        // So we might need to allow user to input "Weight" and "Rate" manually for the buy transaction.
        // But the UI expects selecting from existing variants.
        // WORKAROUND: Allow creating "Transaction Variants" on the fly.
        // For now, let's assume we just input weight/rate/qty manually for the buy.
        return [];
    };

    // Since we can't reliably get variants from DB, we'll modify the UI to allow adding "Bags"
    // with Weight and Rate directly, instead of selecting from pre-defined variants.

    // ... Wait, the UI code below expects `selectedCropItem.variants`.
    // If `stockItems` from hook doesn't have variants, this will break.
    // We need to adapt the UI to "Add Bag Type" instead of "Select Variant".

    const totalQuantity = Object.values(selectedVariants).reduce((sum, qty) => sum + qty, 0); // Placeholder

    // Let's simplify: The user adds "Lines" to the buy item.
    // Each line has Weight, Rate, Quantity.
    // We store this in `buyItems`.

    // ...

    // Actually, to keep it simple and consistent with EditStockBottomSheet:
    // We will just allow entering Total Quantity and Total Rate for the item in this simplified version,
    // OR we implement a "Add Bag Details" section.

    // Let's stick to the existing UI flow but adapt data sources.
    // If `selectedCropItem` doesn't have variants, we show an empty list and allow adding "New Variant" (in memory) for this transaction.

    const [transactionVariants, setTransactionVariants] = useState<StockVariant[]>([]);

    const addTransactionVariant = () => {
        if (!currentBagWeight || !currentBagRate || !currentBagQuantity) return;
        const newVariant: StockVariant = {
            id: Date.now().toString(),
            weight_kg: parseFloat(currentBagWeight),
            rate_per_bag: parseFloat(currentBagRate),
            quantity: parseInt(currentBagQuantity),
            total_value: parseFloat(currentBagRate) * parseInt(currentBagQuantity)
        };
        setTransactionVariants([...transactionVariants, newVariant]);
        setCurrentBagWeight('');
        setCurrentBagRate('');
        setCurrentBagQuantity('0');
    };

    const removeTransactionVariant = (id: string) => {
        setTransactionVariants(transactionVariants.filter(v => v.id !== id));
    };

    const currentItemTotalBags = transactionVariants.reduce((sum, v) => sum + v.quantity, 0);
    const currentItemTotalQty = transactionVariants.reduce((sum, v) => sum + (v.weight_kg * v.quantity), 0);
    const currentItemTotalValue = transactionVariants.reduce((sum, v) => sum + v.total_value, 0);

    // Calculate total value of all items in buyItems
    const totalAllValue = buyItems.reduce((sum, item) => sum + item.totalValue, 0) + currentItemTotalValue;
    const chargesAmount = 0; // Charges not implemented yet
    const finalTotal = totalAllValue + chargesAmount;

    // Validate payment amount
    const isValidPayment = () => {
        if (paymentStatus === 'paid') return true;
        if (paymentStatus === 'unpaid') return true;
        if (paymentStatus === 'partial') {
            const paid = parseInt(paidAmount) || 0;
            return paid > 0 && paid < totalAllValue;
        }
        return false;
    };

    // Add current item to buy list
    const handleAddItem = () => {
        if (!selectedCropItem || transactionVariants.length === 0) {
            Alert.alert('Error', 'Please add at least one bag type');
            return;
        }

        const newItem: BuyItem = {
            itemId: selectedCropItem.id,
            itemName: selectedCropItem.name,
            variants: {}, // Not used in new logic
            totalBags: currentItemTotalBags,
            totalQuantity: currentItemTotalQty,
            totalValue: currentItemTotalValue,
        };

        setBuyItems([...buyItems, newItem]);

        // Reset for next item
        setSelectedCategory('');
        setSelectedCrop('');
        setSelectedCropItem(null);
        setTransactionVariants([]);

        // Go back to crop selection
        setCurrentStep('crop');
    };

    const handleRemoveItem = (itemId: string) => {
        setBuyItems(buyItems.filter(item => item.itemId !== itemId));
    };

    const handleSaveBuy = async () => {
        if (!selectedPartner || buyItems.length === 0) {
            Alert.alert('Error', 'Please select at least one item to buy');
            return;
        }

        if (!isValidPayment()) {
            Alert.alert('Error', 'Please enter valid payment amount');
            return;
        }

        const totalAllBags = buyItems.reduce((sum, item) => sum + item.totalBags, 0);
        const totalAllValue = buyItems.reduce((sum, item) => sum + item.totalValue, 0);
        const paidAmountValue = paymentStatus === 'partial' ? parseInt(paidAmount) || 0 : (paymentStatus === 'paid' ? finalTotal : 0);

        const partnerName = partners.find(p => p.id === selectedPartner)?.name || 'Unknown';

        Alert.alert(
            '✅ Confirm Buy Transaction',
            `Partner: ${partnerName}\nItems: ${buyItems.length}\nBags: ${totalAllBags}\nTotal: Rs. ${totalAllValue.toLocaleString('en-IN')}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => processTransaction(paidAmountValue),
                    style: 'default',
                },
            ]
        );
    };

    const processTransaction = async (paidAmountValue: number) => {
        setIsLoading(true);
        try {
            // Prepare items for createBuyTransaction
            const transactionItems = buyItems.map(item => ({
                stockItemId: item.itemId,
                cropName: item.itemName,
                quantity: item.totalQuantity,
                rate: item.totalValue / item.totalQuantity, // Average rate
                total: item.totalValue
            }));

            const paymentDetails = {
                totalValue: finalTotal,
                paidAmount: paidAmountValue,
                paymentStatus
            };

            await createBuyTransaction(selectedPartner, transactionItems, paymentDetails);

            Alert.alert('Success', 'Transaction recorded successfully');

            if (printInvoice) {
                // Generate PDF (Simplified for now)
                // ...
            }

            resetForm();
            onClose();
        } catch (error) {
            console.error('Transaction failed:', error);
            Alert.alert('Error', 'Failed to save transaction');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setCurrentStep('partner');
        setSelectedRole('');
        setSelectedPartner('');
        setSelectedCategory('');
        setSelectedCrop('');
        setSelectedCropItem(null);
        setTransactionVariants([]);
        setCurrentBagWeight('');
        setCurrentBagRate('');
        setCurrentBagQuantity('0');
        setBuyItems([]);
        setPaymentStatus('unpaid');
        setPaidAmount('');
        setPrintInvoice(false);
    };

    const handleNext = () => {
        if (currentStep === 'partner' && !selectedPartner) {
            Alert.alert('Error', 'Please select a partner');
            return;
        }
        if (currentStep === 'crop') {
            if (!selectedCrop && buyItems.length === 0) {
                Alert.alert('Error', 'Please select a crop');
                return;
            }
            if (!selectedCrop && buyItems.length > 0) {
                setCurrentStep('review');
                return;
            }
        }
        if (currentStep === 'bags') {
            if (transactionVariants.length === 0 && buyItems.length === 0) {
                Alert.alert('Error', 'Please add at least one bag type');
                return;
            }
            if (transactionVariants.length === 0 && buyItems.length > 0) {
                setCurrentStep('review');
                return;
            }
        }

        if (currentStep === 'partner') setCurrentStep('crop');
        else if (currentStep === 'crop') setCurrentStep('bags');
        else if (currentStep === 'bags') {
            handleAddItem();
            setCurrentStep('review');
        }
    };

    const handleBack = () => {
        if (currentStep === 'crop') setCurrentStep('partner');
        else if (currentStep === 'bags') setCurrentStep('crop');
        else if (currentStep === 'review') setCurrentStep('bags');
    };

    return (
        <Modal visible={visible} onRequestClose={onClose} animationType="slide" transparent={false}>
            <View style={[styles.container, isDark && styles.containerDark]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={currentStep !== 'partner' ? handleBack : onClose}>
                        <Ionicons name={currentStep !== 'partner' ? 'arrow-back' : 'close'} size={24} color={isDark ? 'white' : '#1e293b'} />
                    </TouchableOpacity>
                    <Text style={[styles.title, isDark && styles.titleDark]}>
                        {currentStep === 'partner' && 'Select Partner'}
                        {currentStep === 'crop' && 'Select Crop'}
                        {currentStep === 'bags' && 'Add Bags'}
                        {currentStep === 'review' && 'Review Items'}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Progress Steps */}
                <View style={styles.progressContainer}>
                    {(['partner', 'crop', 'bags', 'review'] as Step[]).map((step, idx) => (
                        <View key={step} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.progressDot, (['partner', 'crop', 'bags', 'review'].indexOf(currentStep) >= idx) && styles.progressDotActive, isDark && styles.progressDotDark]}>
                                <Text style={styles.progressDotText}>{idx + 1}</Text>
                            </View>
                            {idx < 3 && <View style={[styles.progressLine, isDark && styles.progressLineDark]} />}
                        </View>
                    ))}
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {currentStep === 'partner' && (
                        <View style={styles.stepContainer}>
                            <Text style={[styles.stepTitle, isDark && styles.stepTitleDark]}>Filter by Role</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rolesRow}>
                                <TouchableOpacity style={[styles.roleChip, !selectedRole && styles.roleChipSelected, isDark && styles.roleChipDark]} onPress={() => setSelectedRole('')}>
                                    <Text style={[styles.roleChipText, !selectedRole && styles.roleChipTextSelected]}>All</Text>
                                </TouchableOpacity>
                                {availableRoles.map(role => (
                                    <TouchableOpacity key={role} style={[styles.roleChip, selectedRole === role && styles.roleChipSelected, isDark && styles.roleChipDark]} onPress={() => setSelectedRole(role)}>
                                        <Text style={[styles.roleChipText, selectedRole === role && styles.roleChipTextSelected]}>
                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={[styles.stepTitle, isDark && styles.stepTitleDark, { marginTop: SPACING }]}>Select Partner</Text>
                            <FlatList data={filteredPartners} keyExtractor={item => item.id} scrollEnabled={false} renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.partnerItem, selectedPartner === item.id && styles.partnerItemSelected, isDark && styles.partnerItemDark]} onPress={() => setSelectedPartner(item.id)}>
                                    <View style={styles.partnerContent}>
                                        <Text style={[styles.partnerName, isDark && styles.partnerNameDark]}>{item.name}</Text>
                                        <Text style={[styles.partnerRole, isDark && styles.partnerRoleDark]}>{item.role}</Text>
                                        <Text style={[styles.partnerPhone, isDark && styles.partnerPhoneDark]}>{item.phone}</Text>
                                    </View>
                                    {selectedPartner === item.id && <Ionicons name="checkmark-circle" size={24} color="#10b981" />}
                                </TouchableOpacity>
                            )} />
                        </View>
                    )}

                    {currentStep === 'crop' && (
                        <View style={styles.stepContainer}>
                            <Text style={[styles.stepTitle, isDark && styles.stepTitleDark]}>Select Stock Item</Text>
                            <FlatList
                                data={stockItems}
                                keyExtractor={item => item.id}
                                scrollEnabled={false}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.cropItem, selectedCrop === item.id && styles.cropItemSelected, isDark && styles.cropItemDark]}
                                        onPress={() => {
                                            setSelectedCrop(item.id);
                                            setSelectedCropItem(item);
                                        }}
                                    >
                                        <View style={styles.cropContent}>
                                            <Text style={[styles.cropName, isDark && styles.cropNameDark]}>{item.name}</Text>
                                            <Text style={[styles.cropInfo, isDark && styles.cropInfoDark]}>{item.quantity} kg in stock</Text>
                                        </View>
                                        {selectedCrop === item.id && <Ionicons name="checkmark-circle" size={24} color="#10b981" />}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    )}

                    {currentStep === 'bags' && (
                        <View style={styles.stepContainer}>
                            <Text style={[styles.stepTitle, isDark && styles.stepTitleDark]}>Add Bags for {selectedCropItem?.name}</Text>

                            <View style={styles.bagInputRow}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Weight (kg)</Text>
                                    <TextInput
                                        style={[styles.input, isDark && styles.inputDark]}
                                        placeholder="40"
                                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                        value={currentBagWeight}
                                        onChangeText={setCurrentBagWeight}
                                        keyboardType="decimal-pad"
                                        editable={!isLoading}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Rate</Text>
                                    <TextInput
                                        style={[styles.input, isDark && styles.inputDark]}
                                        placeholder="7200"
                                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                        value={currentBagRate}
                                        onChangeText={setCurrentBagRate}
                                        keyboardType="decimal-pad"
                                        editable={!isLoading}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Qty</Text>
                                    <TextInput
                                        style={[styles.input, isDark && styles.inputDark]}
                                        placeholder="1"
                                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                        value={currentBagQuantity}
                                        onChangeText={setCurrentBagQuantity}
                                        keyboardType="number-pad"
                                        editable={!isLoading}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity style={styles.addBagBtn} onPress={addTransactionVariant}>
                                <Ionicons name="add" size={20} color="white" />
                                <Text style={styles.addBagBtnText}>Add to List</Text>
                            </TouchableOpacity>

                            {transactionVariants.map((variant, idx) => (
                                <View key={variant.id} style={styles.bagRow}>
                                    <Text style={[styles.bagRowText, isDark && styles.bagRowTextDark]}>{variant.weight_kg}kg @ Rs.{variant.rate_per_bag}</Text>
                                    <Text style={[styles.bagRowText, isDark && styles.bagRowTextDark]}>x {variant.quantity}</Text>
                                    <TouchableOpacity onPress={() => removeTransactionVariant(variant.id)}>
                                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {currentStep === 'review' && (
                        <View style={styles.stepContainer}>
                            <Text style={[styles.stepTitle, isDark && styles.stepTitleDark]}>Review & Pay</Text>

                            {buyItems.map((item, idx) => (
                                <View key={idx} style={[styles.reviewItem, isDark && styles.reviewItemDark]}>
                                    <Text style={[styles.reviewItemName, isDark && styles.reviewItemNameDark]}>{item.itemName}</Text>
                                    <Text style={[styles.reviewItemDetail, isDark && styles.reviewItemDetailDark]}>{item.totalBags} bags • {item.totalQuantity} kg</Text>
                                    <Text style={[styles.reviewItemPrice, isDark && styles.reviewItemPriceDark]}>Rs. {item.totalValue.toLocaleString('en-IN')}</Text>
                                    <TouchableOpacity onPress={() => handleRemoveItem(item.itemId)}>
                                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            <View style={styles.totalSection}>
                                <Text style={[styles.totalLabel, isDark && styles.totalLabelDark]}>Total Amount</Text>
                                <Text style={[styles.totalValue, isDark && styles.totalValueDark]}>Rs. {finalTotal.toLocaleString('en-IN')}</Text>
                            </View>

                            <View style={styles.paymentSection}>
                                <Text style={[styles.label, isDark && styles.labelDark]}>Payment Status</Text>
                                <View style={styles.paymentOptions}>
                                    {(['paid', 'unpaid', 'partial'] as const).map(status => (
                                        <TouchableOpacity
                                            key={status}
                                            style={[styles.paymentOption, paymentStatus === status && styles.paymentOptionSelected]}
                                            onPress={() => setPaymentStatus(status)}
                                        >
                                            <Text style={[styles.paymentOptionText, paymentStatus === status && styles.paymentOptionTextSelected]}>
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {paymentStatus === 'partial' && (
                                    <TextInput
                                        style={[styles.input, isDark && styles.inputDark, { marginTop: 12 }]}
                                        placeholder="Enter Paid Amount"
                                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                        value={paidAmount}
                                        onChangeText={setPaidAmount}
                                        keyboardType="number-pad"
                                    />
                                )}
                            </View>
                        </View>
                    )}
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: insets.bottom + PADDING }]}>
                    {currentStep !== 'partner' && (
                        <TouchableOpacity style={[styles.btn, styles.btnCancel, isDark && styles.btnCancelDark]} onPress={handleBack} disabled={isLoading}>
                            <Text style={[styles.btnText, styles.btnCancelText, isDark && styles.btnCancelTextDark]}>Back</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.btn, styles.btnPrimary, isLoading && styles.btnDisabled]}
                        onPress={currentStep === 'review' ? handleSaveBuy : handleNext}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text style={styles.btnText}>{currentStep === 'review' ? 'Confirm Buy' : 'Next'}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    containerDark: { backgroundColor: '#1e293b' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: PADDING, paddingVertical: PADDING, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    title: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    titleDark: { color: 'white' },
    progressContainer: { flexDirection: 'row', paddingHorizontal: PADDING, marginBottom: SPACING },
    progressDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    progressDotActive: { backgroundColor: '#10b981' },
    progressDotDark: { backgroundColor: '#334155' },
    progressDotText: { fontSize: 12, fontWeight: '700', color: 'white' },
    progressLine: { flex: 1, height: 2, backgroundColor: '#e2e8f0', marginRight: 8 },
    progressLineDark: { backgroundColor: '#334155' },
    content: { flex: 1 },
    stepContainer: { paddingHorizontal: PADDING, paddingBottom: SPACING },
    stepTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: SPACING },
    stepTitleDark: { color: 'white' },
    rolesRow: { flexDirection: 'row', marginBottom: SPACING },
    roleChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8 },
    roleChipSelected: { backgroundColor: '#10b981' },
    roleChipDark: { backgroundColor: '#0f172a' },
    roleChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
    roleChipTextSelected: { color: 'white' },
    partnerItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, backgroundColor: '#f8fafc', marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    partnerItemSelected: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
    partnerItemDark: { backgroundColor: '#1e293b', borderColor: '#334155' },
    partnerContent: { flex: 1 },
    partnerName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    partnerNameDark: { color: 'white' },
    partnerRole: { fontSize: 12, color: '#64748b' },
    partnerRoleDark: { color: '#94a3b8' },
    partnerPhone: { fontSize: 12, color: '#94a3b8' },
    partnerPhoneDark: { color: '#64748b' },
    cropItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, backgroundColor: '#f8fafc', marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    cropItemSelected: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
    cropItemDark: { backgroundColor: '#1e293b', borderColor: '#334155' },
    cropContent: { flex: 1 },
    cropName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    cropNameDark: { color: 'white' },
    cropInfo: { fontSize: 12, color: '#64748b' },
    cropInfoDark: { color: '#94a3b8' },
    bagInputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    inputGroup: { flex: 1 },
    inputLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 },
    inputLabelDark: { color: '#cbd5e1' },
    input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1e293b' },
    inputDark: { backgroundColor: '#1e293b', borderColor: '#334155', color: 'white' },
    addBagBtn: { backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: SPACING },
    addBagBtnText: { fontSize: 14, fontWeight: '700', color: 'white' },
    bagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    bagRowText: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    bagRowTextDark: { color: 'white' },
    reviewItem: { padding: 12, borderRadius: 8, backgroundColor: '#f8fafc', marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    reviewItemDark: { backgroundColor: '#1e293b', borderColor: '#334155' },
    reviewItemName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    reviewItemNameDark: { color: 'white' },
    reviewItemDetail: { fontSize: 12, color: '#64748b' },
    reviewItemDetailDark: { color: '#94a3b8' },
    reviewItemPrice: { fontSize: 14, fontWeight: '700', color: '#10b981', marginTop: 4 },
    reviewItemPriceDark: { color: '#34d399' },
    totalSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', marginTop: 8 },
    totalLabel: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    totalLabelDark: { color: 'white' },
    totalValue: { fontSize: 18, fontWeight: '700', color: '#10b981' },
    totalValueDark: { color: '#34d399' },
    paymentSection: { marginTop: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
    labelDark: { color: 'white' },
    paymentOptions: { flexDirection: 'row', gap: 8 },
    paymentOption: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
    paymentOptionSelected: { backgroundColor: '#10b981', borderColor: '#10b981' },
    paymentOptionText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
    paymentOptionTextSelected: { color: 'white' },
    footer: { flexDirection: 'row', gap: SPACING, paddingHorizontal: PADDING, paddingTop: PADDING, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    btnPrimary: { backgroundColor: '#10b981' },
    btnCancel: { borderWidth: 1, borderColor: '#e2e8f0' },
    btnCancelDark: { borderColor: '#334155' },
    btnDisabled: { opacity: 0.6 },
    btnText: { fontSize: 14, fontWeight: '700', color: 'white' },
    btnCancelText: { color: '#64748b' },
    btnCancelTextDark: { color: '#cbd5e1' },
});
