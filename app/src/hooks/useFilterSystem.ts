import { useState, useMemo } from 'react';
import { FilterOption } from '../components/FilterBottomSheet';

export interface FilterConfig {
  screenType: 'invoices' | 'payments' | 'stock' | 'farmers' | 'charges' | 'purchases';
  filterOptions: FilterOption[];
}

export const useFilterSystem = (data: any[], filterConfig: FilterConfig) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});

  // Calculate active filters count
  const getActiveFiltersCount = () => {
    // If selectedFilters is empty object, return 0
    if (Object.keys(selectedFilters).length === 0) {
      // Removed console.log to prevent spam
      return 0;
    }
    
    let count = 0;
    console.log('Calculating active filters count. selectedFilters:', selectedFilters);
    Object.entries(selectedFilters).forEach(([key, value]) => {
      console.log(`Filter ${key}:`, value, 'Type:', typeof value, 'IsArray:', Array.isArray(value));
      if (Array.isArray(value) && value.length > 0) {
        count++;
        console.log(`Filter ${key} is active (array with ${value.length} items)`);
      }
      else if (typeof value === 'string' && value !== '') {
        count++;
        console.log(`Filter ${key} is active (non-empty string: "${value}")`);
      }
    });
    console.log('Total active filters count:', count);
    return count;
  };

  // Clear all filters
  const clearAllFilters = () => {
    console.log('clearAllFilters called');
    const clearedFilters: Record<string, any> = {};
    filterConfig.filterOptions.forEach(option => {
      clearedFilters[option.key] = option.type === 'multi-select' ? [] : '';
    });
    console.log('Setting cleared filters:', clearedFilters);
    setSelectedFilters(clearedFilters);
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: any) => {
    setSelectedFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      const matchesSearch = getSearchMatch(item, searchQuery, filterConfig.screenType);
      
      // Apply all filters
      const matchesFilters = Object.entries(selectedFilters).every(([key, value]) => {
        if (Array.isArray(value) && value.length === 0) return true;
        if (typeof value === 'string' && value === '') return true;
        
        return applyFilter(item, key, value, filterConfig.screenType);
      });

      return matchesSearch && matchesFilters;
    });
  }, [data, searchQuery, selectedFilters, filterConfig.screenType]);

  return {
    searchQuery,
    setSearchQuery,
    isFilterModalOpen,
    setIsFilterModalOpen,
    selectedFilters,
    handleFilterChange,
    clearAllFilters,
    getActiveFiltersCount,
    filteredData,
  };
};

// Helper function to match search query based on screen type
const getSearchMatch = (item: any, searchQuery: string, screenType: string): boolean => {
  if (!searchQuery) return true;
  
  const query = searchQuery.toLowerCase();
  
  switch (screenType) {
    case 'invoices':
      return (
        item.invoiceNumber?.toLowerCase().includes(query) ||
        item.customerName?.toLowerCase().includes(query)
      );
    case 'payments':
      return (
        item.name?.toLowerCase().includes(query) ||
        item.invoice?.toLowerCase().includes(query)
      );
    case 'stock':
      return item.crop?.toLowerCase().includes(query);
    case 'farmers':
      return (
        item.name?.toLowerCase().includes(query) ||
        item.phone?.toLowerCase().includes(query)
      );
    case 'charges':
      return item.name?.toLowerCase().includes(query);
    default:
      return true;
  }
};

// Helper function to apply individual filters based on screen type
const applyFilter = (item: any, key: string, value: any, screenType: string): boolean => {
  switch (screenType) {
    case 'invoices':
      return applyInvoiceFilter(item, key, value);
    case 'payments':
      return applyPaymentFilter(item, key, value);
    case 'stock':
      return applyStockFilter(item, key, value);
    case 'farmers':
      return applyFarmerFilter(item, key, value);
    case 'charges':
      return applyChargeFilter(item, key, value);
    default:
      return true;
  }
};

// Screen-specific filter functions
const applyInvoiceFilter = (item: any, key: string, value: any): boolean => {
  switch (key) {
    case 'status':
      return Array.isArray(value) ? value.includes(item.status) : item.status === value;
    case 'transactionType':
      return Array.isArray(value) ? value.includes(item.transactionType) : item.transactionType === value;
    case 'dateRange':
      return applyDateRangeFilter(item.createdDate, value);
    case 'amountRange':
      return applyAmountRangeFilter(item.grandTotal, value, [10000, 50000]);
    default:
      return true;
  }
};

const applyPaymentFilter = (item: any, key: string, value: any): boolean => {
  switch (key) {
    case 'status':
      return Array.isArray(value) ? value.includes(item.status) : item.status === value;
    case 'type':
      return Array.isArray(value) ? value.includes(item.type) : item.type === value;
    case 'method':
      return Array.isArray(value) ? value.includes(item.method?.toLowerCase()) : item.method?.toLowerCase() === value;
    case 'dateRange':
      return applyDateRangeFilter(item.date, value);
    case 'amountRange':
      const amount = parseFloat(item.amount?.replace(/[^\d.-]/g, '') || '0');
      return applyAmountRangeFilter(amount, value, [5000, 25000]);
    default:
      return true;
  }
};

const applyStockFilter = (item: any, key: string, value: any): boolean => {
  switch (key) {
    case 'categories':
      return Array.isArray(value) ? value.includes(item.category) : item.category === value;
    case 'locations':
      return Array.isArray(value) ? value.includes(item.location) : item.location === value;
    case 'bagType':
      if (!Array.isArray(value) || value.length === 0) return true;
      return value.some(type => {
        if (type === '60kg') return item.bags60kg?.quantity > 0;
        if (type === '40kg') return item.bags40kg?.quantity > 0;
        return false;
      });
    case 'quantityRange':
      const totalQuantity = (item.bags60kg?.quantity || 0) + (item.bags40kg?.quantity || 0);
      return applyAmountRangeFilter(totalQuantity, value, [50, 200]);
    case 'rateRange':
      const avgRate = ((item.bags60kg?.rate || 0) + (item.bags40kg?.rate || 0)) / 2;
      return applyAmountRangeFilter(avgRate, value, [2000, 5000]);
    default:
      return true;
  }
};

const applyFarmerFilter = (item: any, key: string, value: any): boolean => {
  console.log('Applying farmer filter:', { key, value, itemPartnerType: item.partner_type, itemStatus: item.status });
  
  switch (key) {
    case 'partner_type':
      const partnerTypeMatch = Array.isArray(value) ? value.includes(item.partner_type) : item.partner_type === value;
      console.log('Partner type filter result:', partnerTypeMatch);
      return partnerTypeMatch;
    case 'status':
      const statusMatch = Array.isArray(value) ? value.includes(item.status) : item.status === value;
      console.log('Status filter result:', statusMatch);
      return statusMatch;
    default:
      return true;
  }
};

const applyChargeFilter = (item: any, key: string, value: any): boolean => {
  switch (key) {
    case 'type':
      return Array.isArray(value) ? value.includes(item.type) : item.type === value;
    case 'amountRange':
      return applyAmountRangeFilter(item.amount, value, [500, 2000]);
    default:
      return true;
  }
};

// Helper functions
const applyDateRangeFilter = (dateString: string, range: string): boolean => {
  if (!range) return true;
  
  const itemDate = new Date(dateString);
  const now = new Date();
  
  switch (range) {
    case 'today':
      return itemDate.toDateString() === now.toDateString();
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= weekAgo;
    case 'month':
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return itemDate >= monthAgo;
    default:
      return true;
  }
};

const applyAmountRangeFilter = (amount: number, range: string, thresholds: [number, number]): boolean => {
  if (!range) return true;
  
  const [low, high] = thresholds;
  
  switch (range) {
    case 'low':
      return amount < low;
    case 'medium':
      return amount >= low && amount < high;
    case 'high':
      return amount >= high;
    default:
      return true;
  }
};
