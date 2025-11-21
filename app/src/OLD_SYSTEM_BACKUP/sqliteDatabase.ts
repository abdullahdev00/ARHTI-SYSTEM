import * as SQLite from 'expo-sqlite';
import {
  Farmer, Purchase, Invoice, InvoiceItem, DatabaseResult, DatabaseStats, DatabaseInfo,
  FarmerInput, PurchaseInput, InvoiceInput,
  FarmerSearchOptions, PurchaseSearchOptions, InvoiceSearchOptions,
  Partner, PartnerInput, PartnerSearchOptions, Charge, Payment
} from './types';
import { migrations, getCurrentVersion, getMigrationsFromVersion } from './migrations';
import { DatabaseReset } from './databaseReset';
import { PARTNER_QUERIES, FARMER_QUERIES, PURCHASE_QUERIES, INVOICE_QUERIES, STATS_QUERIES, BACKUP_QUERIES } from './queries';

export class SQLiteDatabaseManager {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private isInitializing = false;

  constructor(private databaseName: string = 'arhti_system.db') { }

  /**
   * Initialize the database connection and run migrations
   */
  async initializeDatabase(): Promise<DatabaseResult<boolean>> {
    if (this.isInitialized) {
      return { success: true, data: true };
    }

    if (this.isInitializing) {
      // Wait for initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return { success: this.isInitialized, data: this.isInitialized };
    }

    this.isInitializing = true;

    try {
      console.log('Initializing SQLite database...');

      // Open database connection with modern Expo SQLite v16+
      this.db = await SQLite.openDatabaseAsync(this.databaseName);

      // Enable WAL mode for better performance and concurrent access
      await this.db.execAsync('PRAGMA journal_mode = WAL;');
      await this.db.execAsync('PRAGMA synchronous = NORMAL;');
      await this.db.execAsync('PRAGMA cache_size = 10000;');
      await this.db.execAsync('PRAGMA temp_store = memory;');

      console.log('Database connection established with WAL mode');

      // Run migrations
      await this.runMigrations();

      // Sample data seeding disabled
      // await this.addSampleDataIfEmpty();

      this.isInitialized = true;
      this.isInitializing = false;

      console.log('Database initialized successfully');
      return { success: true, data: true };

    } catch (error) {
      this.isInitializing = false;
      console.error('Database initialization failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Get current database version
      let currentVersion = 0;
      try {
        const result = await this.db.getFirstAsync<{ value: string }>(
          'SELECT value FROM database_info WHERE key = ?',
          ['version']
        );
        currentVersion = result ? parseInt(result.value) : 0;
      } catch (error) {
        // database_info table doesn't exist yet, this is fine for first run
        console.log('Database info table not found, starting fresh migration');
      }

      const targetVersion = getCurrentVersion();
      console.log(`Database migration: ${currentVersion} -> ${targetVersion}`);

      if (currentVersion < targetVersion) {
        const migrationsToRun = getMigrationsFromVersion(currentVersion);

        for (const migration of migrationsToRun) {
          console.log(`Running migration ${migration.version}: ${migration.name}`);

          try {
            // Execute migration in a transaction
            await this.db.withTransactionAsync(async () => {
              await this.db!.execAsync(migration.sql);
            });

            console.log(`Migration ${migration.version} completed`);
          } catch (migrationError) {
            console.error(`Migration ${migration.version} failed:`, migrationError);

            // Handle duplicate column errors gracefully for migrations 8 and 9
            if (migrationError instanceof Error && migrationError.message.includes('duplicate column')) {
              if (migration.version === 8 || migration.version === 9) {
                console.log(`Skipping migration ${migration.version} - columns already exist`);

                // Still update the database version to mark migration as completed
                await this.db.execAsync(`
                  INSERT OR REPLACE INTO database_info (key, value, updated_at) 
                  VALUES ('version', '${migration.version}', datetime('now'))
                `);

                continue;
              }
            }

            // For other errors, throw to stop initialization
            throw migrationError;
          }
        }
      }

    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  // Sample data seeding removed for production

  /**
   * Check if database is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  /**
   * Get database info
   */
  async getDatabaseInfo(): Promise<DatabaseResult<DatabaseInfo>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const version = await this.db!.getFirstAsync<{ value: string }>(
        'SELECT value FROM database_info WHERE key = ?',
        ['version']
      );

      const counts = await this.db!.getFirstAsync<any>(STATS_QUERIES.DASHBOARD_STATS);

      const info: DatabaseInfo = {
        version: version ? parseInt(version.value) : 0,
        isEncrypted: false, // TODO: Implement encryption
        recordCount: {
          partners: counts?.total_farmers || 0, // partners table (farmers + buyers)
          farmers: counts?.total_farmers || 0, // Keep for backward compatibility
          purchases: counts?.total_purchases || 0,
          invoices: counts?.total_invoices || 0,
          stock: counts?.total_stock_items || 0,
          payments: 0, // TODO: Implement payments
          charges: 0, // TODO: Implement charges
        }
      };

      return { success: true, data: info };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get database info'
      };
    }
  }

  // PARTNER OPERATIONS (Farmers + Buyers)
  async getPartners(options?: PartnerSearchOptions): Promise<DatabaseResult<Partner[]>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      let query = PARTNER_QUERIES.SELECT_ALL;
      let params: any[] = [];

      // Role-specific filtering
      if (options?.role) {
        query = options.role === 'farmer' ? PARTNER_QUERIES.SELECT_FARMERS : PARTNER_QUERIES.SELECT_BUYERS;
      }

      // Search filtering
      if (options?.query) {
        if (options.query.length > 2) {
          query = PARTNER_QUERIES.SEARCH_FULL_TEXT;
          params = [`%${options.query}%`, `%${options.query}%`, options.limit || 100, options.offset || 0];
        } else {
          query = PARTNER_QUERIES.SEARCH_BY_NAME;
          params = [`%${options.query}%`, options.limit || 100, options.offset || 0];
        }
      }

      const partners = await this.db!.getAllAsync<Partner>(query, params);
      return { success: true, data: partners };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get partners'
      };
    }
  }

  async getPartnerById(id: number): Promise<DatabaseResult<Partner | null>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const partner = await this.db!.getFirstAsync<Partner>(PARTNER_QUERIES.SELECT_BY_ID, [id]);
      return { success: true, data: partner || null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get partner'
      };
    }
  }

  async addPartner(partner: PartnerInput): Promise<DatabaseResult<Partner | null>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      console.log('Adding partner:', {
        name: partner.name,
        phone: partner.phone || '',
        address: partner.address || '',
        role: partner.role || 'farmer'
      });

      const result = await this.db!.runAsync(
        PARTNER_QUERIES.INSERT,
        [partner.name, partner.phone || '', partner.address || '', partner.role || 'farmer']
      );

      console.log('📝 Insert result:', result);

      const newPartner = await this.db!.getFirstAsync<Partner>(
        PARTNER_QUERIES.SELECT_BY_ID,
        [result.lastInsertRowId]
      );

      console.log('✅ New partner created:', newPartner);
      return { success: true, data: newPartner };
    } catch (error) {
      console.error('❌ Error adding partner:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add partner'
      };
    }
  }

  async updatePartner(id: number, partner: PartnerInput): Promise<DatabaseResult<Partner | null>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      await this.db!.runAsync(
        PARTNER_QUERIES.UPDATE,
        [partner.name, partner.phone || '', partner.address || '', partner.role || 'farmer', id]
      );

      const updatedPartner = await this.db!.getFirstAsync<Partner>(
        PARTNER_QUERIES.SELECT_BY_ID,
        [id]
      );

      return { success: true, data: updatedPartner };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update partner'
      };
    }
  }

  async deletePartner(id: number): Promise<DatabaseResult<boolean>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const result = await this.db!.runAsync(PARTNER_QUERIES.DELETE, [id]);
      return { success: true, data: result.changes > 0 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete partner'
      };
    }
  }

  // FARMER OPERATIONS (Backward Compatibility)
  async getFarmers(options?: FarmerSearchOptions): Promise<DatabaseResult<Farmer[]>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      let query = FARMER_QUERIES.SELECT_ALL;
      let params: any[] = [];

      if (options?.query) {
        if (options.query.length > 2) {
          // Use full-text search for longer queries
          query = FARMER_QUERIES.SEARCH_FULL_TEXT;
          params = [options.query, options.limit || 100, options.offset || 0];
        } else {
          // Use LIKE search for shorter queries
          query = FARMER_QUERIES.SEARCH_BY_NAME;
          params = [`%${options.query}%`, options.limit || 100, options.offset || 0];
        }
      }

      const farmers = await this.db!.getAllAsync<Farmer>(query, params);
      return { success: true, data: farmers };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get farmers'
      };
    }
  }

  async getFarmerById(id: number): Promise<DatabaseResult<Farmer | null>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const farmer = await this.db!.getFirstAsync<Farmer>(FARMER_QUERIES.SELECT_BY_ID, [id]);
      return { success: true, data: farmer || null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get farmer'
      };
    }
  }

  async addFarmer(farmer: FarmerInput): Promise<DatabaseResult<Farmer>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      console.log('📝 Inserting farmer with data:', {
        name: farmer.name,
        phone: farmer.phone || '',
        address: farmer.address || '',
        role: farmer.role || 'farmer'
      });

      const result = await this.db!.runAsync(
        FARMER_QUERIES.INSERT,
        [farmer.name, farmer.phone || '', farmer.address || '', farmer.role || 'farmer']
      );

      console.log('📝 Insert result:', result);

      const newFarmer = await this.db!.getFirstAsync<Farmer>(
        FARMER_QUERIES.SELECT_BY_ID,
        [result.lastInsertRowId]
      );

      if (!newFarmer) {
        return { success: false, error: 'Failed to retrieve created farmer' };
      }

      return { success: true, data: newFarmer };
    } catch (error) {
      console.error('❌ Error adding farmer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add farmer'
      };
    }
  }

  async updateFarmer(id: number, farmer: FarmerInput): Promise<DatabaseResult<Farmer>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      // Check if cloud_id is being updated or if we need to preserve existing one
      if ((farmer as any).cloud_id !== undefined) {
        // Update including cloud_id
        await this.db!.runAsync(
          `UPDATE partners SET name = ?, phone = ?, address = ?, role = ?, cloud_id = ?, updated_at = datetime('now') WHERE id = ?`,
          [farmer.name, farmer.phone || '', farmer.address || '', farmer.role || 'farmer', (farmer as any).cloud_id, id]
        );
      } else {
        // Update without affecting cloud_id (preserve existing value)
        await this.db!.runAsync(
          FARMER_QUERIES.UPDATE,
          [farmer.name, farmer.phone || '', farmer.address || '', farmer.role || 'farmer', id]
        );
      }

      const updatedFarmer = await this.db!.getFirstAsync<Farmer>(
        FARMER_QUERIES.SELECT_BY_ID,
        [id]
      );

      if (!updatedFarmer) {
        return { success: false, error: 'Farmer not found after update' };
      }

      return { success: true, data: updatedFarmer };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update farmer'
      };
    }
  }

  async deleteFarmer(id: number): Promise<DatabaseResult<boolean>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const result = await this.db!.runAsync(FARMER_QUERIES.DELETE, [id]);
      return { success: true, data: result.changes > 0 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete farmer'
      };
    }
  }

  // PURCHASE OPERATIONS
  async getPurchases(options?: PurchaseSearchOptions): Promise<DatabaseResult<Purchase[]>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      let query = PURCHASE_QUERIES.SELECT_ALL;
      let params: any[] = [];

      if (options?.farmerId) {
        query = PURCHASE_QUERIES.SELECT_BY_FARMER;
        params = [options.farmerId];
      } else if (options?.query) {
        if (options.query.length > 2) {
          query = PURCHASE_QUERIES.SEARCH_FULL_TEXT;
          params = [options.query, options.limit || 100, options.offset || 0];
        } else {
          query = PURCHASE_QUERIES.SEARCH_BY_CROP;
          params = [`%${options.query}%`, options.limit || 100, options.offset || 0];
        }
      } else if (options?.dateFrom && options?.dateTo) {
        query = PURCHASE_QUERIES.SEARCH_BY_DATE_RANGE;
        params = [options.dateFrom, options.dateTo, options.limit || 100, options.offset || 0];
      }

      const purchases = await this.db!.getAllAsync<Purchase>(query, params);
      return { success: true, data: purchases };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get purchases'
      };
    }
  }

  async addPurchase(purchase: PurchaseInput): Promise<DatabaseResult<Purchase>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const result = await this.db!.runAsync(
        PURCHASE_QUERIES.INSERT,
        [
          purchase.farmer_id,
          purchase.crop_name,
          purchase.quantity,
          purchase.rate,
          purchase.total_amount,
          purchase.purchase_date
        ]
      );

      const newPurchase = await this.db!.getFirstAsync<Purchase>(
        PURCHASE_QUERIES.SELECT_BY_ID,
        [result.lastInsertRowId]
      );

      if (!newPurchase) {
        return { success: false, error: 'Failed to retrieve created purchase' };
      }

      return { success: true, data: newPurchase };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add purchase'
      };
    }
  }

  // INVOICE OPERATIONS
  async getInvoices(options?: InvoiceSearchOptions): Promise<DatabaseResult<Invoice[]>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      let query = INVOICE_QUERIES.SELECT_ALL;
      let params: any[] = [];

      if (options?.status) {
        query = INVOICE_QUERIES.SELECT_BY_STATUS;
        params = [options.status, options.limit || 100, options.offset || 0];
      } else if (options?.farmerId) {
        query = INVOICE_QUERIES.SELECT_BY_FARMER;
        params = [options.farmerId];
      }

      const invoices = await this.db!.getAllAsync<Invoice>(query, params);
      return { success: true, data: invoices };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get invoices'
      };
    }
  }

  async getInvoiceItems(invoiceId: number): Promise<DatabaseResult<any[]>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const items = await this.db!.getAllAsync(
        INVOICE_QUERIES.SELECT_ITEMS_BY_INVOICE,
        [invoiceId]
      );
      return { success: true, data: items };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get invoice items'
      };
    }
  }

  async createInvoice(invoice: InvoiceInput, purchaseIds: number[]): Promise<DatabaseResult<Invoice>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      let newInvoice: Invoice | null = null;

      await this.db!.withTransactionAsync(async () => {
        // Create invoice
        const result = await this.db!.runAsync(
          INVOICE_QUERIES.INSERT,
          [invoice.farmer_id, invoice.total_amount, invoice.status]
        );

        const invoiceId = result.lastInsertRowId;

        // Add invoice items
        for (const purchaseId of purchaseIds) {
          await this.db!.runAsync(
            INVOICE_QUERIES.INSERT_ITEM,
            [invoiceId, purchaseId]
          );
        }

        // Get the created invoice
        newInvoice = await this.db!.getFirstAsync<Invoice>(
          INVOICE_QUERIES.SELECT_BY_ID,
          [invoiceId]
        );
      });

      if (!newInvoice) {
        return { success: false, error: 'Failed to retrieve created invoice' };
      }

      return { success: true, data: newInvoice };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create invoice'
      };
    }
  }

  // STOCK OPERATIONS
  async getStock(): Promise<DatabaseResult<any[]>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const stock = await this.db!.getAllAsync('SELECT * FROM stock ORDER BY crop_name ASC');
      return { success: true, data: stock };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stock'
      };
    }
  }

  async addStock(stock: any): Promise<DatabaseResult<any>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const result = await this.db!.runAsync(
        'INSERT INTO stock (crop_name, quantity, buy_rate, sell_rate) VALUES (?, ?, ?, ?)',
        [stock.crop_name, stock.quantity, stock.buy_rate, stock.sell_rate]
      );

      const newStock = await this.db!.getFirstAsync(
        'SELECT * FROM stock WHERE id = ?',
        [result.lastInsertRowId]
      );

      return { success: true, data: newStock };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add stock'
      };
    }
  }

  async updateStock(cropName: string, quantityChange: number): Promise<DatabaseResult<any>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      // Update stock quantity (can be positive for addition or negative for reduction)
      await this.db!.runAsync(
        'UPDATE stock SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE crop_name = ?',
        [quantityChange, cropName]
      );

      // Get updated stock record
      const updatedStock = await this.db!.getFirstAsync(
        'SELECT * FROM stock WHERE crop_name = ?',
        [cropName]
      );

      return { success: true, data: updatedStock };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update stock'
      };
    }
  }

  // BAG VARIANTS OPERATIONS
  async addStockItem(stockItem: any): Promise<DatabaseResult<any>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      // Insert stock item
      const stockResult = await this.db!.runAsync(
        'INSERT INTO stock_items (crop_name, category, total_bags, total_weight_kg) VALUES (?, ?, ?, ?)',
        [stockItem.crop_name, stockItem.category, stockItem.total_bags, stockItem.total_weight_kg]
      );

      const stockItemId = stockResult.lastInsertRowId;

      // Insert bag variants
      for (const variant of stockItem.bag_variants) {
        await this.db!.runAsync(
          'INSERT INTO bag_variants (crop_name, weight_kg, quantity_bags, today_rate, category) VALUES (?, ?, ?, ?, ?)',
          [stockItem.crop_name, variant.weight_kg, variant.quantity_bags, variant.today_rate, stockItem.category]
        );
      }

      // Get complete stock item with variants
      const completeStockItem = await this.getStockItemById(stockItemId);

      return { success: true, data: completeStockItem.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add stock item'
      };
    }
  }

  async updateStockItem(id: number, stockItem: any): Promise<DatabaseResult<any>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      console.log('SQLite: Updating stock item with ID:', id, stockItem);

      // Update stock item in stock_items table
      await this.db!.runAsync(
        'UPDATE stock_items SET crop_name = ?, category = ?, total_bags = ?, total_weight_kg = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [stockItem.crop_name, stockItem.category, stockItem.total_bags, stockItem.total_weight_kg, id]
      );

      // Delete existing bag variants for this stock item
      await this.db!.runAsync(
        'DELETE FROM bag_variants WHERE crop_name = ? AND category = ?',
        [stockItem.crop_name, stockItem.category]
      );

      // Insert updated bag variants
      for (const variant of stockItem.bag_variants) {
        await this.db!.runAsync(
          'INSERT INTO bag_variants (crop_name, weight_kg, quantity_bags, today_rate, category) VALUES (?, ?, ?, ?, ?)',
          [stockItem.crop_name, variant.weight_kg, variant.quantity_bags, variant.today_rate, stockItem.category]
        );
      }

      // Get updated complete stock item with variants
      const updatedStockItem = await this.getStockItemById(id);

      console.log('SQLite: Stock item updated successfully in database');
      return { success: true, data: updatedStockItem.data };
    } catch (error) {
      console.error('SQLite: Error updating stock item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update stock item'
      };
    }
  }

  async getStockItems(): Promise<DatabaseResult<any[]>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      // Get all stock items
      const stockItems = await this.db!.getAllAsync(`
        SELECT * FROM stock_items ORDER BY crop_name ASC
      `);

      // Get bag variants for each stock item
      const completeStockItems = [];
      for (const item of stockItems as any[]) {
        const variants = await this.db!.getAllAsync(
          'SELECT * FROM bag_variants WHERE crop_name = ? ORDER BY weight_kg ASC',
          [item.crop_name]
        );

        completeStockItems.push({
          ...item,
          bag_variants: variants
        });
      }

      return { success: true, data: completeStockItems };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stock items'
      };
    }
  }

  async getStockItemById(id: number): Promise<DatabaseResult<any>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const stockItem = await this.db!.getFirstAsync(
        'SELECT * FROM stock_items WHERE id = ?',
        [id]
      );

      if (stockItem) {
        const variants = await this.db!.getAllAsync(
          'SELECT * FROM bag_variants WHERE crop_name = ? ORDER BY weight_kg ASC',
          [(stockItem as any).crop_name]
        );

        return {
          success: true,
          data: {
            ...stockItem,
            bag_variants: variants
          }
        };
      }

      return { success: true, data: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stock item'
      };
    }
  }

  async updateBagVariantQuantity(cropName: string, weightKg: number, quantityChange: number): Promise<DatabaseResult<any>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      // Update bag variant quantity
      await this.db!.runAsync(
        'UPDATE bag_variants SET quantity_bags = quantity_bags + ?, updated_at = CURRENT_TIMESTAMP WHERE crop_name = ? AND weight_kg = ?',
        [quantityChange, cropName, weightKg]
      );

      // Recalculate totals for stock item
      const totals = await this.db!.getFirstAsync(`
        SELECT 
          SUM(quantity_bags) as total_bags,
          SUM(quantity_bags * weight_kg) as total_weight_kg
        FROM bag_variants 
        WHERE crop_name = ?
      `, [cropName]);

      if (totals) {
        await this.db!.runAsync(
          'UPDATE stock_items SET total_bags = ?, total_weight_kg = ?, updated_at = CURRENT_TIMESTAMP WHERE crop_name = ?',
          [(totals as any).total_bags || 0, (totals as any).total_weight_kg || 0, cropName]
        );
      }

      return { success: true, data: totals };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update bag variant quantity'
      };
    }
  }

  // CATEGORIES OPERATIONS
  async getCategories(): Promise<DatabaseResult<any[]>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const categories = await this.db!.getAllAsync('SELECT * FROM categories ORDER BY name ASC');
      return { success: true, data: categories };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get categories'
      };
    }
  }

  async addCategory(category: any): Promise<DatabaseResult<any>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const result = await this.db!.runAsync(
        'INSERT INTO categories (name, description) VALUES (?, ?)',
        [category.name, category.description || '']
      );

      const newCategory = await this.db!.getFirstAsync(
        'SELECT * FROM categories WHERE id = ?',
        [result.lastInsertRowId]
      );

      return { success: true, data: newCategory };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add category'
      };
    }
  }

  async updateCategory(id: number, category: any): Promise<DatabaseResult<any>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      await this.db!.runAsync(
        'UPDATE categories SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [category.name, category.description || '', id]
      );

      const updatedCategory = await this.db!.getFirstAsync(
        'SELECT * FROM categories WHERE id = ?',
        [id]
      );

      return { success: true, data: updatedCategory };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update category'
      };
    }
  }

  async deleteCategory(id: number): Promise<DatabaseResult<boolean>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      await this.db!.runAsync('DELETE FROM categories WHERE id = ?', [id]);
      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete category'
      };
    }
  }

  // CHARGES OPERATIONS
  async getCharges(): Promise<DatabaseResult<any[]>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const charges = await this.db!.getAllAsync('SELECT * FROM charges WHERE is_active = 1 ORDER BY name ASC');
      return { success: true, data: charges };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get charges'
      };
    }
  }

  async addCharge(charge: any): Promise<DatabaseResult<any>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const result = await this.db!.runAsync(
        'INSERT INTO charges (name, type, value, description, is_active) VALUES (?, ?, ?, ?, ?)',
        [charge.name, charge.type, charge.value, charge.description || '', true]
      );

      const newCharge = await this.db!.getFirstAsync(
        'SELECT * FROM charges WHERE id = ?',
        [result.lastInsertRowId]
      );

      return { success: true, data: newCharge };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add charge'
      };
    }
  }

  // PAYMENTS OPERATIONS
  async getPayments(): Promise<DatabaseResult<any[]>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const payments = await this.db!.getAllAsync(`
        SELECT p.*, i.farmer_id, f.name as farmer_name
        FROM payments p
        LEFT JOIN invoices i ON p.invoice_id = i.id
        LEFT JOIN farmers f ON i.farmer_id = f.id
        ORDER BY p.payment_date DESC, p.created_at DESC
      `);
      return { success: true, data: payments };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payments'
      };
    }
  }

  async addPayment(payment: any): Promise<DatabaseResult<any>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const result = await this.db!.runAsync(
        'INSERT INTO payments (invoice_id, amount, payment_date, payment_method, notes) VALUES (?, ?, ?, ?, ?)',
        [payment.invoice_id, payment.amount, payment.payment_date, payment.payment_method, payment.notes || '']
      );

      const newPayment = await this.db!.getFirstAsync(
        'SELECT * FROM payments WHERE id = ?',
        [result.lastInsertRowId]
      );

      return { success: true, data: newPayment };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add payment'
      };
    }
  }

  // STATISTICS
  async getStats(): Promise<DatabaseResult<DatabaseStats>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const stats = await this.db!.getFirstAsync<DatabaseStats>(STATS_QUERIES.DASHBOARD_STATS);

      if (!stats) {
        return { success: false, error: 'Failed to get statistics' };
      }

      return { success: true, data: stats };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get statistics'
      };
    }
  }

  // BACKUP AND RESTORE
  async exportData(): Promise<DatabaseResult<string>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const data = await this.db!.getAllAsync(BACKUP_QUERIES.GET_ALL_DATA);
      const info = await this.db!.getAllAsync(BACKUP_QUERIES.GET_DATABASE_INFO);

      const backup = {
        version: getCurrentVersion(),
        timestamp: new Date().toISOString(),
        data: data,
        info: info
      };

      return { success: true, data: JSON.stringify(backup, null, 2) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export data'
      };
    }
  }

  /**
   * Clear all data from database (for testing purposes)
   */
  async clearAllData(): Promise<DatabaseResult<boolean>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      console.log('Starting database clear process...');

      // Clear all tables in correct order (to handle foreign key constraints)
      // Use IF EXISTS to avoid errors if tables don't exist
      await this.db!.execAsync('DELETE FROM invoice_items WHERE 1=1;');
      console.log('Cleared invoice_items');

      await this.db!.execAsync('DELETE FROM invoices WHERE 1=1;');
      console.log('Cleared invoices');

      await this.db!.execAsync('DELETE FROM purchases WHERE 1=1;');
      console.log('Cleared purchases');

      await this.db!.execAsync('DELETE FROM partners WHERE 1=1;');
      console.log('Cleared partners');

      await this.db!.execAsync('DELETE FROM payments WHERE 1=1;');
      console.log('Cleared payments');

      await this.db!.execAsync('DELETE FROM charges WHERE 1=1;');
      console.log('Cleared charges');

      // Clear old stock table
      await this.db!.execAsync('DELETE FROM stock WHERE 1=1;');
      console.log('Cleared old stock table');

      // Clear new bag variants and stock items tables (check if they exist first)
      try {
        await this.db!.execAsync('DELETE FROM bag_variants WHERE 1=1;');
        console.log('Cleared bag_variants');
      } catch (error) {
        console.log('bag_variants table does not exist, skipping...');
      }

      try {
        await this.db!.execAsync('DELETE FROM stock_items WHERE 1=1;');
        console.log('Cleared stock_items');
      } catch (error) {
        console.log('stock_items table does not exist, skipping...');
      }

      // Clear categories (check if it exists first)
      try {
        await this.db!.execAsync('DELETE FROM categories WHERE 1=1;');
        console.log('Cleared categories');
      } catch (error) {
        console.log('categories table does not exist, skipping...');
      }

      // Reset auto-increment counters
      await this.db!.execAsync('DELETE FROM sqlite_sequence WHERE 1=1;');
      console.log('Reset auto-increment counters');

      console.log('Database cleared successfully - all tables processed');
      return { success: true, data: true };
    } catch (error) {
      console.error('Error clearing database:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear database'
      };
    }
  }

  // Missing methods for HybridDatabaseManager compatibility

  async updatePurchase(id: number, updates: Partial<Purchase>): Promise<DatabaseResult<Purchase>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      // Build dynamic update query
      const fields = Object.keys(updates).filter(key => key !== 'id');
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => (updates as any)[field]);

      const query = `UPDATE purchases SET ${setClause}, updated_at = datetime('now') WHERE id = ?`;
      await this.db!.runAsync(query, [...values, id]);

      // Get updated purchase
      const result = await this.db!.getFirstAsync<Purchase>(
        'SELECT * FROM purchases WHERE id = ?',
        [id]
      );

      if (!result) {
        return { success: false, error: 'Purchase not found after update' };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error updating purchase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update purchase'
      };
    }
  }

  async deletePurchase(id: number): Promise<DatabaseResult<boolean>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      await this.db!.runAsync('DELETE FROM purchases WHERE id = ?', [id]);
      return { success: true, data: true };
    } catch (error) {
      console.error('Error deleting purchase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete purchase'
      };
    }
  }

  async addInvoice(invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>, items: any[]): Promise<DatabaseResult<Invoice>> {
    // Delegate to existing createInvoice method
    return this.createInvoice(invoice as InvoiceInput, items);
  }

  async getPurchaseById(id: number): Promise<DatabaseResult<Purchase>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const result = await this.db!.getFirstAsync<Purchase>(
        'SELECT * FROM purchases WHERE id = ?',
        [id]
      );

      if (!result) {
        return { success: false, error: 'Purchase not found' };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error getting purchase by ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get purchase'
      };
    }
  }

  async getInvoiceById(id: number): Promise<DatabaseResult<Invoice>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const result = await this.db!.getFirstAsync<Invoice>(
        'SELECT * FROM invoices WHERE id = ?',
        [id]
      );

      if (!result) {
        return { success: false, error: 'Invoice not found' };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error getting invoice by ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get invoice'
      };
    }
  }

  async getPaymentById(id: number): Promise<DatabaseResult<any>> {
    if (!this.isReady()) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const result = await this.db!.getFirstAsync<any>(
        'SELECT * FROM payments WHERE id = ?',
        [id]
      );

      if (!result) {
        return { success: false, error: 'Payment not found' };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error getting payment by ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payment'
      };
    }
  }

  /**
   * Close database connection
   */
  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Note: Use SimpleHybridManager.getInstance() instead of direct instantiation
// This export is deprecated and will be removed
// export const sqliteDatabaseManager = new SQLiteDatabaseManager();
