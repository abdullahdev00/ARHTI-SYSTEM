import { simpleDatabaseManager } from './simpleDatabase';
import { sqliteDatabaseManager } from './sqliteDatabase';
import { DatabaseResult } from './types';

export class DataMigrationService {
  /**
   * Migrate data from simple in-memory database to SQLite
   */
  async migrateFromSimpleDatabase(): Promise<DatabaseResult<boolean>> {
    try {
      console.log('Starting data migration from simple database to SQLite...');

      // Initialize simple database to get existing data
      await simpleDatabaseManager.initializeDatabase();

      // Get all data from simple database
      const farmers = await simpleDatabaseManager.getFarmers();
      const purchases = await simpleDatabaseManager.getPurchases();
      const invoices = await simpleDatabaseManager.getInvoices();

      console.log(`Found ${farmers.length} farmers, ${purchases.length} purchases, ${invoices.length} invoices`);

      // Initialize SQLite database
      const initResult = await sqliteDatabaseManager.initializeDatabase();
      if (!initResult.success) {
        return { success: false, error: `SQLite initialization failed: ${initResult.error}` };
      }

      let migratedFarmers = 0;
      let migratedPurchases = 0;
      let migratedInvoices = 0;

      // Migrate farmers
      const farmerIdMap = new Map<number, number>(); // old_id -> new_id
      
      for (const farmer of farmers) {
        const result = await sqliteDatabaseManager.addFarmer({
          name: farmer.name,
          phone: farmer.phone,
          address: farmer.address
        });

        if (result.success && result.data) {
          farmerIdMap.set(farmer.id, result.data.id);
          migratedFarmers++;
        } else {
          console.warn(`Failed to migrate farmer ${farmer.name}: ${result.error}`);
        }
      }

      // Migrate purchases
      const purchaseIdMap = new Map<number, number>(); // old_id -> new_id
      
      for (const purchase of purchases) {
        const newFarmerId = farmerIdMap.get(purchase.farmer_id);
        if (!newFarmerId) {
          console.warn(`Skipping purchase ${purchase.id}: farmer not found`);
          continue;
        }

        const result = await sqliteDatabaseManager.addPurchase({
          farmer_id: newFarmerId,
          crop_name: purchase.crop_name,
          quantity: purchase.quantity,
          rate: purchase.rate,
          total_amount: purchase.total_amount,
          purchase_date: purchase.purchase_date
        });

        if (result.success && result.data) {
          purchaseIdMap.set(purchase.id, result.data.id);
          migratedPurchases++;
        } else {
          console.warn(`Failed to migrate purchase ${purchase.id}: ${result.error}`);
        }
      }

      // Migrate invoices
      for (const invoice of invoices) {
        const newFarmerId = farmerIdMap.get(invoice.farmer_id);
        if (!newFarmerId) {
          console.warn(`Skipping invoice ${invoice.id}: farmer not found`);
          continue;
        }

        // Map old purchase IDs to new purchase IDs
        const newPurchaseIds: number[] = [];
        for (const oldPurchaseId of invoice.purchase_ids) {
          const newPurchaseId = purchaseIdMap.get(oldPurchaseId);
          if (newPurchaseId) {
            newPurchaseIds.push(newPurchaseId);
          }
        }

        if (newPurchaseIds.length === 0) {
          console.warn(`Skipping invoice ${invoice.id}: no valid purchases found`);
          continue;
        }

        const result = await sqliteDatabaseManager.createInvoice(
          {
            farmer_id: newFarmerId,
            total_amount: invoice.total_amount,
            status: invoice.status
          },
          newPurchaseIds
        );

        if (result.success) {
          migratedInvoices++;
        } else {
          console.warn(`Failed to migrate invoice ${invoice.id}: ${result.error}`);
        }
      }

      console.log(`Migration completed: ${migratedFarmers} farmers, ${migratedPurchases} purchases, ${migratedInvoices} invoices`);

      return {
        success: true,
        data: true
      };

    } catch (error) {
      console.error('Data migration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown migration error'
      };
    }
  }

  /**
   * Validate migration by comparing data counts
   */
  async validateMigration(): Promise<DatabaseResult<{
    isValid: boolean;
    details: {
      farmers: { simple: number; sqlite: number; match: boolean };
      purchases: { simple: number; sqlite: number; match: boolean };
      invoices: { simple: number; sqlite: number; match: boolean };
    };
  }>> {
    try {
      // Get counts from simple database
      await simpleDatabaseManager.initializeDatabase();
      const simpleFarmers = await simpleDatabaseManager.getFarmers();
      const simplePurchases = await simpleDatabaseManager.getPurchases();
      const simpleInvoices = await simpleDatabaseManager.getInvoices();

      // Get counts from SQLite database
      const sqliteInitResult = await sqliteDatabaseManager.initializeDatabase();
      if (!sqliteInitResult.success) {
        return { success: false, error: 'SQLite database not available for validation' };
      }

      const sqliteFarmersResult = await sqliteDatabaseManager.getFarmers();
      const sqlitePurchasesResult = await sqliteDatabaseManager.getPurchases();
      const sqliteInvoicesResult = await sqliteDatabaseManager.getInvoices();

      if (!sqliteFarmersResult.success || !sqlitePurchasesResult.success || !sqliteInvoicesResult.success) {
        return { success: false, error: 'Failed to get SQLite data for validation' };
      }

      const details = {
        farmers: {
          simple: simpleFarmers.length,
          sqlite: sqliteFarmersResult.data?.length || 0,
          match: simpleFarmers.length === (sqliteFarmersResult.data?.length || 0)
        },
        purchases: {
          simple: simplePurchases.length,
          sqlite: sqlitePurchasesResult.data?.length || 0,
          match: simplePurchases.length === (sqlitePurchasesResult.data?.length || 0)
        },
        invoices: {
          simple: simpleInvoices.length,
          sqlite: sqliteInvoicesResult.data?.length || 0,
          match: simpleInvoices.length === (sqliteInvoicesResult.data?.length || 0)
        }
      };

      const isValid = details.farmers.match && details.purchases.match && details.invoices.match;

      return {
        success: true,
        data: { isValid, details }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }

  /**
   * Create a backup of current data before migration
   */
  async createPreMigrationBackup(): Promise<DatabaseResult<string>> {
    try {
      await simpleDatabaseManager.initializeDatabase();
      
      const farmers = await simpleDatabaseManager.getFarmers();
      const purchases = await simpleDatabaseManager.getPurchases();
      const invoices = await simpleDatabaseManager.getInvoices();

      const backup = {
        version: 'simple_database',
        timestamp: new Date().toISOString(),
        data: {
          farmers,
          purchases,
          invoices
        }
      };

      return {
        success: true,
        data: JSON.stringify(backup, null, 2)
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create backup'
      };
    }
  }

  /**
   * Check if migration is needed
   */
  async isMigrationNeeded(): Promise<DatabaseResult<boolean>> {
    try {
      // Check if SQLite database exists and has data
      const sqliteInitResult = await sqliteDatabaseManager.initializeDatabase();
      if (!sqliteInitResult.success) {
        return { success: true, data: true }; // Migration needed
      }

      const sqliteStatsResult = await sqliteDatabaseManager.getStats();
      if (!sqliteStatsResult.success || !sqliteStatsResult.data) {
        return { success: true, data: true }; // Migration needed
      }

      const stats = sqliteStatsResult.data;
      const hasData = stats.totalFarmers > 0 || stats.totalPurchases > 0 || stats.totalInvoices > 0;

      // If SQLite has data, migration is not needed
      return { success: true, data: !hasData };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check migration status'
      };
    }
  }

  /**
   * Get migration status and progress
   */
  async getMigrationStatus(): Promise<DatabaseResult<{
    isNeeded: boolean;
    sqliteHasData: boolean;
    simpleDbCounts: { farmers: number; purchases: number; invoices: number };
    sqliteDbCounts: { farmers: number; purchases: number; invoices: number };
  }>> {
    try {
      // Check simple database
      await simpleDatabaseManager.initializeDatabase();
      const simpleFarmers = await simpleDatabaseManager.getFarmers();
      const simplePurchases = await simpleDatabaseManager.getPurchases();
      const simpleInvoices = await simpleDatabaseManager.getInvoices();

      // Check SQLite database
      const sqliteInitResult = await sqliteDatabaseManager.initializeDatabase();
      let sqliteDbCounts = { farmers: 0, purchases: 0, invoices: 0 };
      let sqliteHasData = false;

      if (sqliteInitResult.success) {
        const farmersResult = await sqliteDatabaseManager.getFarmers();
        const purchasesResult = await sqliteDatabaseManager.getPurchases();
        const invoicesResult = await sqliteDatabaseManager.getInvoices();

        sqliteDbCounts = {
          farmers: farmersResult.data?.length || 0,
          purchases: purchasesResult.data?.length || 0,
          invoices: invoicesResult.data?.length || 0
        };

        sqliteHasData = sqliteDbCounts.farmers > 0 || sqliteDbCounts.purchases > 0 || sqliteDbCounts.invoices > 0;
      }

      const simpleDbCounts = {
        farmers: simpleFarmers.length,
        purchases: simplePurchases.length,
        invoices: simpleInvoices.length
      };

      const isNeeded = !sqliteHasData && (simpleDbCounts.farmers > 0 || simpleDbCounts.purchases > 0 || simpleDbCounts.invoices > 0);

      return {
        success: true,
        data: {
          isNeeded,
          sqliteHasData,
          simpleDbCounts,
          sqliteDbCounts
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get migration status'
      };
    }
  }
}

export const dataMigrationService = new DataMigrationService();
