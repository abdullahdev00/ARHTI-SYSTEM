import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useColorScheme, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { observer } from '@legendapp/state/react';
import { useWatermelonCharges } from '../hooks/useWatermelonCharges';

const PADDING = 16;
const SPACING = 16;

export const ChargesScreen: React.FC = observer(() => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { charges, createCharge, updateCharge, deleteCharge, isLoading } = useWatermelonCharges();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCharge, setEditingCharge] = useState<any>(null);
  const [chargeName, setChargeName] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');

  const handleAddCharge = async () => {
    if (!chargeName.trim() || !chargeAmount.trim()) {
      Alert.alert('Error', 'Please enter charge name and amount');
      return;
    }

    try {
      await createCharge(chargeName, parseFloat(chargeAmount));
      setChargeName('');
      setChargeAmount('');
      setShowAddModal(false);
      Alert.alert('Success', 'Charge added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add charge');
    }
  };

  const handleEditCharge = async () => {
    if (!chargeName.trim() || !chargeAmount.trim() || !editingCharge) {
      Alert.alert('Error', 'Please enter charge name and amount');
      return;
    }

    try {
      await updateCharge(editingCharge.id, chargeName, parseFloat(chargeAmount));
      setChargeName('');
      setChargeAmount('');
      setEditingCharge(null);
      Alert.alert('Success', 'Charge updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update charge');
    }
  };

  const handleDeleteCharge = (chargeId: string) => {
    Alert.alert(
      'Delete Charge',
      'Are you sure you want to delete this charge?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCharge(chargeId);
              Alert.alert('Success', 'Charge deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete charge');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (charge: any) => {
    setEditingCharge(charge);
    setChargeName(charge.name);
    setChargeAmount(charge.amount.toString());
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <FlatList
        data={charges}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.chargeCard, isDark && styles.chargeCardDark]}>
            <View style={styles.chargeInfo}>
              <Text style={[styles.chargeName, isDark && styles.chargeNameDark]}>{item.name}</Text>
              <Text style={[styles.chargeAmount, isDark && styles.chargeAmountDark]}>
                Rs. {item.amount.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.chargeActions}>
              <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
                <Ionicons name="create-outline" size={20} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteCharge(item.id)} style={styles.actionBtn}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="pricetag-outline" size={64} color={isDark ? '#4b5563' : '#cbd5e1'} />
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>No Charges</Text>
            <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
              Add charges to apply to transactions
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingCharge(null);
          setChargeName('');
          setChargeAmount('');
          setShowAddModal(true);
        }}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal || !!editingCharge} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
              {editingCharge ? 'Edit Charge' : 'Add Charge'}
            </Text>

            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="Charge Name"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={chargeName}
              onChangeText={setChargeName}
            />

            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="Amount"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={chargeAmount}
              onChangeText={setChargeAmount}
              keyboardType="decimal-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setShowAddModal(false);
                  setEditingCharge(null);
                  setChargeName('');
                  setChargeAmount('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={editingCharge ? handleEditCharge : handleAddCharge}
              >
                <Text style={styles.saveBtnText}>{editingCharge ? 'Update' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: '#1e293b' },
  chargeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: PADDING,
    marginHorizontal: PADDING,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chargeCardDark: { backgroundColor: '#0f172a' },
  chargeInfo: { flex: 1 },
  chargeName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  chargeNameDark: { color: 'white' },
  chargeAmount: { fontSize: 14, color: '#10b981', marginTop: 4 },
  chargeAmountDark: { color: '#34d399' },
  chargeActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 16 },
  emptyTextDark: { color: 'white' },
  emptySubtext: { fontSize: 14, color: '#64748b', marginTop: 8 },
  emptySubtextDark: { color: '#94a3b8' },
  fab: {
    position: 'absolute',
    right: PADDING,
    bottom: PADDING + 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalContentDark: { backgroundColor: '#0f172a' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 20 },
  modalTitleDark: { color: 'white' },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 12,
  },
  inputDark: { backgroundColor: '#1e293b', borderColor: '#334155', color: 'white' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { borderWidth: 1, borderColor: '#e2e8f0' },
  saveBtn: { backgroundColor: '#10b981' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: 'white' },
});
