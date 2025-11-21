-- Migration: Create stock_items table with JSON variants for SQLite
-- Purpose: Store inventory items with variants (different weights) as JSON
-- Date: 2025-11-15

-- Create stock_items table with variants as JSON
CREATE TABLE IF NOT EXISTS stock_items (
    id TEXT PRIMARY KEY,
    item_name TEXT NOT NULL,
    category_id TEXT,
    variants TEXT NOT NULL DEFAULT '[]',  -- JSON array of variants
    total_quantity REAL NOT NULL DEFAULT 0,
    total_bags INTEGER NOT NULL DEFAULT 0,
    total_value REAL NOT NULL DEFAULT 0,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sync_status TEXT DEFAULT 'pending',
    local_id INTEGER,
    UNIQUE(item_name, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_items_user_id ON stock_items(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_item_name ON stock_items(item_name);
CREATE INDEX IF NOT EXISTS idx_stock_items_category_id ON stock_items(category_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_sync_status ON stock_items(sync_status);
