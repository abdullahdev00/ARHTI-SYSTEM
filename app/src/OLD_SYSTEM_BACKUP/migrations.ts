import { Migration } from './types';
import { migration_9_add_sync_columns } from './migrations/migration_9_add_sync_columns';

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    sql: `
      -- Farmers Table
      CREATE TABLE IF NOT EXISTS farmers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Purchases Table
      CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmer_id INTEGER NOT NULL,
        crop_name TEXT NOT NULL,
        quantity REAL NOT NULL,
        rate REAL NOT NULL,
        total_amount REAL NOT NULL,
        purchase_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farmer_id) REFERENCES farmers (id) ON DELETE CASCADE
      );

      -- Invoices Table
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmer_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT CHECK(status IN ('pending', 'paid', 'partial')) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farmer_id) REFERENCES farmers (id) ON DELETE CASCADE
      );

      -- Invoice Items Table (for purchase_ids relationship)
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        purchase_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE,
        FOREIGN KEY (purchase_id) REFERENCES purchases (id) ON DELETE CASCADE,
        UNIQUE(invoice_id, purchase_id)
      );

      -- Stock Table
      CREATE TABLE IF NOT EXISTS stock (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_name TEXT NOT NULL UNIQUE,
        quantity REAL NOT NULL DEFAULT 0,
        buy_rate REAL NOT NULL,
        sell_rate REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Payments Table
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_date DATE NOT NULL,
        payment_method TEXT CHECK(payment_method IN ('cash', 'bank', 'cheque')) DEFAULT 'cash',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
      );

      -- Charges Table
      CREATE TABLE IF NOT EXISTS charges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT CHECK(type IN ('fixed', 'percentage')) NOT NULL,
        value REAL NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Database Info Table
      CREATE TABLE IF NOT EXISTS database_info (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Insert initial database version
      INSERT OR REPLACE INTO database_info (key, value) VALUES ('version', '1');
      INSERT OR REPLACE INTO database_info (key, value) VALUES ('created_at', datetime('now'));
    `,
    rollback: `
      DROP TABLE IF EXISTS charges;
      DROP TABLE IF EXISTS payments;
      DROP TABLE IF EXISTS stock;
      DROP TABLE IF EXISTS invoice_items;
      DROP TABLE IF EXISTS invoices;
      DROP TABLE IF EXISTS purchases;
      DROP TABLE IF EXISTS farmers;
      DROP TABLE IF EXISTS database_info;
    `
  },
  {
    version: 2,
    name: 'add_indexes',
    sql: `
      -- Performance Indexes
      CREATE INDEX IF NOT EXISTS idx_farmers_name ON farmers(name);
      CREATE INDEX IF NOT EXISTS idx_farmers_phone ON farmers(phone);
      CREATE INDEX IF NOT EXISTS idx_purchases_farmer_id ON purchases(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
      CREATE INDEX IF NOT EXISTS idx_purchases_crop ON purchases(crop_name);
      CREATE INDEX IF NOT EXISTS idx_invoices_farmer_id ON invoices(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
      CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(created_at);
      CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
      CREATE INDEX IF NOT EXISTS idx_invoice_items_purchase ON invoice_items(purchase_id);
      CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
      CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
      CREATE INDEX IF NOT EXISTS idx_stock_crop ON stock(crop_name);
      CREATE INDEX IF NOT EXISTS idx_charges_active ON charges(is_active);

      -- Update database version
      UPDATE database_info SET value = '2', updated_at = datetime('now') WHERE key = 'version';
    `,
    rollback: `
      DROP INDEX IF EXISTS idx_farmers_name;
      DROP INDEX IF EXISTS idx_farmers_phone;
      DROP INDEX IF EXISTS idx_purchases_farmer_id;
      DROP INDEX IF EXISTS idx_purchases_date;
      DROP INDEX IF EXISTS idx_purchases_crop;
      DROP INDEX IF EXISTS idx_invoices_farmer_id;
      DROP INDEX IF EXISTS idx_invoices_status;
      DROP INDEX IF EXISTS idx_invoices_date;
      DROP INDEX IF EXISTS idx_invoice_items_invoice;
      DROP INDEX IF EXISTS idx_invoice_items_purchase;
      DROP INDEX IF EXISTS idx_payments_invoice;
      DROP INDEX IF EXISTS idx_payments_date;
      DROP INDEX IF EXISTS idx_stock_crop;
      DROP INDEX IF EXISTS idx_charges_active;
      
      UPDATE database_info SET value = '1', updated_at = datetime('now') WHERE key = 'version';
    `
  },
  {
    version: 3,
    name: 'add_full_text_search',
    sql: `
      -- Full-text search for farmers
      CREATE VIRTUAL TABLE IF NOT EXISTS farmers_fts USING fts5(
        name, phone, address, 
        content='farmers', 
        content_rowid='id'
      );

      -- Populate FTS table
      INSERT INTO farmers_fts(farmers_fts) VALUES('rebuild');

      -- Full-text search for purchases
      CREATE VIRTUAL TABLE IF NOT EXISTS purchases_fts USING fts5(
        crop_name,
        content='purchases',
        content_rowid='id'
      );

      -- Populate FTS table
      INSERT INTO purchases_fts(purchases_fts) VALUES('rebuild');

      -- Triggers to keep FTS tables in sync
      CREATE TRIGGER IF NOT EXISTS farmers_fts_insert AFTER INSERT ON farmers BEGIN
        INSERT INTO farmers_fts(rowid, name, phone, address) 
        VALUES (new.id, new.name, new.phone, new.address);
      END;

      CREATE TRIGGER IF NOT EXISTS farmers_fts_delete AFTER DELETE ON farmers BEGIN
        INSERT INTO farmers_fts(farmers_fts, rowid, name, phone, address) 
        VALUES('delete', old.id, old.name, old.phone, old.address);
      END;

      CREATE TRIGGER IF NOT EXISTS farmers_fts_update AFTER UPDATE ON farmers BEGIN
        INSERT INTO farmers_fts(farmers_fts, rowid, name, phone, address) 
        VALUES('delete', old.id, old.name, old.phone, old.address);
        INSERT INTO farmers_fts(rowid, name, phone, address) 
        VALUES (new.id, new.name, new.phone, new.address);
      END;

      CREATE TRIGGER IF NOT EXISTS purchases_fts_insert AFTER INSERT ON purchases BEGIN
        INSERT INTO purchases_fts(rowid, crop_name) 
        VALUES (new.id, new.crop_name);
      END;

      CREATE TRIGGER IF NOT EXISTS purchases_fts_delete AFTER DELETE ON purchases BEGIN
        INSERT INTO purchases_fts(purchases_fts, rowid, crop_name) 
        VALUES('delete', old.id, old.crop_name);
      END;

      CREATE TRIGGER IF NOT EXISTS purchases_fts_update AFTER UPDATE ON purchases BEGIN
        INSERT INTO purchases_fts(purchases_fts, rowid, crop_name) 
        VALUES('delete', old.id, old.crop_name);
        INSERT INTO purchases_fts(rowid, crop_name) 
        VALUES (new.id, new.crop_name);
      END;

      -- Update database version
      UPDATE database_info SET value = '3', updated_at = datetime('now') WHERE key = 'version';
    `,
    rollback: `
      DROP TRIGGER IF EXISTS purchases_fts_update;
      DROP TRIGGER IF EXISTS purchases_fts_delete;
      DROP TRIGGER IF EXISTS purchases_fts_insert;
      DROP TRIGGER IF EXISTS farmers_fts_update;
      DROP TRIGGER IF EXISTS farmers_fts_delete;
      DROP TRIGGER IF EXISTS farmers_fts_insert;
      DROP TABLE IF EXISTS purchases_fts;
      DROP TABLE IF EXISTS farmers_fts;
      
      UPDATE database_info SET value = '2', updated_at = datetime('now') WHERE key = 'version';
    `
  },
  {
    version: 4,
    name: 'rename_farmers_to_partners',
    sql: `
      -- Create new partners table with role column
      CREATE TABLE IF NOT EXISTS partners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        role TEXT DEFAULT 'farmer' CHECK(role IN ('farmer', 'buyer')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Copy data from farmers to partners (set role as 'farmer' for existing data)
      INSERT INTO partners (id, name, phone, address, role, created_at, updated_at)
      SELECT id, name, phone, address, 'farmer', created_at, updated_at FROM farmers;

      -- Update foreign key references
      -- Note: SQLite doesn't support ALTER TABLE to modify foreign keys directly
      -- So we'll keep both tables for now and update queries to use partners

      -- Create indexes for partners table
      CREATE INDEX IF NOT EXISTS idx_partners_name ON partners(name);
      CREATE INDEX IF NOT EXISTS idx_partners_phone ON partners(phone);
      CREATE INDEX IF NOT EXISTS idx_partners_role ON partners(role);

      -- Update FTS table for partners
      DROP VIRTUAL TABLE IF EXISTS farmers_fts;
      CREATE VIRTUAL TABLE IF NOT EXISTS partners_fts USING fts5(
        name, phone, address, role,
        content='partners', 
        content_rowid='id'
      );

      -- Populate partners FTS table
      INSERT INTO partners_fts(partners_fts) VALUES('rebuild');

      -- Create triggers for partners FTS
      CREATE TRIGGER IF NOT EXISTS partners_fts_insert AFTER INSERT ON partners BEGIN
        INSERT INTO partners_fts(rowid, name, phone, address, role) 
        VALUES (new.id, new.name, new.phone, new.address, new.role);
      END;

      CREATE TRIGGER IF NOT EXISTS partners_fts_delete AFTER DELETE ON partners BEGIN
        INSERT INTO partners_fts(partners_fts, rowid, name, phone, address, role) 
        VALUES('delete', old.id, old.name, old.phone, old.address, old.role);
      END;

      CREATE TRIGGER IF NOT EXISTS partners_fts_update AFTER UPDATE ON partners BEGIN
        INSERT INTO partners_fts(partners_fts, rowid, name, phone, address, role) 
        VALUES('delete', old.id, old.name, old.phone, old.address, old.role);
        INSERT INTO partners_fts(rowid, name, phone, address, role) 
        VALUES (new.id, new.name, new.phone, new.address, new.role);
      END;

      -- Update database version
      UPDATE database_info SET value = '4', updated_at = datetime('now') WHERE key = 'version';
    `,
    rollback: `
      -- Drop partners table and related objects
      DROP TRIGGER IF EXISTS partners_fts_insert;
      DROP TRIGGER IF EXISTS partners_fts_delete;
      DROP TRIGGER IF EXISTS partners_fts_update;
      DROP VIRTUAL TABLE IF EXISTS partners_fts;
      DROP INDEX IF EXISTS idx_partners_name;
      DROP INDEX IF EXISTS idx_partners_phone;
      DROP INDEX IF EXISTS idx_partners_role;
      DROP TABLE IF EXISTS partners;

      -- Recreate farmers FTS
      CREATE VIRTUAL TABLE IF NOT EXISTS farmers_fts USING fts5(
        name, phone, address, 
        content='farmers', 
        content_rowid='id'
      );
      INSERT INTO farmers_fts(farmers_fts) VALUES('rebuild');

      -- Recreate farmers FTS triggers
      CREATE TRIGGER IF NOT EXISTS farmers_fts_insert AFTER INSERT ON farmers BEGIN
        INSERT INTO farmers_fts(rowid, name, phone, address) 
        VALUES (new.id, new.name, new.phone, new.address);
      END;

      CREATE TRIGGER IF NOT EXISTS farmers_fts_delete AFTER DELETE ON farmers BEGIN
        INSERT INTO farmers_fts(farmers_fts, rowid, name, phone, address) 
        VALUES('delete', old.id, old.name, old.phone, old.address);
      END;

      CREATE TRIGGER IF NOT EXISTS farmers_fts_update AFTER UPDATE ON farmers BEGIN
        INSERT INTO farmers_fts(farmers_fts, rowid, name, phone, address) 
        VALUES('delete', old.id, old.name, old.phone, old.address);
        INSERT INTO farmers_fts(rowid, name, phone, address) 
        VALUES (new.id, new.name, new.phone, new.address);
      END;

      UPDATE database_info SET value = '3', updated_at = datetime('now') WHERE key = 'version';
    `
  },
  {
    version: 5,
    name: 'add_bag_variants',
    sql: `
      -- Create bag_variants table for detailed stock management
      CREATE TABLE IF NOT EXISTS bag_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_name TEXT NOT NULL,
        weight_kg INTEGER NOT NULL,
        quantity_bags INTEGER NOT NULL DEFAULT 0,
        today_rate REAL NOT NULL,
        category TEXT DEFAULT 'General',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (crop_name) REFERENCES stock (crop_name) ON DELETE CASCADE
      );

      -- Create index for better performance
      CREATE INDEX IF NOT EXISTS idx_bag_variants_crop_name ON bag_variants(crop_name);
      CREATE INDEX IF NOT EXISTS idx_bag_variants_weight ON bag_variants(weight_kg);
      
      -- Create stock_items table for complete stock management
      CREATE TABLE IF NOT EXISTS stock_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_name TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        total_bags INTEGER NOT NULL DEFAULT 0,
        total_weight_kg REAL NOT NULL DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Create index for stock_items
      CREATE INDEX IF NOT EXISTS idx_stock_items_crop_name ON stock_items(crop_name);
      CREATE INDEX IF NOT EXISTS idx_stock_items_category ON stock_items(category);
      
      -- Create categories table for proper category management
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Create index for categories
      CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
      
      -- Update database version
      UPDATE database_info SET value = '5', updated_at = datetime('now') WHERE key = 'version';
    `,
    rollback: `
      DROP INDEX IF EXISTS idx_categories_name;
      DROP TABLE IF EXISTS categories;
      DROP INDEX IF EXISTS idx_stock_items_category;
      DROP INDEX IF EXISTS idx_stock_items_crop_name;
      DROP TABLE IF EXISTS stock_items;
      DROP INDEX IF EXISTS idx_bag_variants_weight;
      DROP INDEX IF EXISTS idx_bag_variants_crop_name;
      DROP TABLE IF EXISTS bag_variants;
      
      UPDATE database_info SET value = '4', updated_at = datetime('now') WHERE key = 'version';
    `
  },
  {
    version: 6,
    name: 'convert_farmers_to_partners',
    sql: `
      -- Step 1: Create new partners table with role field (simple structure)
      CREATE TABLE IF NOT EXISTS partners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        role TEXT CHECK(role IN ('farmer', 'buyer')) DEFAULT 'farmer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Step 2: Migrate existing farmers data to partners (only if farmers table exists)
      INSERT INTO partners (id, name, phone, address, role, created_at, updated_at)
      SELECT id, name, phone, address, 'farmer', created_at, updated_at
      FROM farmers
      WHERE EXISTS (SELECT name FROM sqlite_master WHERE type='table' AND name='farmers');

      -- Step 3: Create indexes for partners table (only basic ones)
      CREATE INDEX IF NOT EXISTS idx_partners_name ON partners(name);
      CREATE INDEX IF NOT EXISTS idx_partners_phone ON partners(phone);
      CREATE INDEX IF NOT EXISTS idx_partners_role ON partners(role);

      -- Step 4: Drop old farmers table (after data migration)
      DROP TABLE IF EXISTS farmers;

      -- Step 8: Update database version
      UPDATE database_info SET value = '6', updated_at = datetime('now') WHERE key = 'version';
    `,
    rollback: `
      -- Recreate farmers table
      CREATE TABLE IF NOT EXISTS farmers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Migrate partners back to farmers (only farmer role)
      INSERT INTO farmers (id, name, phone, address, created_at, updated_at)
      SELECT id, name, phone, address, created_at, updated_at
      FROM partners WHERE role = 'farmer';
      
      -- Remove new indexes
      DROP INDEX IF EXISTS idx_partners_name;
      DROP INDEX IF EXISTS idx_partners_phone;
      DROP INDEX IF EXISTS idx_partners_village;
      DROP INDEX IF EXISTS idx_partners_role;
      DROP INDEX IF EXISTS idx_partners_sync_status;
      DROP INDEX IF EXISTS idx_partners_cloud_id;
      DROP INDEX IF EXISTS idx_purchases_partner_id;
      DROP INDEX IF EXISTS idx_invoices_partner_id;
      
      -- Remove new columns
      ALTER TABLE purchases DROP COLUMN partner_id;
      ALTER TABLE invoices DROP COLUMN partner_id;
      
      -- Drop partners table
      DROP TABLE IF EXISTS partners;
      
      -- Restore database version
      UPDATE database_info SET value = '5', updated_at = datetime('now') WHERE key = 'version';
    `
  },
  {
    version: 7,
    name: 'add_bag_details_to_purchases',
    sql: `
      -- Add bag details columns to purchases table
      ALTER TABLE purchases ADD COLUMN bag_quantity INTEGER DEFAULT 1;
      ALTER TABLE purchases ADD COLUMN weight_per_bag REAL DEFAULT 40.0;
      ALTER TABLE purchases ADD COLUMN bag_variant_id INTEGER;

      -- Update existing records to have proper bag details
      -- Assume 40kg per bag for existing records
      UPDATE purchases SET 
        bag_quantity = CAST(quantity / 40.0 AS INTEGER),
        weight_per_bag = 40.0
      WHERE bag_quantity IS NULL;

      -- Add index for bag variant lookups
      CREATE INDEX IF NOT EXISTS idx_purchases_bag_variant ON purchases(bag_variant_id);

      -- Update database version
      UPDATE database_info SET value = '7', updated_at = datetime('now') WHERE key = 'version';
    `,
    rollback: `
      -- Remove bag details columns
      ALTER TABLE purchases DROP COLUMN bag_quantity;
      ALTER TABLE purchases DROP COLUMN weight_per_bag;
      ALTER TABLE purchases DROP COLUMN bag_variant_id;

      -- Remove index
      DROP INDEX IF EXISTS idx_purchases_bag_variant;

      -- Restore database version
      UPDATE database_info SET value = '6', updated_at = datetime('now') WHERE key = 'version';
    `
  },
  {
    version: 8,
    name: 'add_transaction_type_fields_safe',
    sql: `
      -- Add transaction_type column to purchases if it doesn't exist
      ALTER TABLE purchases ADD COLUMN transaction_type TEXT DEFAULT 'stock_buy';
      
      -- Add transaction_type column to invoices if it doesn't exist
      ALTER TABLE invoices ADD COLUMN transaction_type TEXT DEFAULT 'stock_buy';
      
      -- Update existing records with default values
      UPDATE purchases SET transaction_type = 'stock_buy' WHERE transaction_type IS NULL OR transaction_type = '';
      UPDATE invoices SET transaction_type = 'stock_buy' WHERE transaction_type IS NULL OR transaction_type = '';
    `,
    rollback: `
      -- Note: SQLite doesn't support DROP COLUMN, so we can't remove the columns
      -- Just clear the values
      UPDATE purchases SET transaction_type = NULL;
      UPDATE invoices SET transaction_type = NULL;

      -- Restore database version
      UPDATE database_info SET value = '7', updated_at = datetime('now') WHERE key = 'version';
    `
  },
  // Add the new migration
  migration_9_add_sync_columns
];

export const getCurrentVersion = (): number => {
  return Math.max(...migrations.map(m => m.version));
};

export const getMigration = (version: number): Migration | undefined => {
  return migrations.find(m => m.version === version);
};

export const getMigrationsFromVersion = (fromVersion: number): Migration[] => {
  return migrations
    .filter(m => m.version > fromVersion)
    .sort((a, b) => a.version - b.version);
};
