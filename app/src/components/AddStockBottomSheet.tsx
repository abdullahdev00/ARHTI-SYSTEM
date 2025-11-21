import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    useColorScheme,
    Alert,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { observer } from '@legendapp/state/react';
import { useWatermelonStockItems } from '../hooks/useWatermelonStockItems';
import { StockVariant } from '../database/stock-schema';

interface AddStockBottomSheetProps {
    visible: boolean;
    onClose: () => void;
}

const PADDING = 16;
const SPACING = 16;

export const AddStockBottomSheet: React.FC<AddStockBottomSheetProps> = observer(({
    visible,
    onClose,
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    // ✅ WatermelonDB Hook
    const { createStockItem, categories, isLoading: isHookLoading, createCategory } = useWatermelonStockItems();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [itemName, setItemName] = useState('');
    const [variants, setVariants] = useState<StockVariant[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [currentVariantWeight, setCurrentVariantWeight] = useState('');
    const [currentVariantRate, setCurrentVariantRate] = useState('');
    const [currentVariantQuantity, setCurrentVariantQuantity] = useState('0');

    // Auto-calculate totals from variants
    const totalQuantity = variants.reduce((sum, v) => sum + (v.weight_kg * v.quantity), 0);
    const totalBags = variants.reduce((sum, v) => sum + v.quantity, 0);

    const addVariant = () => {
        if (!currentVariantWeight.trim() || isNaN(parseFloat(currentVariantWeight))) {
            Alert.alert('Error', 'Please enter valid weight');
            return;
        }
        if (!currentVariantRate.trim() || isNaN(parseFloat(currentVariantRate))) {
            Alert.alert('Error', 'Please enter valid rate per bag');
            return;
        }

        const quantity = parseInt(currentVariantQuantity) || 1;
        if (quantity <= 0) {
            Alert.alert('Error', 'Quantity must be greater than 0');
            return;
        }

        const weight = parseFloat(currentVariantWeight);
        const rate = parseFloat(currentVariantRate);
        const variantTotal = rate * quantity;

        const newVariant: StockVariant = {
            id: Date.now().toString(),
            weight_kg: weight,
            rate_per_bag: rate,
            quantity: quantity,
            total_value: variantTotal,
        };

        setVariants([...variants, newVariant]);
        setCurrentVariantWeight('');
        setCurrentVariantRate('');
        setCurrentVariantQuantity('0');
    };

    const removeVariant = (id: string) => {
        setVariants(variants.filter(v => v.id !== id));
    };


    const handleAddStock = async () => {
        if (!itemName.trim()) {
            Alert.alert('Error', 'Please enter item name');
            return;
        }
        if (variants.length === 0) {
            Alert.alert('Error', 'Please add at least one variant');
            return;
        }
        if (!selectedCategory) {
            Alert.alert('Error', 'Please select a category');
            return;
        }

        setIsSubmitting(true);

        try {
            // ✅ Pass itemName, categoryId, and variants array
            await createStockItem(itemName, selectedCategory, variants);

            Alert.alert('Success', `Stock item "${itemName}" created with ${variants.length} variant(s)`);
            resetForm();
            onClose();
        } catch (error) {
            console.error('Error creating stock item:', error);
            Alert.alert('Error', 'Failed to create stock item');
        } finally {
            setIsSubmitting(false);
        }
    };


    const resetForm = () => {
        setSelectedCategory('');
        setItemName('');
        setVariants([]);
        setCurrentVariantWeight('');
        setCurrentVariantRate('');
        setCurrentVariantQuantity('0');
        setNewCategoryName('');
        setShowNewCategory(false);
    };

    return (
        <Modal visible={visible} onRequestClose={onClose} animationType="slide" transparent={false}>
            <View style={[styles.container, isDark && styles.containerDark]}>
                <View style={styles.header}>
                    <Text style={[styles.title, isDark && styles.titleDark]}>Add Stock Item</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color={isDark ? 'white' : '#1e293b'} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.form}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: insets.bottom + SPACING }}
                >
                    {/* Categories */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
                            {categories.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.chip,
                                        selectedCategory === cat.id && styles.chipSelected,
                                        isDark && styles.chipDark,
                                    ]}
                                    onPress={() => setSelectedCategory(cat.id)}
                                >
                                    <Text style={[styles.chipText, selectedCategory === cat.id && styles.chipTextSelected]}>
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={[styles.chipAdd, isDark && styles.chipAddDark]}
                                onPress={() => setShowNewCategory(!showNewCategory)}
                            >
                                <Ionicons name="add" size={18} color={isDark ? '#10b981' : '#059669'} />
                            </TouchableOpacity>
                        </ScrollView>

                        {showNewCategory && (
                            <View style={styles.newCategoryRow}>
                                <TextInput
                                    style={[styles.input, isDark && styles.inputDark, { flex: 1 }]}
                                    placeholder="New category"
                                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                    value={newCategoryName}
                                    onChangeText={setNewCategoryName}
                                    editable={!isSubmitting}
                                />
                                <TouchableOpacity
                                    style={styles.addCategoryBtn}
                                    onPress={async () => {
                                        if (newCategoryName.trim()) {
                                            try {
                                                await createCategory(newCategoryName);
                                                setNewCategoryName('');
                                                setShowNewCategory(false);
                                                Alert.alert('Success', 'Category added');
                                            } catch (err) {
                                                Alert.alert('Error', 'Failed to add category');
                                            }
                                        }
                                    }}
                                    disabled={isSubmitting}
                                >
                                    <Ionicons name="checkmark" size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Item Name */}
                    <View style={styles.section}>
                        <Text style={[styles.label, isDark && styles.labelDark]}>Item Name *</Text>
                        <TextInput
                            style={[styles.input, isDark && styles.inputDark]}
                            placeholder="e.g., Basmati Rice"
                            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                            value={itemName}
                            onChangeText={setItemName}
                            editable={!isSubmitting}
                        />
                    </View>

                    {/* Total Bags - Auto Calculated with Quantity */}
                    <View style={styles.section}>
                        <Text style={[styles.label, isDark && styles.labelDark]}>Total Bags & Quantity</Text>
                        <View style={[styles.input, isDark && styles.inputDark, styles.readOnlyInput]}>
                            <View style={styles.totalBagsRow}>
                                <View>
                                    <Text style={[styles.readOnlyText, isDark && styles.readOnlyTextDark]}>
                                        {totalBags} bag{totalBags !== 1 ? 's' : ''} added
                                    </Text>
                                </View>
                                <View style={styles.quantityBadge}>
                                    <Text style={styles.quantityBadgeText}>
                                        {totalQuantity} kg
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Variants Section */}
                    <View style={[styles.bagsSection, isDark && styles.bagsSectionDark]}>
                        <View style={styles.sectionTitleRow}>
                            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Variants</Text>
                            <View style={[styles.bagCount, isDark && styles.bagCountDark]}>
                                <Text style={styles.bagCount}>{totalBags} bags</Text>
                            </View>
                        </View>

                        <View style={styles.bagInputRow}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Weight (kg)</Text>
                                <TextInput
                                    style={[styles.input, isDark && styles.inputDark]}
                                    placeholder="40"
                                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                    value={currentVariantWeight}
                                    onChangeText={setCurrentVariantWeight}
                                    keyboardType="decimal-pad"
                                    editable={!isSubmitting}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Rate</Text>
                                <TextInput
                                    style={[styles.input, isDark && styles.inputDark]}
                                    placeholder="7200"
                                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                    value={currentVariantRate}
                                    onChangeText={setCurrentVariantRate}
                                    keyboardType="decimal-pad"
                                    editable={!isSubmitting}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Qty *</Text>
                                <TextInput
                                    style={[styles.input, isDark && styles.inputDark]}
                                    placeholder="1"
                                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                    value={currentVariantQuantity}
                                    onChangeText={setCurrentVariantQuantity}
                                    keyboardType="number-pad"
                                    editable={!isSubmitting}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.addBagBtn, (isSubmitting || !currentVariantWeight.trim() || !currentVariantRate.trim() || !currentVariantQuantity.trim() || parseInt(currentVariantQuantity) <= 0) && styles.addBagBtnDisabled]}
                            onPress={addVariant}
                            disabled={isSubmitting || !currentVariantWeight.trim() || !currentVariantRate.trim() || !currentVariantQuantity.trim() || parseInt(currentVariantQuantity) <= 0}
                        >
                            <Ionicons name="add" size={20} color="white" />
                            <Text style={styles.addBagBtnText}>Add Variant</Text>
                        </TouchableOpacity>

                        {variants.length > 0 && (
                            <View style={styles.bagsListHeader}>
                                <Text style={[styles.bagsHeaderText, isDark && styles.bagsHeaderTextDark]}>Weight</Text>
                                <Text style={[styles.bagsHeaderText, isDark && styles.bagsHeaderTextDark]}>Rate</Text>
                                <Text style={[styles.bagsHeaderText, isDark && styles.bagsHeaderTextDark]}>Qty</Text>
                                <Text style={[styles.bagsHeaderText, isDark && styles.bagsHeaderTextDark]}>Action</Text>
                            </View>
                        )}

                        {variants.map((variant, idx) => (
                            <View key={variant.id} style={[styles.bagRow, idx === variants.length - 1 && styles.bagRowLast]}>
                                <Text style={[styles.bagRowText, isDark && styles.bagRowTextDark]}>{variant.weight_kg}kg</Text>
                                <Text style={[styles.bagRowText, isDark && styles.bagRowTextDark]}>{variant.rate_per_bag}</Text>
                                <View style={styles.qtyBadge}>
                                    <Text style={styles.qtyBadgeText}>{variant.quantity}</Text>
                                </View>
                                <TouchableOpacity style={styles.deleteBtn} onPress={() => removeVariant(variant.id)} disabled={isSubmitting}>
                                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {variants.length === 0 && (
                            <View style={styles.emptyState}>
                                <Ionicons name="cube-outline" size={40} color={isDark ? '#475569' : '#cbd5e1'} />
                                <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>No variants added</Text>
                                <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>Add at least 1 variant</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: insets.bottom + PADDING }]}>
                    <TouchableOpacity style={[styles.btn, styles.btnCancel, isDark && styles.btnCancelDark]} onPress={onClose} disabled={isSubmitting}>
                        <Text style={[styles.btnText, styles.btnCancelText, isDark && styles.btnCancelTextDark]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btn, styles.btnPrimary, isSubmitting && styles.btnDisabled]}
                        onPress={handleAddStock}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <>
                                <Ionicons name="add" size={18} color="white" />
                                <Text style={styles.btnText}>Add Stock</Text>
                            </>
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
    form: { flex: 1, paddingHorizontal: PADDING, paddingVertical: SPACING },
    section: { marginBottom: SPACING },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: SPACING },
    sectionTitleDark: { color: 'white' },
    sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING },
    categoriesRow: { marginBottom: SPACING },
    chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
    chipDark: { backgroundColor: '#0f172a', borderColor: '#334155' },
    chipSelected: { backgroundColor: '#10b981', borderColor: '#10b981' },
    chipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
    chipTextSelected: { color: 'white' },
    chipAdd: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#d1fae5', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    chipAddDark: { backgroundColor: '#064e3b', borderColor: '#10b981' },
    newCategoryRow: { flexDirection: 'row', gap: SPACING, marginTop: SPACING },
    addCategoryBtn: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
    labelDark: { color: 'white' },
    inputLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 },
    inputLabelDark: { color: '#cbd5e1' },
    input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1e293b' },
    inputDark: { backgroundColor: '#1e293b', borderColor: '#334155', color: 'white' },
    inputGroup: { flex: 1 },
    bagsSection: { borderRadius: 12, backgroundColor: '#f8fafc', padding: PADDING, borderWidth: 1, borderColor: '#e2e8f0' },
    bagsSectionDark: { backgroundColor: '#0f172a', borderColor: '#334155' },
    bagCount: { fontSize: 12, fontWeight: '600', color: '#10b981', backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    bagCountDark: { backgroundColor: '#064e3b', color: '#86efac' },
    bagInputRow: { flexDirection: 'row', gap: SPACING, marginBottom: SPACING },
    addBagBtn: { backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: SPACING },
    addBagBtnDisabled: { opacity: 0.5 },
    addBagBtnText: { fontSize: 14, fontWeight: '700', color: 'white' },
    bagsListHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 8, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    bagsHeaderText: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', flex: 1 },
    bagsHeaderTextDark: { color: '#64748b' },
    bagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    bagRowLast: { borderBottomWidth: 0 },
    bagRowText: { fontSize: 14, fontWeight: '600', color: '#1e293b', flex: 1 },
    bagRowTextDark: { color: 'white' },
    deleteBtn: { width: 36, height: 36, borderRadius: 6, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 8 },
    emptyText: { fontSize: 14, fontWeight: '600', color: '#64748b', textAlign: 'center' },
    emptyTextDark: { color: '#cbd5e1' },
    emptySubtext: { fontSize: 12, color: '#94a3b8', textAlign: 'center' },
    emptySubtextDark: { color: '#64748b' },
    readOnlyInput: { justifyContent: 'center', paddingVertical: 12 },
    readOnlyText: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    readOnlyTextDark: { color: 'white' },
    totalBagsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING },
    quantityBadge: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    quantityBadgeText: { fontSize: 12, fontWeight: '700', color: 'white' },
    qtyBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    qtyBadgeText: { fontSize: 12, fontWeight: '700', color: '#0369a1' },
    footer: { flexDirection: 'row', gap: SPACING, paddingHorizontal: PADDING, paddingTop: PADDING, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    btnPrimary: { backgroundColor: '#10b981' },
    btnCancel: { borderWidth: 1, borderColor: '#e2e8f0' },
    btnCancelDark: { borderColor: '#334155' },
    btnDisabled: { opacity: 0.6 },
    btnText: { fontSize: 14, fontWeight: '700', color: 'white' },
    btnCancelText: { color: '#64748b' },
    btnCancelTextDark: { color: '#cbd5e1' },
});
