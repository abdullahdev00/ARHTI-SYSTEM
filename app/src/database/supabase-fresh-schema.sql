-- FRESH START SUPABASE SCHEMA
-- Modern, clean, optimized for Legend State sync
-- Run this in your Supabase SQL Editor

-- ===== ENABLE REQUIRED EXTENSIONS =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== CATEGORIES TABLE =====
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(name, user_id)
);

-- ===== PARTNERS TABLE =====
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    role TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===== PURCHASES TABLE =====
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    bag_quantity INTEGER,
    weight_per_bag DECIMAL(10,2),
    rate DECIMAL(10,2) NOT NULL CHECK (rate > 0),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
    purchase_date DATE DEFAULT CURRENT_DATE NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('stock_buy', 'stock_sell', 'mixed')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===== INVOICES TABLE =====
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'partial')) DEFAULT 'pending',
    invoice_date DATE DEFAULT CURRENT_DATE NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('stock_buy', 'stock_sell', 'mixed')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===== INVOICE ITEMS TABLE =====
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure unique purchase per invoice
    UNIQUE(invoice_id, purchase_id)
);

-- ===== PERFORMANCE INDEXES =====

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

-- Partners indexes
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON public.partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_name ON public.partners(name);
CREATE INDEX IF NOT EXISTS idx_partners_role ON public.partners(role);
CREATE INDEX IF NOT EXISTS idx_partners_created_at ON public.partners(created_at DESC);

-- Purchases indexes
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_partner_id ON public.purchases(partner_id);
CREATE INDEX IF NOT EXISTS idx_purchases_category_id ON public.purchases(category_id);
CREATE INDEX IF NOT EXISTS idx_purchases_item_name ON public.purchases(item_name);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON public.purchases(purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at DESC);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_partner_id ON public.invoices(partner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at DESC);

-- Invoice items indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_purchase_id ON public.invoice_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_user_id ON public.invoice_items(user_id);

-- ===== CHARGES TABLE =====
CREATE TABLE IF NOT EXISTS public.charges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fixed', 'percentage')),
    value DECIMAL(10,2) NOT NULL CHECK (value > 0),
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(name, user_id)
);

-- Charges indexes
CREATE INDEX IF NOT EXISTS idx_charges_user_id ON public.charges(user_id);
CREATE INDEX IF NOT EXISTS idx_charges_name ON public.charges(name);
CREATE INDEX IF NOT EXISTS idx_charges_type ON public.charges(type);
CREATE INDEX IF NOT EXISTS idx_charges_created_at ON public.charges(created_at DESC);

-- ===== STOCK ITEMS TABLE WITH JSON VARIANTS =====
CREATE TABLE IF NOT EXISTS public.stock_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    item_name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    variants JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Array of variants: {id, weight_kg, rate_per_bag, quantity, total_value}
    total_quantity DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_quantity >= 0),
    total_bags INTEGER NOT NULL DEFAULT 0 CHECK (total_bags >= 0),
    total_value DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_value >= 0),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(item_name, user_id)
);

-- Stock items indexes
CREATE INDEX IF NOT EXISTS idx_stock_items_user_id ON public.stock_items(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_item_name ON public.stock_items(item_name);
CREATE INDEX IF NOT EXISTS idx_stock_items_category_id ON public.stock_items(category_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_created_at ON public.stock_items(created_at DESC);

-- ===== ROW LEVEL SECURITY (RLS) =====

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;

-- Categories RLS policies
CREATE POLICY "Users can view their own categories" ON public.categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON public.categories
    FOR DELETE USING (auth.uid() = user_id);

-- Partners RLS policies
CREATE POLICY "Users can view their own partners" ON public.partners
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own partners" ON public.partners
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own partners" ON public.partners
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own partners" ON public.partners
    FOR DELETE USING (auth.uid() = user_id);

-- Purchases RLS policies
CREATE POLICY "Users can view their own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON public.purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchases" ON public.purchases
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchases" ON public.purchases
    FOR DELETE USING (auth.uid() = user_id);

-- Invoices RLS policies
CREATE POLICY "Users can view their own invoices" ON public.invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices" ON public.invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" ON public.invoices
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" ON public.invoices
    FOR DELETE USING (auth.uid() = user_id);

-- Invoice items RLS policies
CREATE POLICY "Users can view their own invoice items" ON public.invoice_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoice items" ON public.invoice_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoice items" ON public.invoice_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoice items" ON public.invoice_items
    FOR DELETE USING (auth.uid() = user_id);

-- Stock items RLS policies
CREATE POLICY "Users can view their own stock items" ON public.stock_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock items" ON public.stock_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock items" ON public.stock_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock items" ON public.stock_items
    FOR DELETE USING (auth.uid() = user_id);

-- Charges RLS policies
CREATE POLICY "Users can view their own charges" ON public.charges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own charges" ON public.charges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own charges" ON public.charges
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own charges" ON public.charges
    FOR DELETE USING (auth.uid() = user_id);

-- ===== AUTOMATIC UPDATED_AT TRIGGERS =====

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON public.categories 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partners_updated_at 
    BEFORE UPDATE ON public.partners 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at 
    BEFORE UPDATE ON public.purchases 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON public.invoices 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_items_updated_at 
    BEFORE UPDATE ON public.stock_items 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_charges_updated_at 
    BEFORE UPDATE ON public.charges 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== REALTIME SUBSCRIPTIONS =====

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoice_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.charges;

-- ===== SAMPLE DATA (OPTIONAL) =====

-- Uncomment to insert sample data for testing
/*
-- Sample partner
INSERT INTO public.partners (name, phone, role, user_id) VALUES 
('Ahmed Khan', '0300-1234567', 'farmer', auth.uid());

-- Sample purchase
INSERT INTO public.purchases (partner_id, crop_name, quantity, rate, total_amount, user_id) 
SELECT id, 'Wheat', 100, 50, 5000, auth.uid() FROM public.partners LIMIT 1;
*/

-- ===== VERIFICATION QUERIES =====

-- Check table creation
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('partners', 'purchases', 'invoices', 'invoice_items');

-- Check RLS policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('partners', 'purchases', 'invoices', 'invoice_items');

-- Check indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('partners', 'purchases', 'invoices', 'invoice_items')
ORDER BY tablename, indexname;

-- ===== SUCCESS MESSAGE =====
DO $$
BEGIN
    RAISE NOTICE '✅ Fresh Supabase schema created successfully!';
    RAISE NOTICE '📋 Tables: partners, purchases, invoices, invoice_items';
    RAISE NOTICE '🔒 RLS policies: Enabled and configured';
    RAISE NOTICE '⚡ Indexes: Optimized for performance';
    RAISE NOTICE '🔄 Realtime: Enabled for all tables';
    RAISE NOTICE '🚀 Ready for Legend State sync!';
END $$;
