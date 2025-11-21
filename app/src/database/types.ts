// Enhanced type definitions for SQLite database

export interface SyncStatus {
  lastSync: Date | null;
  pendingChanges: number;
  isOnline: boolean;
  isSyncing: boolean;
  errors: string[];
}

export interface Partner {
  id: number;
  name: string;
  phone: string;
  village?: string;
  address: string;
  role: string; // Custom roles: farmer, buyer, customer, supplier, broker, etc.
  sync_status?: string;
  cloud_id?: string;
  created_at: string;
  updated_at: string;
}

// Keep Farmer interface for backward compatibility (deprecated)
export interface Farmer extends Partner { }

export interface Purchase {
  id: number;
  farmer_id: number; // Keep for backward compatibility
  partner_id: number; // New field
  crop_name: string;
  quantity: number; // Total weight in kg
  bag_quantity?: number; // Number of bags
  weight_per_bag?: number; // Weight per bag in kg
  bag_variant_id?: number; // Reference to bag variant
  rate: number; // Rate per bag
  total_amount: number;
  purchase_date: string;
  transaction_type?: string; // 'stock_buy', 'stock_sell', or 'mixed'
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: number;
  farmer_id: number; // Keep for backward compatibility
  partner_id: number; // New field
  total_amount: number;
  status: 'pending' | 'paid' | 'partial';
  transaction_type?: string; // 'stock_buy', 'stock_sell', or 'mixed'
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  purchase_id: number;
  created_at: string;
}

export interface Stock {
  id: number;
  crop_name: string;
  quantity: number;
  buy_rate: number;
  sell_rate: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'bank' | 'cheque';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Charge {
  id: number;
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Database operation result types
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DatabaseStats {
  totalPartners: number;
  totalFarmers: number; // Keep for backward compatibility
  totalPurchases: number;
  totalInvoices: number;
  pendingPayments: number;
  totalSales: number;
  totalStock: number;
}

// Migration types
export interface Migration {
  version: number;
  name: string;
  sql: string;
  rollback?: string;
}

export interface DatabaseInfo {
  version: number;
  isEncrypted: boolean;
  lastBackup?: string;
  recordCount: {
    partners: number;
    farmers: number; // Keep for backward compatibility
    purchases: number;
    invoices: number;
    stock: number;
    payments: number;
    charges: number;
  };
}

// Input types for database operations
export type PartnerInput = Omit<Partner, 'id' | 'created_at' | 'updated_at' | 'sync_status' | 'cloud_id'>;
export type FarmerInput = PartnerInput; // Keep for backward compatibility
export type PurchaseInput = Omit<Purchase, 'id' | 'created_at' | 'updated_at'>;
export type InvoiceInput = Omit<Invoice, 'id' | 'created_at' | 'updated_at'>;
export type StockInput = Omit<Stock, 'id' | 'created_at' | 'updated_at'>;
export type PaymentInput = Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
export type ChargeInput = Omit<Charge, 'id' | 'created_at' | 'updated_at'>;
export type CategoryInput = Omit<Category, 'id' | 'created_at' | 'updated_at'>;

// Search and filter types
export interface SearchOptions {
  query?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PartnerSearchOptions extends SearchOptions {
  hasPhone?: boolean;
  hasAddress?: boolean;
  role?: string;
}

// Keep for backward compatibility
export interface FarmerSearchOptions extends PartnerSearchOptions { }

export interface PurchaseSearchOptions extends SearchOptions {
  partnerId?: number;
  farmerId?: number; // Keep for backward compatibility
  cropName?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface InvoiceSearchOptions extends SearchOptions {
  partnerId?: number;
  farmerId?: number; // Keep for backward compatibility
  status?: Invoice['status'];
  dateFrom?: string;
  dateTo?: string;
}
