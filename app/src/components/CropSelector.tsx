import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CropWithVariants, BagVariant } from '../database/cropTypes';

interface CropSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectCrop: (crop: CropWithVariants, bagVariant: BagVariant) => void;
  crops: CropWithVariants[];
  onCreateCrop: (cropName: string) => void;
}

const CropSelector: React.FC<CropSelectorProps> = ({
  visible,
  onClose,
  onSelectCrop,
  crops,
  onCreateCrop,
}) => {
  const [searchText, setSearchText] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCropName, setNewCropName] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<CropWithVariants | null>(null);

  const filteredCrops = crops.filter(crop =>
    crop.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleCreateCrop = () => {
    if (newCropName.trim()) {
      onCreateCrop(newCropName.trim());
      setNewCropName('');
      setShowCreateForm(false);
    } else {
      Alert.alert('Invalid Input', 'Please enter a crop name');
    }
  };

  const handleCropSelect = (crop: CropWithVariants) => {
    if (crop.bagVariants.length === 0) {
      Alert.alert('No Bag Variants', 'This crop has no bag variants configured. Please add bag variants first.');
      return;
    }
    setSelectedCrop(crop);
  };

  const handleBagVariantSelect = (bagVariant: BagVariant) => {
    if (selectedCrop) {
      onSelectCrop(selectedCrop, bagVariant);
      setSelectedCrop(null);
      onClose();
    }
  };

  const resetState = () => {
    setSearchText('');
    setShowCreateForm(false);
    setNewCropName('');
    setSelectedCrop(null);
  };

  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {selectedCrop ? 'Select Bag Size' : 'Select Crop'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {selectedCrop ? (
            // Bag Variant Selection
            <View style={styles.content}>
              <View style={styles.cropInfo}>
                <Ionicons name="leaf" size={24} color="#10b981" />
                <Text style={styles.cropName}>{selectedCrop.name}</Text>
              </View>
              
              <ScrollView style={styles.bagVariantsList}>
                {selectedCrop.bagVariants.map((variant) => (
                  <TouchableOpacity
                    key={variant.id}
                    style={styles.bagVariantItem}
                    onPress={() => handleBagVariantSelect(variant)}
                  >
                    <View style={styles.bagVariantInfo}>
                      <Text style={styles.bagWeight}>{variant.weight_kg} kg bag</Text>
                      <Text style={styles.bagPrice}>
                        {variant.price_per_bag.toLocaleString('en-IN')} per bag
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setSelectedCrop(null)}
              >
                <Ionicons name="arrow-back" size={20} color="#2563eb" />
                <Text style={styles.backButtonText}>Back to Crops</Text>
              </TouchableOpacity>
            </View>
          ) : showCreateForm ? (
            // Create New Crop Form
            <View style={styles.content}>
              <View style={styles.createForm}>
                <Text style={styles.createTitle}>Create New Crop</Text>
                <TextInput
                  style={styles.createInput}
                  value={newCropName}
                  onChangeText={setNewCropName}
                  placeholder="Enter crop name (e.g., Wheat, Rice)"
                  placeholderTextColor="#94a3b8"
                  autoFocus
                />
                <View style={styles.createButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowCreateForm(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreateCrop}
                  >
                    <Text style={styles.createButtonText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            // Crop Selection
            <View style={styles.content}>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Search crops..."
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Create New Crop Button */}
              <TouchableOpacity
                style={styles.createNewButton}
                onPress={() => setShowCreateForm(true)}
              >
                <Ionicons name="add-circle" size={20} color="#10b981" />
                <Text style={styles.createNewButtonText}>Create New Crop</Text>
              </TouchableOpacity>

              {/* Crops List */}
              <ScrollView style={styles.cropsList}>
                {filteredCrops.length > 0 ? (
                  filteredCrops.map((crop) => (
                    <TouchableOpacity
                      key={crop.id}
                      style={styles.cropItem}
                      onPress={() => handleCropSelect(crop)}
                    >
                      <View style={styles.cropItemContent}>
                        <Ionicons name="leaf" size={20} color="#10b981" />
                        <View style={styles.cropItemInfo}>
                          <Text style={styles.cropItemName}>{crop.name}</Text>
                          <Text style={styles.cropItemVariants}>
                            {crop.bagVariants.length} bag variant{crop.bagVariants.length !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="leaf-outline" size={48} color="#cbd5e1" />
                    <Text style={styles.emptyStateText}>
                      {searchText ? 'No crops found' : 'No crops available'}
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      {searchText ? 'Try a different search term' : 'Create your first crop to get started'}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  
  // Create New Button
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  createNewButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#10b981',
  },
  
  // Crops List
  cropsList: {
    flex: 1,
  },
  cropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
  },
  cropItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cropItemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  cropItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  cropItemVariants: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  
  // Bag Variants
  cropInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cropName: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  bagVariantsList: {
    flex: 1,
  },
  bagVariantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
  },
  bagVariantInfo: {
    flex: 1,
  },
  bagWeight: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  bagPrice: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#2563eb',
  },
  
  // Create Form
  createForm: {
    flex: 1,
  },
  createTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  createInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 20,
  },
  createButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default CropSelector;
