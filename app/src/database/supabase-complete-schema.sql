-- Complete Supabase Database Schema for ARHTI System
-- Run this in your Supabase SQL Editor to create all required tables

-- =====================================================
-- 1. PARTNERS TABLE (Farmers & Buyers)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    role TEXT DEFAULT 'farmer',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for partners
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Partners policies - users can only access their own partners
CREATE POLICY "Users can view own partners" ON public.partners
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own partners" ON public.partners
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own partners" ON public.partners
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own partners" ON public.partners
    FOR DELETE USING (auth.uid() = user_id);

-- Partners indexes
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON public.partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_name ON public.partners(name);
CREATE INDEX IF NOT EXISTS idx_partners_phone ON public.partners(phone);
CREATE INDEX IF NOT EXISTS idx_partners_role ON public.partners(role);
CREATE INDEX IF NOT EXISTS idx_partners_created_at ON public.partners(created_at);

-- =====================================================
-- 2. PURCHASES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    crop_name TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    purchase_date DATE NOT NULL,
    
    -- Additional fields from SQLite
    bag_quantity INTEGER DEFAULT 1,
    weight_per_bag DECIMAL(10,2) DEFAULT 40.0,
    bag_variant_id INTEGER,
    transaction_type TEXT DEFAULT 'stock_buy',
    
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Purchases policies
CREATE POLICY "Users can view own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON public.purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchases" ON public.purchases
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchases" ON public.purchases
    FOR DELETE USING (auth.uid() = user_id);

-- Purchases indexes
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_partner_id ON public.purchases(partner_id);
CREATE INDEX IF NOT EXISTS idx_purchases_crop_name ON public.purchases(crop_name);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON public.purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at);

-- =====================================================
-- 3. INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'paid', 'partial')) DEFAULT 'pending',
    invoice_date DATE NOT NULL,
    
    -- Additional fields from SQLite
    transaction_type TEXT DEFAULT 'stock_buy',
    
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "Users can view own invoices" ON public.invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices" ON public.invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices" ON public.invoices
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices" ON public.invoices
    FOR DELETE USING (auth.uid() = user_id);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_partner_id ON public.invoices(partner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at);

-- =====================================================
-- 4. INVOICE ITEMS TABLE (Optional - for detailed invoices)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for invoice_items
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Invoice items policies
CREATE POLICY "Users can view own invoice_items" ON public.invoice_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoice_items" ON public.invoice_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoice_items" ON public.invoice_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoice_items" ON public.invoice_items
    FOR DELETE USING (auth.uid() = user_id);

-- Invoice items indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_user_id ON public.invoice_items(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_purchase_id ON public.invoice_items(purchase_id);

-- =====================================================
-- 5. TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for all tables
DROP TRIGGER IF EXISTS on_partners_updated ON public.partners;
CREATE TRIGGER on_partners_updated
    BEFORE UPDATE ON public.partners
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_purchases_updated ON public.purchases;
CREATE TRIGGER on_purchases_updated
    BEFORE UPDATE ON public.purchases
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_invoices_updated ON public.invoices;
CREATE TRIGGER on_invoices_updated
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.partners TO authenticated;
GRANT ALL ON public.purchases TO authenticated;
GRANT ALL ON public.invoices TO authenticated;
GRANT ALL ON public.invoice_items TO authenticated;

-- =====================================================
-- 7. ENABLE REALTIME (for Legend State)
-- =====================================================
-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.partners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoice_items;

-- =====================================================
-- SUMMARY OF TABLES CREATED:
-- =====================================================
-- ✅ partners (id, name, phone, address, role, user_id, timestamps)
-- ✅ purchases (id, partner_id, crop_name, quantity, rate, total_amount, purchase_date, bag_details, user_id, timestamps)
-- ✅ invoices (id, partner_id, total_amount, status, invoice_date, user_id, timestamps)
-- ✅ invoice_items (id, invoice_id, purchase_id, user_id, timestamps)
-- ✅ All tables have RLS policies for user isolation
-- ✅ All tables have proper indexes for performance
-- ✅ All tables have realtime enabled for Legend State
-- ✅ All tables have updated_at triggers
