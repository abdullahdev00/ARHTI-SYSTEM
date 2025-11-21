-- Migration: Update stock_items table to use JSON variants instead of separate table
-- Purpose: Store variants (40kg, 50kg, etc.) as JSON in stock_items table
-- Date: 2025-11-15
-- Run this in Supabase SQL Editor

-- Drop old stock_bag_details table if it exists
DROP TABLE IF EXISTS public.stock_bag_details CASCADE;

-- Update stock_items table to add variants column
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Create index on variants for better query performance
CREATE INDEX IF NOT EXISTS idx_stock_items_variants ON public.stock_items USING GIN (variants);

-- Update realtime publication to remove stock_bag_details
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.stock_bag_details;

-- Ensure stock_items is in realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_items;
