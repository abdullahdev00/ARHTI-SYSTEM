import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    TextInput,
    useColorScheme,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface InvoiceEditBottomSheetProps {
    visible: boolean;
    invoice: any;
    onClose: () => void;
    onSave: (updatedInvoice: any) => Promise<void>;
    onDelete: () => Promise<void>;
}

export const InvoiceEditBottomSheet: React.FC<InvoiceEditBottomSheetProps> = ({
    visible,
    invoice,
    onClose,
    onSave,
    onDelete,
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    const [status, setStatus] = useState<'paid' | 'unpaid' | 'partial'>((invoice?.payment_status as 'paid' | 'unpaid' | 'partial') || 'unpaid');
    const [paidAmount, setPaidAmount] = useState(String(invoice?.paid_amount ?? 0));
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (invoice) {
            setStatus((invoice.payment_status as 'paid' | 'unpaid' | 'partial') || 'unpaid');
            setPaidAmount(String(invoice.paid_amount ?? 0));
        }
    }, [invoice, visible]);

    const totalAmount = useMemo(() => {
        return parseFloat(String(invoice?.grand_total || 0));
    }, [invoice]);

    const remainingAmount = useMemo(() => {
        return totalAmount - parseFloat(paidAmount ?? '0');
    }, [totalAmount, paidAmount]);

    const handleStatusChange = (newStatus: 'paid' | 'unpaid' | 'partial') => {
        setStatus(newStatus);
        if (newStatus === 'paid') {
            setPaidAmount(String(totalAmount));
        } else if (newStatus === 'unpaid') {
            setPaidAmount('0');
        }
    };

    const handleSave = async () => {
        try {
            const paid = parseFloat(paidAmount ?? '0');
            if (paid < 0 || paid > totalAmount) {
                Alert.alert('Invalid Amount', `Paid amount must be between 0 and Rs. ${totalAmount.toLocaleString('en-IN')}`);
                return;
            }

            setIsLoading(true);
            await onSave({
                payment_status: status,
                paid_amount: paid,
                remaining_amount: remainingAmount,
            });
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to update invoice');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Invoice',
            'Are you sure you want to delete this invoice? This action cannot be undone.',
            [
                { text: 'Cancel', onPress: () => { }, style: 'cancel' },
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            await onDelete();
                            onClose();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete invoice');
                        } finally {
                            setIsLoading(false);
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={[styles.container, isDark && styles.containerDark]}>
                {/* Backdrop */}
                <TouchableOpacity
                    style={styles.backdrop}
                    onPress={onClose}
                    activeOpacity={0.3}
                />

                {/* Bottom Sheet */}
                <View style={[styles.bottomSheet, isDark && styles.bottomSheetDark, { paddingBottom: insets.bottom }]}>
                    {/* Header */}
                    <View style={[styles.header, isDark && styles.headerDark]}>
                        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
                            Edit Invoice
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={isDark ? 'white' : '#1e293b'} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    >
                        {/* Invoice Info */}
                        <View style={[styles.section, isDark && styles.sectionDark]}>
                            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                                Invoice Details
                            </Text>
                            <View style={styles.infoRow}>
                                <Text style={[styles.label, isDark && styles.labelDark]}>Invoice #</Text>
                                <Text style={[styles.value, isDark && styles.valueDark]}>
                                    {invoice?.invoice_number}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={[styles.label, isDark && styles.labelDark]}>Partner</Text>
                                <Text style={[styles.value, isDark && styles.valueDark]}>
                                    {invoice?.partner_name}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={[styles.label, isDark && styles.labelDark]}>Date</Text>
                                <Text style={[styles.value, isDark && styles.valueDark]}>
                                    {new Date(invoice?.invoice_date).toLocaleDateString('en-IN')}
                                </Text>
                            </View>
                        </View>

                        {/* Amount Summary */}
                        <View style={[styles.section, isDark && styles.sectionDark]}>
                            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                                Amount Summary
                            </Text>
                            <View style={[styles.amountCard, isDark && styles.amountCardDark]}>
                                <View style={styles.amountRow}>
                                    <Text style={[styles.amountLabel, isDark && styles.amountLabelDark]}>
                                        Total Amount
                                    </Text>
                                    <Text style={[styles.amountValue, { color: '#2563eb' }]}>
                                        Rs. {totalAmount.toLocaleString('en-IN')}
                                    </Text>
                                </View>
                                <View style={[styles.divider, isDark && styles.dividerDark]} />
                                <View style={styles.amountRow}>
                                    <Text style={[styles.amountLabel, isDark && styles.amountLabelDark]}>
                                        Paid Amount
                                    </Text>
                                    <Text style={[styles.amountValue, { color: '#10b981' }]}>
                                        Rs. {parseFloat(paidAmount ?? '0').toLocaleString('en-IN')}
                                    </Text>
                                </View>
                                <View style={[styles.divider, isDark && styles.dividerDark]} />
                                <View style={styles.amountRow}>
                                    <Text style={[styles.amountLabel, isDark && styles.amountLabelDark]}>
                                        Remaining
                                    </Text>
                                    <Text style={[styles.amountValue, { color: remainingAmount > 0 ? '#f59e0b' : '#10b981' }]}>
                                        Rs. {remainingAmount.toLocaleString('en-IN')}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Status Selection */}
                        <View style={[styles.section, isDark && styles.sectionDark]}>
                            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                                Payment Status
                            </Text>
                            <View style={styles.statusButtonsContainer}>
                                {(['unpaid', 'partial', 'paid'] as const).map((s) => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[
                                            styles.statusButton,
                                            isDark && styles.statusButtonDark,
                                            status === s && [styles.statusButtonActive, getStatusColor(s, true)],
                                        ]}
                                        onPress={() => handleStatusChange(s)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name={s === 'paid' ? 'checkmark-circle' : s === 'partial' ? 'ellipse-outline' : 'close-circle'}
                                            size={20}
                                            color={status === s ? 'white' : isDark ? '#9ca3af' : '#6b7280'}
                                        />
                                        <Text style={[
                                            styles.statusButtonText,
                                            isDark && styles.statusButtonTextDark,
                                            status === s && styles.statusButtonTextActive,
                                        ]}>
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Paid Amount Input */}
                        {status === 'partial' && (
                            <View style={[styles.section, isDark && styles.sectionDark]}>
                                <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                                    Enter Paid Amount
                                </Text>
                                <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
                                    <Text style={[styles.currencySymbol, isDark && styles.currencySymbolDark]}>
                                        Rs.
                                    </Text>
                                    <TextInput
                                        style={[styles.amountInput, isDark && styles.amountInputDark]}
                                        placeholder="0"
                                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                                        keyboardType="decimal-pad"
                                        value={paidAmount}
                                        onChangeText={setPaidAmount}
                                        editable={!isLoading}
                                    />
                                </View>
                                <Text style={[styles.helperText, isDark && styles.helperTextDark]}>
                                    Max: Rs. {totalAmount.toLocaleString('en-IN')}
                                </Text>
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View style={[styles.section, isDark && styles.sectionDark]}>
                            <TouchableOpacity
                                style={[styles.saveButton, isLoading && styles.buttonDisabled]}
                                onPress={handleSave}
                                disabled={isLoading}
                                activeOpacity={0.7}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark" size={20} color="white" />
                                        <Text style={styles.saveButtonText}>Save Changes</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.deleteButton, isLoading && styles.buttonDisabled]}
                                onPress={handleDelete}
                                disabled={isLoading}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trash" size={20} color="white" />
                                <Text style={styles.deleteButtonText}>Delete Invoice</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

function getStatusColor(status: 'paid' | 'unpaid' | 'partial', isActive: boolean) {
    if (!isActive) return {};
    switch (status) {
        case 'paid':
            return { backgroundColor: '#10b981' };
        case 'partial':
            return { backgroundColor: '#f59e0b' };
        case 'unpaid':
            return { backgroundColor: '#dc2626' };
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    containerDark: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    backdrop: {
        flex: 1,
    },
    bottomSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    bottomSheetDark: {
        backgroundColor: '#1e293b',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerDark: {
        borderBottomColor: '#334155',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    headerTitleDark: {
        color: 'white',
    },
    closeButton: {
        padding: 8,
    },
    content: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    section: {
        marginBottom: 20,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
    },
    sectionDark: {
        backgroundColor: '#0f172a',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 12,
    },
    sectionTitleDark: {
        color: 'white',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    label: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    labelDark: {
        color: '#9ca3af',
    },
    value: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1e293b',
    },
    valueDark: {
        color: 'white',
    },
    amountCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    amountCardDark: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
    },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    amountLabel: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    amountLabelDark: {
        color: '#9ca3af',
    },
    amountValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 8,
    },
    dividerDark: {
        backgroundColor: '#334155',
    },
    statusButtonsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    statusButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    statusButtonDark: {
        backgroundColor: '#0f172a',
    },
    statusButtonActive: {
        borderColor: 'transparent',
    },
    statusButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
    },
    statusButtonTextDark: {
        color: '#9ca3af',
    },
    statusButtonTextActive: {
        color: 'white',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    inputContainerDark: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
    },
    currencySymbol: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
        marginRight: 4,
    },
    currencySymbolDark: {
        color: '#9ca3af',
    },
    amountInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    amountInputDark: {
        color: 'white',
    },
    helperText: {
        fontSize: 12,
        color: '#64748b',
        fontStyle: 'italic',
    },
    helperTextDark: {
        color: '#9ca3af',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#10b981',
        borderRadius: 8,
        paddingVertical: 12,
        marginBottom: 8,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'white',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#dc2626',
        borderRadius: 8,
        paddingVertical: 12,
    },
    deleteButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'white',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});
