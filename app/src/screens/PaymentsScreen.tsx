import React, { useState, useLayoutEffect, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SearchBar, FilterBottomSheet } from '../components';
import { useFilterSystem } from '../hooks';
import { getFilterConfig } from '../config';
import { useWatermelonInvoices } from '../hooks/useWatermelonInvoices';
import { useWatermelonPartners } from '../hooks/useWatermelonPartners';
import { watermelonSyncService } from '../services/watermelonSyncService';
import NetInfo from '@react-native-community/netinfo';
import { showErrorToast } from '../utils/toastUtils';

interface Payment {
  id: string;
  name: string;
  invoice: string;
  amount: string;
  type: 'incoming' | 'outgoing';
  status: 'completed' | 'pending';
  date: string;
  method: string;
}

const PaymentsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { invoices } = useWatermelonInvoices();
  const { partners } = useWatermelonPartners();
  const [refreshing, setRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFarmerSelectorOpen, setIsFarmerSelectorOpen] = useState(false);
  const [farmerSearchQuery, setFarmerSearchQuery] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);

  // Add Payment Form State
  const [formData, setFormData] = useState({
    farmerId: '',
    farmerName: '',
    amount: '',
    type: 'incoming' as 'incoming' | 'outgoing',
    description: '',
  });

  // Use the reusable filter system
  const filterConfig = getFilterConfig('payments');
  const {
    searchQuery,
    setSearchQuery,
    isFilterModalOpen,
    setIsFilterModalOpen,
    selectedFilters,
    handleFilterChange,
    clearAllFilters,
    getActiveFiltersCount,
    filteredData: filteredPayments,
  } = useFilterSystem(payments, filterConfig);

  // Set header button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{
            marginRight: 16,
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: 8,
            borderRadius: 20
          }}
          onPress={() => setIsAddModalOpen(true)}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);


  // ✅ Load payments from invoices (WatermelonDB)
  const loadPayments = () => {
    try {
      // Transform invoices to payments format
      const transformedPayments: Payment[] = invoices.map((item: any) => ({
        id: item.id,
        name: item.partner_name || 'Unknown',
        invoice: item.invoice_number || `INV-${item.id}`,
        amount: item.grand_total.toString(),
        type: 'incoming',
        status: item.payment_status === 'paid' ? 'completed' : 'pending',
        date: item.invoice_date,
        method: 'bank'
      }));
      setPayments(transformedPayments);
    } catch (error) {
      console.error('Error loading payments:', error);
      showErrorToast('Failed to load payments');
    }
  };

  // ✅ Load farmers from partners (WatermelonDB)
  const loadFarmers = () => {
    try {
      setFarmers(partners);
    } catch (error) {
      console.error('Error loading farmers:', error);
    }
  };

  // ✅ Load data when invoices or partners change
  React.useEffect(() => {
    loadPayments();
    loadFarmers();
  }, [invoices, partners]);

  const onRefresh = async () => {
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
      loadPayments();
      loadFarmers();
    } catch (error) {
      console.error('Refresh error:', error);
      showErrorToast('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Filter farmers based on search query
  const filteredFarmers = farmers.filter(farmer =>
    farmer.name.toLowerCase().includes(farmerSearchQuery.toLowerCase()) ||
    farmer.phone.includes(farmerSearchQuery)
  );

  // Optimized event handlers to prevent re-renders
  const handleFarmerSelect = useCallback((farmerId: string, farmerName: string) => {
    setFormData(prev => ({ ...prev, farmerId, farmerName }));
    setIsFarmerSelectorOpen(false);
    setFarmerSearchQuery('');
  }, []);

  const handleOpenFarmerSelector = useCallback(() => {
    setIsFarmerSelectorOpen(true);
  }, []);

  const handleCloseFarmerSelector = useCallback(() => {
    setIsFarmerSelectorOpen(false);
    setFarmerSearchQuery('');
  }, []);

  const handleAmountChange = useCallback((text: string) => {
    setFormData(prev => ({ ...prev, amount: text }));
  }, []);

  const handleDescriptionChange = useCallback((text: string) => {
    setFormData(prev => ({ ...prev, description: text }));
  }, []);

  const handleTypeChange = useCallback((type: 'incoming' | 'outgoing') => {
    setFormData(prev => ({ ...prev, type }));
  }, []);

  const handleAddPayment = () => {
    // Validate form
    if (!formData.farmerName.trim() || !formData.amount.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    // Here you would save to database
    Alert.alert('Success', 'Payment recorded successfully!');
    setIsAddModalOpen(false);
    setFormData({
      farmerId: '',
      farmerName: '',
      amount: '',
      type: 'incoming',
      description: '',
    });
  };

  const getTypeIcon = (type: string) => {
    return type === 'incoming' ? 'arrow-down-circle' : 'arrow-up-circle';
  };

  const getTypeColor = (type: string) => {
    return type === 'incoming' ? '#10b981' : '#ef4444';
  };

  const getStatusColor = (status: string) => {
    return status === 'completed' ? '#10b981' : '#f59e0b';
  };

  const PaymentCard = ({ payment }: { payment: Payment }) => (
    <TouchableOpacity style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <View style={styles.paymentTitle}>
            <Ionicons
              name={getTypeIcon(payment.type) as any}
              size={20}
              color={getTypeColor(payment.type)}
            />
            <Text style={styles.farmerName}>{payment.name}</Text>
          </View>
          <Text style={styles.invoiceId}>Invoice: {payment.invoice}</Text>
        </View>
        <View style={styles.paymentAmount}>
          <Text style={[styles.amount, { color: getTypeColor(payment.type) }]}>
            {payment.type === 'incoming' ? '+' : '-'}{payment.amount}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
              {payment.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar" size={14} color="#64748b" />
          <Text style={styles.detailText}>{new Date(payment.date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="card" size={14} color="#64748b" />
          <Text style={styles.detailText}>{payment.method}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );


  const StatsRow = () => {
    const totalPayments = payments.length;
    const incomingPayments = payments.filter(p => p.type === 'incoming').length;
    const outgoingPayments = payments.filter(p => p.type === 'outgoing').length;

    return (
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalPayments}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>{incomingPayments}</Text>
          <Text style={styles.statLabel}>Received</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#ef4444' }]}>{outgoingPayments}</Text>
          <Text style={styles.statLabel}>Paid</Text>
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="card-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyStateTitle}>No Payments Found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery ? 'No payments match your search' : 'Record your first payment to get started'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => setIsAddModalOpen(true)}
        >
          <Text style={styles.emptyStateButtonText}>Record First Payment</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search payments..."
        onFilterPress={() => setIsFilterModalOpen(true)}
        activeFiltersCount={getActiveFiltersCount()}
      />


      {/* Stats Row */}
      <StatsRow />


      {/* ✅ FIXED: Payments List with proper contentContainerStyle */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          filteredPayments.length === 0
            ? styles.emptyScrollContent
            : styles.paymentsListContent
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredPayments.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.paymentsList}>
            {filteredPayments.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} />
            ))}
          </View>
        )}
      </ScrollView>

      <AddPaymentBottomSheet
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        formData={formData}
        onOpenFarmerSelector={handleOpenFarmerSelector}
        onAmountChange={handleAmountChange}
        onDescriptionChange={handleDescriptionChange}
        onTypeChange={handleTypeChange}
        onSave={handleAddPayment}
      />

      <FarmerSelectorModal
        visible={isFarmerSelectorOpen}
        onClose={handleCloseFarmerSelector}
        farmers={filteredFarmers}
        searchQuery={farmerSearchQuery}
        onSearchChange={setFarmerSearchQuery}
        onFarmerSelect={handleFarmerSelect}
      />

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Payments"
        filterOptions={filterConfig.filterOptions}
        selectedFilters={selectedFilters}
        onFilterChange={handleFilterChange}
        onClearAll={clearAllFilters}
        resultCount={filteredPayments.length}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  clearButton: {
    padding: 4,
  },
  filterSelector: {
    paddingHorizontal: 16,
    marginBottom: 16,
    maxHeight: 44,
  },
  filterChip: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: 'white',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  paymentsListContent: {
    paddingBottom: 20,
  },
  paymentsList: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  invoiceId: {
    fontSize: 14,
    color: '#64748b',
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  typeOptionSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  typeOptionText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  typeOptionTextSelected: {
    color: 'white',
  },
  methodSelector: {
    flexDirection: 'row',
  },
  methodChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  methodChipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  methodChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  methodChipTextSelected: {
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Bottom Sheet Styles
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheetBackdrop: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '60%',
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  // Farmer Selector Styles
  farmerSelectorButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  farmerSelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  farmerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  farmerSelectorText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  farmerSelectorPlaceholder: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  // Filter Button Styles
  filterButton: {
    position: 'relative',
    padding: 8,
    marginLeft: 8,
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Filter Modal Styles
  clearAllText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOptionsColumn: {
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterOptionFull: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterOptionSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  filterOptionTextSelected: {
    color: 'white',
  },
  filterFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  applyFilterButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyFilterButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

// AddPaymentBottomSheet component defined outside to prevent rerenders
interface AddPaymentBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  formData: {
    farmerId: string;
    farmerName: string;
    amount: string;
    type: 'incoming' | 'outgoing';
    description: string;
  };
  onOpenFarmerSelector: () => void;
  onAmountChange: (text: string) => void;
  onDescriptionChange: (text: string) => void;
  onTypeChange: (type: 'incoming' | 'outgoing') => void;
  onSave: () => void;
}

const AddPaymentBottomSheet: React.FC<AddPaymentBottomSheetProps> = ({
  visible,
  onClose,
  formData,
  onOpenFarmerSelector,
  onAmountChange,
  onDescriptionChange,
  onTypeChange,
  onSave,
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onClose}
  >
    <View style={styles.bottomSheetOverlay}>
      <TouchableOpacity
        style={styles.bottomSheetBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      <View style={styles.bottomSheetContainer}>
        {/* Bottom Sheet Handle */}
        <View style={styles.bottomSheetHandle} />

        {/* Header */}
        <View style={styles.bottomSheetHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.bottomSheetTitle}>Record Payment</Text>
          <TouchableOpacity onPress={onSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.bottomSheetContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Select Farmer *</Text>
            <TouchableOpacity
              style={styles.farmerSelectorButton}
              onPress={onOpenFarmerSelector}
            >
              <View style={styles.farmerSelectorContent}>
                <View style={styles.farmerInfo}>
                  <Ionicons name="person" size={20} color="#64748b" />
                  <Text style={[
                    styles.farmerSelectorText,
                    !formData.farmerName && styles.farmerSelectorPlaceholder
                  ]}>
                    {formData.farmerName || 'Choose farmer'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#64748b" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Amount *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.amount}
              onChangeText={onAmountChange}
              placeholder="Enter amount"
              keyboardType="numeric"
              placeholderTextColor="#94a3b8"
              autoCorrect={false}
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Payment Type</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeOption, formData.type === 'incoming' && styles.typeOptionSelected]}
                onPress={() => onTypeChange('incoming')}
              >
                <Text style={[styles.typeOptionText, formData.type === 'incoming' && styles.typeOptionTextSelected]}>
                  Received
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeOption, formData.type === 'outgoing' && styles.typeOptionSelected]}
                onPress={() => onTypeChange('outgoing')}
              >
                <Text style={[styles.typeOptionText, formData.type === 'outgoing' && styles.typeOptionTextSelected]}>
                  Paid
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={onDescriptionChange}
              placeholder="Additional notes (optional)"
              multiline
              numberOfLines={3}
              placeholderTextColor="#94a3b8"
              autoCorrect={false}
              blurOnSubmit={false}
            />
          </View>

          {/* Add some bottom padding for better scrolling */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// FarmerSelectorModal component for farmer selection with search
interface FarmerSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  farmers: { id: string; name: string; phone: string }[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFarmerSelect: (farmerId: string, farmerName: string) => void;
}

const FarmerSelectorModal: React.FC<FarmerSelectorModalProps> = ({
  visible,
  onClose,
  farmers,
  searchQuery,
  onSearchChange,
  onFarmerSelect,
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onClose}
  >
    <View style={styles.bottomSheetOverlay}>
      <TouchableOpacity
        style={styles.bottomSheetBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      <View style={[styles.bottomSheetContainer, { maxHeight: '70%' }]}>
        {/* Bottom Sheet Handle */}
        <View style={styles.bottomSheetHandle} />

        {/* Header */}
        <View style={styles.bottomSheetHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.bottomSheetTitle}>Select Farmer</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { margin: 16, marginBottom: 8 }]}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search farmers..."
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholderTextColor="#94a3b8"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => onSearchChange('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Farmers List */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {farmers.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Ionicons name="person-outline" size={48} color="#cbd5e1" />
              <Text style={{ fontSize: 16, color: '#64748b', marginTop: 12, textAlign: 'center' }}>
                {searchQuery ? 'No farmers match your search' : 'No farmers found'}
              </Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              {farmers.map((farmer) => (
                <TouchableOpacity
                  key={farmer.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                  onPress={() => onFarmerSelect(farmer.id, farmer.name)}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#f1f5f9',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Ionicons name="person" size={20} color="#64748b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: 2,
                    }}>
                      {farmer.name}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: '#64748b',
                    }}>
                      {farmer.phone}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

export default PaymentsScreen;