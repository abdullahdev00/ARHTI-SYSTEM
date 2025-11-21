/**
 * Buy Flow Schema - SQLite & Supabase
 * Handles buy/sell transactions, partner balance tracking, and invoices
 */

export interface TransactionItem {
    item_id: string;
    item_name: string;
    variants: {
        variant_id: string;
        weight_kg: number;
        quantity: number;
        rate_per_bag: number;
        total: number;
    }[];
    total_bags: number;
    total_quantity: number;
    total_value: number;
}

export interface Transaction {
    id: string;
    user_id: string;
    partner_id: string;
    transaction_type: 'buy' | 'sell';
    items: TransactionItem[];
    total_bags: number;
    total_quantity: number;
    total_value: number;
    charges?: any[];                    // Applied charges
    charges_amount?: number;            // Total charges calculated
    final_total?: number;               // total_value + charges_amount
    payment_status: 'paid' | 'unpaid' | 'partial';
    paid_amount: number;
    remaining_amount: number;
    payment_method?: string;
    print_invoice: boolean;
    notes?: string;
    created_at: string;
    updated_at: string;
    sync_status?: 'pending' | 'synced' | 'error';
}

export interface PartnerBalance {
    id: string;
    user_id: string;
    partner_id: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    payment_status: 'paid' | 'unpaid' | 'partial';
    transaction_id: string;
    transaction_type: 'buy' | 'sell';
    items?: TransactionItem[];
    created_at: string;
    updated_at: string;
    sync_status?: 'pending' | 'synced' | 'error';
}

export interface Invoice {
    id: string;
    user_id: string;
    partner_id: string;
    transaction_id: string;
    invoice_number: string;
    invoice_date: string;
    items: TransactionItem[];
    subtotal: number;
    charges: any[];
    total_charges: number;
    grand_total: number;
    payment_status: 'paid' | 'unpaid' | 'partial';
    paid_amount: number;
    remaining_amount: number;
    payment_method?: string;
    created_at: string;
    updated_at: string;
    sync_status?: 'pending' | 'synced' | 'error';
}

/**
 * SQLite Schema Creation SQL
 * Run this in your SQLite database initialization
 */
export const BUY_FLOW_SCHEMA = `
-- =====================================================
-- 1. TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    partner_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('buy', 'sell')),
    items TEXT NOT NULL,
    total_bags INTEGER NOT NULL,
    total_quantity REAL NOT NULL,
    total_value REAL NOT NULL,
    charges TEXT DEFAULT '[]',
    charges_amount REAL DEFAULT 0,
    final_total REAL,
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('paid', 'unpaid', 'partial')),
    paid_amount REAL DEFAULT 0,
    remaining_amount REAL NOT NULL,
    payment_method TEXT,
    print_invoice INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sync_status TEXT DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES user_profiles(id),
    FOREIGN KEY (partner_id) REFERENCES partners(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_partner_id ON transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status);

-- =====================================================
-- 2. PARTNER_BALANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS partner_balance (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    partner_id TEXT NOT NULL,
    total_amount REAL NOT NULL,
    paid_amount REAL DEFAULT 0,
    remaining_amount REAL NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('paid', 'unpaid', 'partial')),
    transaction_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('buy', 'sell')),
    items TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sync_status TEXT DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES user_profiles(id),
    FOREIGN KEY (partner_id) REFERENCES partners(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

CREATE INDEX IF NOT EXISTS idx_partner_balance_user_id ON partner_balance(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_balance_partner_id ON partner_balance(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_balance_transaction_id ON partner_balance(transaction_id);

-- =====================================================
-- 3. INVOICES TABLE (Extended)
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    partner_id TEXT NOT NULL,
    transaction_id TEXT,
    invoice_number TEXT UNIQUE,
    invoice_date TEXT NOT NULL,
    items TEXT NOT NULL,
    subtotal REAL NOT NULL,
    charges TEXT DEFAULT '[]',
    total_charges REAL DEFAULT 0,
    grand_total REAL NOT NULL,
    payment_status TEXT DEFAULT 'unpaid',
    paid_amount REAL DEFAULT 0,
    remaining_amount REAL DEFAULT 0,
    payment_method TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sync_status TEXT DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES user_profiles(id),
    FOREIGN KEY (partner_id) REFERENCES partners(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_partner_id ON invoices(partner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_transaction_id ON invoices(transaction_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
`;
