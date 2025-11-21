import { SQLiteDatabaseManager } from './sqliteDatabase';
import { SupabaseDatabaseManager } from './supabaseDatabase';
import { DatabaseResult, Farmer, Purchase, Invoice, Payment, Stock, SyncStatus } from './types';

/**
 * Simple Hybrid Database Manager
 * SQLite (Local) + Supabase (Cloud) Sync
 * Offline-first approach with background sync
 */
export class SimpleHybridManager {
  private static instance: SimpleHybridManager | null = null;
  private static isInitializing: boolean = false;
  
  private sqliteManager: SQLiteDatabaseManager;
  private supabaseManager: SupabaseDatabaseManager;
  private isOnline: boolean = false;
  private syncQueue: any[] = [];
  private syncStatus: SyncStatus;
  private isInitialized: boolean = false;
  private realtimeSubscriptions: any[] = [];

  private constructor() {
    this.sqliteManager = new SQLiteDatabaseManager();
    this.supabaseManager = new SupabaseDatabaseManager();
    
    this.syncStatus = {
      lastSync: null,
      pendingChanges: 0,
      isOnline: false,
      isSyncing: false,
      errors: []
    };

    this.initializeNetworkMonitoring();
  }

  /**
   * Get singleton instance
   */
  static async getInstance(): Promise<SimpleHybridManager> {
    if (SimpleHybridManager.instance) {
      return SimpleHybridManager.instance;
    }

    if (SimpleHybridManager.isInitializing) {
      // Wait for initialization to complete
      while (SimpleHybridManager.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return SimpleHybridManager.instance!;
    }

    SimpleHybridManager.isInitializing = true;
    
    try {
      const instance = new SimpleHybridManager();
      const result = await instance.initialize();
      
      if (result.success) {
        SimpleHybridManager.instance = instance;
      } else {
        throw new Error(`Initialization failed: ${result.error}`);
      }
      
      return instance;
    } finally {
      SimpleHybridManager.isInitializing = false;
    }
  }

  /**
   * Initialize both databases
   */
  async initialize(): Promise<DatabaseResult<boolean>> {
    try {
      console.log('🔄 Initializing Simple Hybrid Database...');

      // Initialize SQLite database first
      try {
        const sqliteResult = await this.sqliteManager.initializeDatabase();
        if (!sqliteResult.success) {
          throw new Error(`SQLite initialization failed: ${sqliteResult.error}`);
        }
        console.log('✅ SQLite database ready');
      } catch (error) {
        throw new Error(`SQLite failed: ${(error as Error).message}`);
      }

      // Try to initialize Supabase (optional)
      if (this.isOnline) {
        try {
          const supabaseResult = await this.supabaseManager.initialize();
          if (supabaseResult.success) {
            console.log('✅ Supabase connected');
          } else {
            console.warn('⚠️ Supabase failed, continuing offline');
          }
        } catch (error) {
          console.warn('⚠️ Supabase error:', error);
        }
      }

      // Setup real-time subscriptions if online
      if (this.isOnline) {
        this.setupRealtimeSubscriptions();
      }

      console.log('✅ Simple Hybrid Database initialized');
      return { success: true, data: true };
    } catch (error) {
      console.error('❌ Hybrid initialization failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * FARMERS OPERATIONS
   */
  
  async getFarmers(options?: any): Promise<DatabaseResult<Farmer[]>> {
    return await this.sqliteManager.getFarmers(options);
  }

  async addFarmer(farmer: Omit<Farmer, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResult<Farmer>> {
    try {
      console.log('🔄 SimpleHybridManager.addFarmer called with:', farmer);
      
      // Always save to SQLite first (offline-first)
      const result = await this.sqliteManager.addFarmer(farmer);
      if (!result.success) {
        console.error('❌ SQLite addFarmer failed:', result.error);
        return result;
      }

      console.log('✅ SQLite farmer added, now queuing for sync:', result.data);

      // Queue for cloud sync
      this.queueForSync('farmers', 'create', result.data);

      console.log(`🌐 Online status: ${this.isOnline}, Queue length: ${this.syncQueue.length}`);

      // Try immediate sync if online
      if (this.isOnline) {
        console.log('🚀 Triggering background sync...');
        this.backgroundSync();
      } else {
        console.log('📴 Offline - sync will happen when online');
      }

      return result;
    } catch (error) {
      console.error('❌ SimpleHybridManager.addFarmer error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async updateFarmer(id: number, updates: Partial<Farmer>): Promise<DatabaseResult<Farmer>> {
    try {
      console.log('🔄 SimpleHybridManager.updateFarmer called with id:', id, 'updates:', updates);
      
      const result = await this.sqliteManager.updateFarmer(id, updates as any);
      if (!result.success) {
        console.error('❌ SQLite updateFarmer failed:', result.error);
        return result;
      }

      console.log('✅ SQLite farmer updated, now queuing for sync:', result.data);
      this.queueForSync('farmers', 'update', result.data);
      
      console.log(`🌐 Online status: ${this.isOnline}, Queue length: ${this.syncQueue.length}`);
      
      if (this.isOnline) {
        console.log('🚀 Triggering background sync for update...');
        this.backgroundSync();
      } else {
        console.log('📴 Offline - update sync will happen when online');
      }

      return result;
    } catch (error) {
      console.error('❌ SimpleHybridManager.updateFarmer error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async deleteFarmer(id: number): Promise<DatabaseResult<boolean>> {
    try {
      console.log('🔄 SimpleHybridManager.deleteFarmer called with id:', id);
      
      // First get the farmer data to store Supabase UUID for sync
      const farmerResult = await this.sqliteManager.getFarmerById(id);
      let supabaseId = null;
      if (farmerResult.success && farmerResult.data) {
        // Store any cloud_id or use the SQLite id as reference
        supabaseId = farmerResult.data.cloud_id || id;
      }
      
      const result = await this.sqliteManager.deleteFarmer(id);
      if (!result.success) {
        console.error('❌ SQLite deleteFarmer failed:', result.error);
        return result;
      }

      console.log('✅ SQLite farmer deleted, now queuing for sync with id:', supabaseId);
      this.queueForSync('farmers', 'delete', { id: supabaseId });
      
      console.log(`🌐 Online status: ${this.isOnline}, Queue length: ${this.syncQueue.length}`);
      
      if (this.isOnline) {
        console.log('🚀 Triggering background sync for delete...');
        this.backgroundSync();
      } else {
        console.log('📴 Offline - delete sync will happen when online');
      }

      return result;
    } catch (error) {
      console.error('❌ SimpleHybridManager.deleteFarmer error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getFarmerById(id: number): Promise<DatabaseResult<Farmer>> {
    const result = await this.sqliteManager.getFarmerById(id);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    if (!result.data) {
      return { success: false, error: 'Farmer not found' };
    }
    return { success: true, data: result.data };
  }

  /**
   * PURCHASES OPERATIONS
   */
  
  async getPurchases(options?: any): Promise<DatabaseResult<Purchase[]>> {
    return await this.sqliteManager.getPurchases(options);
  }

  async addPurchase(purchase: Omit<Purchase, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResult<Purchase>> {
    try {
      const result = await this.sqliteManager.addPurchase(purchase);
      if (!result.success) {
        return result;
      }

      this.queueForSync('purchases', 'create', result.data);
      
      if (this.isOnline) {
        this.backgroundSync();
      }

      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getPurchaseById(id: number): Promise<DatabaseResult<Purchase>> {
    // For now, get all purchases and find by ID
    const allPurchases = await this.sqliteManager.getPurchases({});
    if (allPurchases.success && allPurchases.data) {
      const purchase = allPurchases.data.find(p => p.id === id);
      if (purchase) {
        return { success: true, data: purchase };
      }
    }
    return { success: false, error: 'Purchase not found' };
  }

  /**
   * INVOICES OPERATIONS
   */
  
  async getInvoices(options?: any): Promise<DatabaseResult<Invoice[]>> {
    return await this.sqliteManager.getInvoices(options);
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>, items: any[]): Promise<DatabaseResult<Invoice>> {
    try {
      const result = await this.sqliteManager.createInvoice(invoice as any, items as any);
      if (!result.success) {
        return result;
      }

      this.queueForSync('invoices', 'create', result.data);
      
      if (this.isOnline) {
        this.backgroundSync();
      }

      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getInvoiceById(id: number): Promise<DatabaseResult<Invoice>> {
    // For now, get all invoices and find by ID
    const allInvoices = await this.sqliteManager.getInvoices({});
    if (allInvoices.success && allInvoices.data) {
      const invoice = allInvoices.data.find(i => i.id === id);
      if (invoice) {
        return { success: true, data: invoice };
      }
    }
    return { success: false, error: 'Invoice not found' };
  }

  /**
   * PAYMENTS OPERATIONS
   */
  
  async getPayments(options?: any): Promise<DatabaseResult<Payment[]>> {
    return await this.sqliteManager.getPayments();
  }

  async addPayment(payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResult<Payment>> {
    try {
      const result = await this.sqliteManager.addPayment(payment);
      if (!result.success) {
        return result;
      }

      this.queueForSync('payments', 'create', result.data);
      
      if (this.isOnline) {
        this.backgroundSync();
      }

      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getPaymentById(id: number): Promise<DatabaseResult<Payment>> {
    // For now, get all payments and find by ID
    const allPayments = await this.sqliteManager.getPayments();
    if (allPayments.success && allPayments.data) {
      const payment = allPayments.data.find(p => p.id === id);
      if (payment) {
        return { success: true, data: payment };
      }
    }
    return { success: false, error: 'Payment not found' };
  }

  /**
   * STOCK OPERATIONS
   */
  
  async getStock(options?: any): Promise<DatabaseResult<Stock[]>> {
    return await this.sqliteManager.getStock();
  }

  async updateStock(cropName: string, quantity: number, rate: number): Promise<DatabaseResult<Stock>> {
    try {
      const result = await this.sqliteManager.updateStock(cropName, quantity);
      if (!result.success) {
        return result;
      }

      this.queueForSync('stock', 'update', result.data);
      
      if (this.isOnline) {
        this.backgroundSync();
      }

      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * SYNC OPERATIONS
   */

  private queueForSync(table: string, operation: string, data: any): void {
    this.syncQueue.push({
      table,
      operation,
      data,
      timestamp: new Date(),
      synced: false
    });
    
    this.syncStatus.pendingChanges = this.syncQueue.length;
    console.log(`📝 Queued for sync: ${table} ${operation}`);
  }

  private async backgroundSync(): Promise<void> {
    console.log(`🔍 backgroundSync check - isSyncing: ${this.syncStatus.isSyncing}, isOnline: ${this.isOnline}, queueLength: ${this.syncQueue.length}`);
    
    if (this.syncStatus.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      console.log('⏸️ backgroundSync skipped - conditions not met');
      return;
    }

    try {
      this.syncStatus.isSyncing = true;
      console.log(`🔄 Background sync started (${this.syncQueue.length} items)`);

      const pendingItems = this.syncQueue.filter(item => !item.synced);
      
      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          item.synced = true;
          console.log(`✅ Synced: ${item.table} ${item.operation}`);
        } catch (error) {
          console.error(`❌ Sync failed: ${item.table}`, error);
          this.syncStatus.errors.push(`${item.table}: ${(error as Error).message}`);
        }
      }

      // Remove synced items
      this.syncQueue = this.syncQueue.filter(item => !item.synced);
      this.syncStatus.pendingChanges = this.syncQueue.length;
      this.syncStatus.lastSync = new Date();

      console.log(`✅ Background sync completed`);
    } catch (error) {
      console.error('❌ Background sync error:', error);
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  private async syncItem(item: any): Promise<void> {
    switch (item.table) {
      case 'farmers':
        await this.syncFarmer(item);
        break;
      case 'purchases':
        await this.syncPurchase(item);
        break;
      case 'invoices':
        await this.syncInvoice(item);
        break;
      case 'payments':
        await this.syncPayment(item);
        break;
      case 'stock':
        await this.syncStock(item);
        break;
      default:
        console.warn(`Unknown sync table: ${item.table}`);
    }
  }

  private async syncFarmer(item: any): Promise<void> {
    try {
      console.log(`🔄 Syncing farmer ${item.operation}:`, item.data);
      
      switch (item.operation) {
        case 'create':
          const result = await this.supabaseManager.addPartner(item.data);
          console.log(`✅ Farmer created in Supabase:`, result);
          
          // Store Supabase UUID back to SQLite for future updates/deletes
          if (result.success && result.data && result.data.id) {
            try {
              await this.sqliteManager.updateFarmer(item.data.id, { 
                cloud_id: result.data.id 
              } as any);
              console.log(`💾 Stored Supabase UUID ${result.data.id} for SQLite ID ${item.data.id}`);
            } catch (error) {
              console.warn('⚠️ Failed to store Supabase UUID:', error);
            }
          }
          break;
        case 'update':
          let supabaseUpdateId = item.data.cloud_id;
          console.log(`🔍 Debug - item.data:`, JSON.stringify(item.data, null, 2));
          console.log(`🔍 Debug - supabaseUpdateId:`, supabaseUpdateId);
          
          // If no cloud_id, try to find by name and phone in Supabase
          if (!supabaseUpdateId) {
            console.log(`🔍 No cloud_id found, searching Supabase by name: "${item.data.name}" phone: "${item.data.phone}"`);
            try {
              const searchResult = await this.supabaseManager.getPartners();
              console.log(`📋 Supabase search result:`, searchResult);
              
              if (searchResult.success && searchResult.data) {
                console.log(`📊 Found ${searchResult.data.length} partners in Supabase:`);
                searchResult.data.forEach((p: any, index: number) => {
                  console.log(`  ${index + 1}. Name: "${p.name}" Phone: "${p.phone}" ID: ${p.id}`);
                });
                
                // Try exact match first
                let matchingPartner = searchResult.data.find((p: any) => 
                  p.name === item.data.name && p.phone === item.data.phone
                );
                
                // If no exact match, try by phone only (name might have been updated)
                if (!matchingPartner) {
                  console.log(`🔍 No exact match, trying by phone only: "${item.data.phone}"`);
                  matchingPartner = searchResult.data.find((p: any) => 
                    p.phone === item.data.phone
                  );
                }
                
                if (matchingPartner) {
                  supabaseUpdateId = matchingPartner.id;
                  console.log(`🎯 Found matching partner with UUID: ${supabaseUpdateId}`);
                  
                  // Store the UUID for future use
                  try {
                    await this.sqliteManager.updateFarmer(item.data.id, { 
                      cloud_id: supabaseUpdateId 
                    } as any);
                    console.log(`💾 Stored found UUID ${supabaseUpdateId} for SQLite ID ${item.data.id}`);
                  } catch (error) {
                    console.warn('⚠️ Failed to store found UUID:', error);
                  }
                } else {
                  console.log(`❌ No matching partner found for name: "${item.data.name}" phone: "${item.data.phone}"`);
                }
              } else {
                console.log(`❌ Failed to get partners from Supabase:`, searchResult.error);
              }
            } catch (error) {
              console.warn('⚠️ Failed to search Supabase partners:', error);
            }
          }
          
          if (supabaseUpdateId) {
            console.log(`🔄 Using Supabase ID for update: ${supabaseUpdateId}`);
            const updateResult = await this.supabaseManager.updatePartner(supabaseUpdateId, item.data);
            console.log(`✅ Farmer updated in Supabase:`, updateResult);
          } else {
            console.error(`❌ No Supabase UUID found for farmer: ${item.data.name}`);
            throw new Error(`No Supabase UUID found for farmer: ${item.data.name}`);
          }
          break;
        case 'delete':
          let supabaseDeleteId = item.data.cloud_id;
          
          // If no cloud_id, try to find by name and phone in Supabase
          if (!supabaseDeleteId) {
            console.log(`🔍 No cloud_id found for delete, searching Supabase by name: ${item.data.name}`);
            try {
              const searchResult = await this.supabaseManager.getPartners();
              if (searchResult.success && searchResult.data) {
                const matchingPartner = searchResult.data.find((p: any) => 
                  p.name === item.data.name && p.phone === item.data.phone
                );
                if (matchingPartner) {
                  supabaseDeleteId = matchingPartner.id;
                  console.log(`🎯 Found matching partner for delete with UUID: ${supabaseDeleteId}`);
                }
              }
            } catch (error) {
              console.warn('⚠️ Failed to search Supabase partners for delete:', error);
            }
          }
          
          if (supabaseDeleteId) {
            console.log(`🔄 Using Supabase ID for delete: ${supabaseDeleteId}`);
            const deleteResult = await this.supabaseManager.deletePartner(supabaseDeleteId);
            console.log(`✅ Farmer deleted from Supabase:`, deleteResult);
          } else {
            console.error(`❌ No Supabase UUID found for delete: ${item.data.name}`);
            throw new Error(`No Supabase UUID found for delete: ${item.data.name}`);
          }
          break;
        default:
          throw new Error(`Unknown farmer operation: ${item.operation}`);
      }
    } catch (error) {
      console.error(`❌ Farmer sync failed for ${item.operation}:`, error);
      throw error;
    }
  }

  private async syncPurchase(item: any): Promise<void> {
    switch (item.operation) {
      case 'create':
        await this.supabaseManager.addPurchase(item.data);
        break;
      case 'update':
        await this.supabaseManager.updatePurchase(item.data.id, item.data);
        break;
      case 'delete':
        await this.supabaseManager.deletePurchase(item.data.id);
        break;
    }
  }

  private async syncInvoice(item: any): Promise<void> {
    switch (item.operation) {
      case 'create':
        await this.supabaseManager.addInvoice(item.data);
        break;
      case 'update':
        await this.supabaseManager.updateInvoice(item.data.id, item.data);
        break;
      case 'delete':
        await this.supabaseManager.deleteInvoice(item.data.id);
        break;
    }
  }

  private async syncPayment(item: any): Promise<void> {
    switch (item.operation) {
      case 'create':
        await this.supabaseManager.addPayment(item.data);
        break;
      case 'update':
        await this.supabaseManager.updatePayment(item.data.id, item.data);
        break;
      case 'delete':
        await this.supabaseManager.deletePayment(item.data.id);
        break;
    }
  }

  private async syncStock(item: any): Promise<void> {
    switch (item.operation) {
      case 'create':
      case 'update':
        await this.supabaseManager.updateStock(item.data.crop_name, item.data.quantity, item.data.rate);
        break;
      case 'delete':
        // Stock delete not implemented in Supabase yet
        console.warn('Stock delete not implemented');
        break;
    }
  }

  /**
   * Manual sync all
   */
  async syncAll(): Promise<DatabaseResult<boolean>> {
    try {
      console.log('🔄 Manual sync triggered...');
      
      // Force online status for manual sync
      this.isOnline = true;
      this.syncStatus.isOnline = true;
      
      if (this.syncQueue.length === 0) {
        console.log('✅ No pending changes to sync');
        return { success: true, data: true };
      }

      console.log(`📝 Found ${this.syncQueue.length} pending changes`);
      await this.backgroundSync();
      
      return { success: true, data: true };
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Force sync now (for testing)
   */
  async forceSyncNow(): Promise<void> {
    console.log('🚀 Force sync triggered...');
    this.isOnline = true;
    await this.backgroundSync();
  }

  /**
   * Debug sync queue
   */
  debugSyncQueue(): void {
    console.log('🔍 Sync Queue Debug:');
    console.log(`📊 Total items: ${this.syncQueue.length}`);
    console.log(`🌐 Online status: ${this.isOnline}`);
    console.log(`🔄 Is syncing: ${this.syncStatus.isSyncing}`);
    
    this.syncQueue.forEach((item, index) => {
      console.log(`${index + 1}. ${item.table} ${item.operation} - Synced: ${item.synced}`);
      console.log(`   Data:`, item.data);
    });
  }

  /**
   * Test Supabase connection
   */
  async testSupabaseConnection(): Promise<void> {
    try {
      console.log('🧪 Testing Supabase connection...');
      
      // Initialize Supabase if not done
      const initResult = await this.supabaseManager.initialize();
      console.log('📡 Supabase init result:', initResult);
      
      // Test partner creation
      const testPartner = {
        name: 'Test Partner ' + Date.now(),
        phone: '03001234567',
        address: 'Test Address',
        role: 'farmer'
      };
      
      console.log('🧪 Creating test partner:', testPartner);
      const result = await this.supabaseManager.addPartner(testPartner);
      console.log('🧪 Test partner result:', result);
      
    } catch (error) {
      console.error('❌ Supabase test failed:', error);
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Clear all data
   */
  async clearAllData(): Promise<DatabaseResult<boolean>> {
    try {
      const result = await this.sqliteManager.clearAllData();
      if (result.success) {
        // Clear sync queue
        this.syncQueue = [];
        this.syncStatus.pendingChanges = 0;
        this.syncStatus.errors = [];
      }
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Network monitoring (simplified)
   */
  private initializeNetworkMonitoring(): void {
    // Simple network check
    this.checkNetworkStatus();
    
    // Check network every 30 seconds
    setInterval(() => {
      this.checkNetworkStatus();
    }, 30000);
  }

  private async checkNetworkStatus(): Promise<void> {
    try {
      // For React Native, assume online for now (can be improved with NetInfo)
      const wasOnline = this.isOnline;
      this.isOnline = true; // Assume online for simplicity
      this.syncStatus.isOnline = this.isOnline;

      console.log(`🌐 Network status: ${this.isOnline ? 'Online' : 'Offline'}`);

      // If came back online and have pending changes, sync
      if (this.isOnline && !wasOnline) {
        console.log('🌐 Back online - triggering sync and real-time subscriptions');
        setTimeout(() => this.backgroundSync(), 2000);
        
        // Setup real-time subscriptions when coming back online
        if (this.realtimeSubscriptions.length === 0) {
          this.setupRealtimeSubscriptions();
        }
      }
    } catch (error) {
      console.error('Network check failed:', error);
      this.isOnline = false;
      this.syncStatus.isOnline = false;
    }
  }

  /**
   * Real-time Subscriptions
   */
  private setupRealtimeSubscriptions(): void {
    console.log('🔄 Setting up real-time subscriptions...');
    
    try {
      // Subscribe to partners table changes
      const partnersSubscription = this.supabaseManager.subscribeToPartners((payload: any) => {
        this.handleRealtimePartnerChange(payload);
      });
      
      if (partnersSubscription) {
        this.realtimeSubscriptions.push(partnersSubscription);
        console.log('✅ Partners real-time subscription active');
      }
      
      // Subscribe to purchases table changes
      const purchasesSubscription = this.supabaseManager.subscribeToPurchases((payload: any) => {
        this.handleRealtimePurchaseChange(payload);
      });
      
      if (purchasesSubscription) {
        this.realtimeSubscriptions.push(purchasesSubscription);
        console.log('✅ Purchases real-time subscription active');
      }
      
      // Subscribe to invoices table changes
      const invoicesSubscription = this.supabaseManager.subscribeToInvoices((payload: any) => {
        this.handleRealtimeInvoiceChange(payload);
      });
      
      if (invoicesSubscription) {
        this.realtimeSubscriptions.push(invoicesSubscription);
        console.log('✅ Invoices real-time subscription active');
      }
      
    } catch (error) {
      console.error('❌ Failed to setup real-time subscriptions:', error);
    }
  }

  private async handleRealtimePartnerChange(payload: any): Promise<void> {
    console.log('🔄 Real-time partner change:', payload.eventType, payload.new?.id);
    
    try {
      switch (payload.eventType) {
        case 'INSERT':
          await this.handleRealtimePartnerInsert(payload.new);
          break;
        case 'UPDATE':
          await this.handleRealtimePartnerUpdate(payload.new);
          break;
        case 'DELETE':
          await this.handleRealtimePartnerDelete(payload.old);
          break;
      }
    } catch (error) {
      console.error('❌ Error handling real-time partner change:', error);
    }
  }

  private async handleRealtimePartnerInsert(newPartner: any): Promise<void> {
    console.log('➕ Real-time partner insert:', newPartner.name);
    
    // Check if partner already exists locally (by cloud_id)
    const existingPartner = await this.sqliteManager.getFarmers();
    const localPartner = existingPartner.data?.find((p: any) => p.cloud_id === newPartner.id);
    
    if (!localPartner) {
      // Add new partner to local database
      const partnerData = {
        name: newPartner.name,
        phone: newPartner.phone || '',
        address: newPartner.address || '',
        role: newPartner.role || 'farmer'
      };
      
      const result = await this.sqliteManager.addFarmer(partnerData);
      if (result.success && result.data) {
        // Store the cloud_id for future sync
        await this.sqliteManager.updateFarmer(result.data.id, { 
          cloud_id: newPartner.id 
        } as any);
        console.log('✅ Real-time partner added locally:', newPartner.name);
      }
    }
  }

  private async handleRealtimePartnerUpdate(updatedPartner: any): Promise<void> {
    console.log('📝 Real-time partner update:', updatedPartner.name);
    
    // Find local partner by cloud_id
    const existingPartners = await this.sqliteManager.getFarmers();
    const localPartner = existingPartners.data?.find((p: any) => p.cloud_id === updatedPartner.id);
    
    if (localPartner) {
      // Update local partner
      const updateData = {
        name: updatedPartner.name,
        phone: updatedPartner.phone || '',
        address: updatedPartner.address || '',
        role: updatedPartner.role || 'farmer'
      };
      
      await this.sqliteManager.updateFarmer(localPartner.id, updateData);
      console.log('✅ Real-time partner updated locally:', updatedPartner.name);
    }
  }

  private async handleRealtimePartnerDelete(deletedPartner: any): Promise<void> {
    console.log('🗑️ Real-time partner delete:', deletedPartner.id);
    
    // Find local partner by cloud_id
    const existingPartners = await this.sqliteManager.getFarmers();
    const localPartner = existingPartners.data?.find((p: any) => p.cloud_id === deletedPartner.id);
    
    if (localPartner) {
      // Delete from local database
      await this.sqliteManager.deleteFarmer(localPartner.id);
      console.log('✅ Real-time partner deleted locally:', deletedPartner.name || deletedPartner.id);
    }
  }

  private async handleRealtimePurchaseChange(payload: any): Promise<void> {
    console.log('🔄 Real-time purchase change:', payload.eventType);
    // TODO: Implement purchase real-time handling
  }

  private async handleRealtimeInvoiceChange(payload: any): Promise<void> {
    console.log('🔄 Real-time invoice change:', payload.eventType);
    // TODO: Implement invoice real-time handling
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Simple Hybrid Manager');
    
    // Unsubscribe from all real-time subscriptions
    this.realtimeSubscriptions.forEach(subscription => {
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    });
    this.realtimeSubscriptions = [];
    console.log('🔄 Real-time subscriptions cleaned up');
  }
}

// Export singleton instance getter
export const getSimpleHybridManager = SimpleHybridManager.getInstance;
