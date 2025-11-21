import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface FilterOption {
  key: string;
  label: string;
  type: 'multi-select' | 'single-select';
  options: Array<{ value: string; label: string }>;
}

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  filterOptions: FilterOption[];
  selectedFilters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onClearAll: () => void;
  resultCount: number;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  title,
  filterOptions,
  selectedFilters,
  onFilterChange,
  onClearAll,
  resultCount,
}) => {
  const handleMultiSelectChange = (key: string, value: string) => {
    const currentValues = selectedFilters[key] || [];
    if (currentValues.includes(value)) {
      onFilterChange(key, currentValues.filter((v: string) => v !== value));
    } else {
      onFilterChange(key, [...currentValues, value]);
    }
  };

  const handleSingleSelectChange = (key: string, value: string) => {
    const currentValue = selectedFilters[key];
    onFilterChange(key, currentValue === value ? '' : value);
  };

  const renderFilterSection = (filterOption: FilterOption) => {
    const isMultiSelect = filterOption.type === 'multi-select';
    const selectedValues = selectedFilters[filterOption.key] || (isMultiSelect ? [] : '');

    return (
      <View key={filterOption.key} style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>{filterOption.label}</Text>
        <View style={isMultiSelect && filterOption.options.length <= 3 ? styles.filterOptionsRow : styles.filterOptionsColumn}>
          {filterOption.options.map((option) => {
            const isSelected = isMultiSelect 
              ? selectedValues.includes(option.value)
              : selectedValues === option.value;

            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  isMultiSelect && filterOption.options.length <= 3 ? styles.filterOption : styles.filterOptionFull,
                  isSelected && styles.filterOptionSelected,
                ]}
                onPress={() => {
                  if (isMultiSelect) {
                    handleMultiSelectChange(filterOption.key, option.value);
                  } else {
                    handleSingleSelectChange(filterOption.key, option.value);
                  }
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  isSelected && styles.filterOptionTextSelected,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <View style={styles.bottomSheetOverlay}>
        <TouchableOpacity 
          style={styles.bottomSheetBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.bottomSheetContainer}>
          {/* Handle Indicator */}
          <View style={styles.bottomSheetHandle} />
          
          {/* Header */}
          <View style={styles.bottomSheetHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.bottomSheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClearAll}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bottomSheetContent} showsVerticalScrollIndicator={false}>
            {filterOptions.map(renderFilterSection)}
          </ScrollView>

          {/* Apply Button */}
          <View style={styles.filterFooter}>
            <TouchableOpacity
              style={styles.applyFilterButton}
              onPress={onClose}
            >
              <Text style={styles.applyFilterButtonText}>
                Apply Filters ({resultCount} results)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheetBackdrop: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
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
    padding: 20,
  },
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
