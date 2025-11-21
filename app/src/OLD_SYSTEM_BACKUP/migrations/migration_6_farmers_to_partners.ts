import { Migration } from '../types';

export const migration_6_farmers_to_partners: Migration = {
  version: 6,
  name: 'convert_farmers_to_partners',
  sql: `
    -- Step 1: Create new partners table with role field
    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      village TEXT,
      address TEXT,
      role TEXT CHECK(role IN ('farmer', 'buyer')) DEFAULT 'farmer',
      sync_status TEXT DEFAULT 'pending',
      cloud_id TEXT, -- For Supabase sync
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Step 2: Migrate existing farmers data to partners
    INSERT INTO partners (id, name, phone, address, role, created_at, updated_at)
    SELECT id, name, phone, address, 'farmer', created_at, updated_at
    FROM farmers;

    -- Step 3: Update purchases table to reference partners instead of farmers
    -- First, add new partner_id column
    ALTER TABLE purchases ADD COLUMN partner_id INTEGER;
    
    -- Copy farmer_id to partner_id
    UPDATE purchases SET partner_id = farmer_id;
    
    -- Step 4: Update invoices table to reference partners
    ALTER TABLE invoices ADD COLUMN partner_id INTEGER;
    UPDATE invoices SET partner_id = farmer_id;
    
    -- Step 5: Update payments table if it references farmers
    -- Check if payments has farmer_id column and update accordingly
    
    -- Step 6: Create indexes for partners table
    CREATE INDEX IF NOT EXISTS idx_partners_name ON partners(name);
    CREATE INDEX IF NOT EXISTS idx_partners_phone ON partners(phone);
    CREATE INDEX IF NOT EXISTS idx_partners_village ON partners(village);
    CREATE INDEX IF NOT EXISTS idx_partners_role ON partners(role);
    CREATE INDEX IF NOT EXISTS idx_partners_sync_status ON partners(sync_status);
    CREATE INDEX IF NOT EXISTS idx_partners_cloud_id ON partners(cloud_id);
    
    -- Step 7: Create indexes for new foreign keys
    CREATE INDEX IF NOT EXISTS idx_purchases_partner_id ON purchases(partner_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_partner_id ON invoices(partner_id);

    -- Step 8: Update database version
    UPDATE database_info SET value = '6', updated_at = datetime('now') WHERE key = 'version';
  `,
  rollback: `
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
};
