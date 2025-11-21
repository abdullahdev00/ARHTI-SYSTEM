import { Migration } from '../types';

export const migration_9_add_sync_columns: Migration = {
  version: 9,
  name: 'add_sync_columns_for_supabase',
  sql: `
    -- Check and add cloud_id columns for Supabase sync (safe approach)
    -- SQLite doesn't have IF NOT EXISTS for ALTER TABLE, so we use a different approach
    
    -- For partners table
    ALTER TABLE partners ADD COLUMN cloud_id TEXT;
    
    -- For purchases table  
    ALTER TABLE purchases ADD COLUMN cloud_id TEXT;
    
    -- For invoices table
    ALTER TABLE invoices ADD COLUMN cloud_id TEXT;
    
    -- Add missing invoice_date column
    ALTER TABLE invoices ADD COLUMN invoice_date DATE DEFAULT CURRENT_DATE;
    
    -- Create indexes for cloud_id columns (for sync performance)
    CREATE INDEX IF NOT EXISTS idx_partners_cloud_id ON partners(cloud_id);
    CREATE INDEX IF NOT EXISTS idx_purchases_cloud_id ON purchases(cloud_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_cloud_id ON invoices(cloud_id);
    
    -- Update database version
    UPDATE database_info SET value = '9', updated_at = datetime('now') WHERE key = 'version';
  `,
  rollback: `
    -- Remove indexes
    DROP INDEX IF EXISTS idx_partners_cloud_id;
    DROP INDEX IF EXISTS idx_purchases_cloud_id;
    DROP INDEX IF EXISTS idx_invoices_cloud_id;
    
    -- Note: SQLite doesn't support DROP COLUMN, so we can't remove the columns
    -- Just clear the values
    UPDATE partners SET cloud_id = NULL;
    UPDATE purchases SET cloud_id = NULL;
    UPDATE invoices SET cloud_id = NULL;
    UPDATE invoices SET invoice_date = NULL;
    
    -- Restore database version
    UPDATE database_info SET value = '8', updated_at = datetime('now') WHERE key = 'version';
  `
};
