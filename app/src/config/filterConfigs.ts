import { FilterOption } from '../components/FilterBottomSheet';
import { FilterConfig } from '../hooks/useFilterSystem';

export const getFilterConfig = (screenType: 'invoices' | 'payments' | 'stock' | 'farmers' | 'charges' | 'purchases'): FilterConfig => {
  const configs: Record<string, FilterConfig> = {
    invoices: {
      screenType: 'invoices',
      filterOptions: [
        {
          key: 'status',
          label: 'Status',
          type: 'multi-select',
          options: [
            { value: 'paid', label: 'Paid' },
            { value: 'unpaid', label: 'Unpaid' },
            { value: 'partial', label: 'Partial' },
          ],
        },
        {
          key: 'transactionType',
          label: 'Transaction Type',
          type: 'multi-select',
          options: [
            { value: 'stock_buy', label: 'Stock Purchase' },
            { value: 'stock_sell', label: 'Stock Sale' },
            { value: 'payment_received', label: 'Payment Received' },
            { value: 'payment_sent', label: 'Payment Sent' },
          ],
        },
        {
          key: 'dateRange',
          label: 'Date Range',
          type: 'single-select',
          options: [
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
          ],
        },
        {
          key: 'amountRange',
          label: 'Amount Range',
          type: 'single-select',
          options: [
            { value: 'low', label: 'Under Rs 10,000' },
            { value: 'medium', label: 'Rs 10,000 - Rs 50,000' },
            { value: 'high', label: 'Above Rs 50,000' },
          ],
        },
      ],
    },
    payments: {
      screenType: 'payments',
      filterOptions: [
        {
          key: 'status',
          label: 'Status',
          type: 'multi-select',
          options: [
            { value: 'completed', label: 'Completed' },
            { value: 'pending', label: 'Pending' },
          ],
        },
        {
          key: 'type',
          label: 'Payment Type',
          type: 'multi-select',
          options: [
            { value: 'incoming', label: 'Incoming' },
            { value: 'outgoing', label: 'Outgoing' },
          ],
        },
        {
          key: 'method',
          label: 'Payment Method',
          type: 'multi-select',
          options: [
            { value: 'cash', label: 'Cash' },
            { value: 'bank_transfer', label: 'Bank Transfer' },
            { value: 'mobile_money', label: 'Mobile Money' },
            { value: 'cheque', label: 'Cheque' },
          ],
        },
        {
          key: 'dateRange',
          label: 'Date Range',
          type: 'single-select',
          options: [
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
          ],
        },
        {
          key: 'amountRange',
          label: 'Amount Range',
          type: 'single-select',
          options: [
            { value: 'low', label: 'Under Rs 5,000' },
            { value: 'medium', label: 'Rs 5,000 - Rs 25,000' },
            { value: 'high', label: 'Above Rs 25,000' },
          ],
        },
      ],
    },
    stock: {
      screenType: 'stock',
      filterOptions: [
        {
          key: 'categories',
          label: 'Category',
          type: 'multi-select',
          options: [
            { value: 'Grains', label: 'Grains' },
            { value: 'Seeds', label: 'Seeds' },
            { value: 'Fertilizer', label: 'Fertilizer' },
            { value: 'Tools', label: 'Tools' },
            { value: 'Equipment', label: 'Equipment' },
          ],
        },
        {
          key: 'locations',
          label: 'Location',
          type: 'multi-select',
          options: [
            { value: 'Warehouse A', label: 'Warehouse A' },
            { value: 'Warehouse B', label: 'Warehouse B' },
            { value: 'Storage 1', label: 'Storage 1' },
            { value: 'Storage 2', label: 'Storage 2' },
            { value: 'Field Store', label: 'Field Store' },
          ],
        },
        {
          key: 'bagType',
          label: 'Bag Type',
          type: 'multi-select',
          options: [
            { value: '60kg', label: '60kg' },
            { value: '40kg', label: '40kg' },
          ],
        },
        {
          key: 'quantityRange',
          label: 'Quantity Range',
          type: 'single-select',
          options: [
            { value: 'low', label: 'Under 50 Bags' },
            { value: 'medium', label: '50-200 Bags' },
            { value: 'high', label: 'Above 200 Bags' },
          ],
        },
        {
          key: 'rateRange',
          label: 'Rate Range',
          type: 'single-select',
          options: [
            { value: 'low', label: 'Under Rs 2,000/bag' },
            { value: 'medium', label: 'Rs 2,000-5,000/bag' },
            { value: 'high', label: 'Above Rs 5,000/bag' },
          ],
        },
      ],
    },
    farmers: {
      screenType: 'farmers',
      filterOptions: [
        {
          key: 'partner_type',
          label: 'Partner Type',
          type: 'multi-select',
          options: [
            { value: 'farmer', label: 'Farmer' },
            { value: 'buyer', label: 'Buyer' },
          ],
        },
        {
          key: 'status',
          label: 'Status',
          type: 'multi-select',
          options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'pending', label: 'Pending' },
          ],
        },
      ],
    },
    charges: {
      screenType: 'charges',
      filterOptions: [
        {
          key: 'type',
          label: 'Type',
          type: 'multi-select',
          options: [
            { value: 'fixed', label: 'Fixed' },
            { value: 'percentage', label: 'Percentage' },
          ],
        },
        {
          key: 'amountRange',
          label: 'Amount Range',
          type: 'single-select',
          options: [
            { value: 'low', label: 'Under Rs 500' },
            { value: 'medium', label: 'Rs 500 - Rs 2,000' },
            { value: 'high', label: 'Above Rs 2,000' },
          ],
        },
      ],
    },

    purchases: {
      screenType: 'purchases',
      filterOptions: [
        {
          key: 'crop',
          label: 'Crop Type',
          type: 'multi-select',
          options: [
            { value: 'wheat', label: 'Wheat' },
            { value: 'rice', label: 'Rice' },
            { value: 'corn', label: 'Corn' },
            { value: 'cotton', label: 'Cotton' },
            { value: 'sugarcane', label: 'Sugarcane' },
          ],
        },
        {
          key: 'dateRange',
          label: 'Date Range',
          type: 'single-select',
          options: [
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'quarter', label: 'This Quarter' },
          ],
        },
        {
          key: 'amountRange',
          label: 'Amount Range',
          type: 'single-select',
          options: [
            { value: 'low', label: 'Under Rs 10,000' },
            { value: 'medium', label: 'Rs 10,000 - Rs 50,000' },
            { value: 'high', label: 'Above Rs 50,000' },
          ],
        },
        {
          key: 'quantityRange',
          label: 'Quantity Range',
          type: 'single-select',
          options: [
            { value: 'small', label: 'Under 100 kg' },
            { value: 'medium', label: '100 - 500 kg' },
            { value: 'large', label: 'Above 500 kg' },
          ],
        },
      ],
    },
  };

  return configs[screenType];
};
