-- Migration: Add stock_items and stock_bag_details tables to Supabase
-- Purpose: Properly store inventory items with multiple bags
-- Date: 2025-11-15
-- Run this in Supabase SQL Editor

-- ===== STOCK ITEMS TABLE =====
CREATE TABLE IF NOT EXISTS public.stock_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    item_name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    total_quantity DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_quantity >= 0),
    total_bags INTEGER NOT NULL DEFAULT 0 CHECK (total_bags >= 0),
    total_value DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_value >= 0),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(item_name, user_id)
);

-- ===== STOCK BAG DETAILS TABLE =====
CREATE TABLE IF NOT EXISTS public.stock_bag_details (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    stock_item_id UUID REFERENCES public.stock_items(id) ON DELETE CASCADE NOT NULL,
    weight_kg DECIMAL(10,2) NOT NULL CHECK (weight_kg > 0),
    rate_per_bag DECIMAL(10,2) NOT NULL CHECK (rate_per_bag > 0),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    total_value DECIMAL(12,2) NOT NULL CHECK (total_value > 0),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_stock_items_user_id ON public.stock_items(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_item_name ON public.stock_items(item_name);
CREATE INDEX IF NOT EXISTS idx_stock_items_category_id ON public.stock_items(category_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_created_at ON public.stock_items(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_bag_details_stock_item_id ON public.stock_bag_details(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_bag_details_user_id ON public.stock_bag_details(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_bag_details_created_at ON public.stock_bag_details(created_at DESC);

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_bag_details ENABLE ROW LEVEL SECURITY;

-- Stock items RLS policies
CREATE POLICY "Users can view their own stock items" ON public.stock_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock items" ON public.stock_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock items" ON public.stock_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock items" ON public.stock_items
    FOR DELETE USING (auth.uid() = user_id);

-- Stock bag details RLS policies
CREATE POLICY "Users can view their own stock bag details" ON public.stock_bag_details
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock bag details" ON public.stock_bag_details
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock bag details" ON public.stock_bag_details
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock bag details" ON public.stock_bag_details
    FOR DELETE USING (auth.uid() = user_id);

-- ===== TRIGGERS =====
CREATE TRIGGER update_stock_items_updated_at 
    BEFORE UPDATE ON public.stock_items 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_bag_details_updated_at 
    BEFORE UPDATE ON public.stock_bag_details 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== REALTIME SUBSCRIPTIONS =====
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_bag_details;
