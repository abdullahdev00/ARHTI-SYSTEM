/**
 * Expo Go Database Debugger
 * Simple debugging solution for Expo Go environment
 */

// import { manager } from '../database/sqliteDatabase'; // DEPRECATED
import { getSimpleHybridManager } from '../database/SimpleHybridManager';

class ExpoDatabaseDebugger {
  private isEnabled = __DEV__;

  // Console-based database inspection
  async inspectDatabase() {
    if (!this.isEnabled) return;

    try {
      console.log('🗄️ === DATABASE INSPECTION ===');
      
      const manager = await getSimpleHybridManager();
      
      // Get all farmers
      const farmersResult = await manager.getFarmers();
      console.log('👥 Farmers:', farmersResult.data?.length || 0);
      console.table(farmersResult.data?.slice(0, 5)); // Show first 5
      
      // Get all purchases  
      const purchasesResult = await manager.getPurchases();
      console.log('🛒 Purchases:', purchasesResult.data?.length || 0);
      console.table(purchasesResult.data?.slice(0, 5));
      
      // Get all invoices
      const invoicesResult = await manager.getInvoices();
      console.log('📄 Invoices:', invoicesResult.data?.length || 0);
      console.table(invoicesResult.data?.slice(0, 5));
      
      // Get sync status
      const syncStatus = manager.getSyncStatus();
      console.log('📊 Sync Status:', syncStatus);
      
      console.log('🗄️ === END INSPECTION ===');
    } catch (error) {
      console.error('❌ Database inspection failed:', error);
    }
  }

  // Execute custom query with console output
  async executeQuery(query: string) {
    if (!this.isEnabled) return;

    try {
      console.log(`🔍 Executing Query: ${query}`);
      
      // Note: We need to add this method back to manager
      // For now, we'll use a workaround
      console.log('⚠️ Custom query execution not available in current setup');
      console.log('💡 Use the database export feature in Settings instead');
      
    } catch (error) {
      console.error('❌ Query execution failed:', error);
    }
  }

  // Real-time database monitoring
  async startMonitoring() {
    if (!this.isEnabled) return;

    console.log('🔄 Starting database monitoring...');
    
    // Monitor every 10 seconds
    const interval = setInterval(async () => {
      try {
        const manager = await getSimpleHybridManager();
        const syncStatus = manager.getSyncStatus();
        console.log('📊 DB Stats Update:', {
          syncStatus: syncStatus,
          timestamp: new Date().toLocaleTimeString()
        });
      } catch (error) {
        console.error('❌ Monitoring error:', error);
      }
    }, 10000);

    // Stop monitoring after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      console.log('⏹️ Database monitoring stopped');
    }, 300000);
  }

  // Export database for external viewing
  async exportForViewing() {
    if (!this.isEnabled) return;

    try {
      console.log('📤 Exporting database for viewing...');
      
      const manager = await getSimpleHybridManager();
      
      // Get all data
      const [farmers, purchases, invoices] = await Promise.all([
        manager.getFarmers(),
        manager.getPurchases(), 
        manager.getInvoices()
      ]);

      const exportData = {
        timestamp: new Date().toISOString(),
        farmers: farmers.data || [],
        purchases: purchases.data || [],
        invoices: invoices.data || []
      };

      console.log('📋 Database Export (Copy this JSON):');
      console.log(JSON.stringify(exportData, null, 2));
      
      return exportData;
    } catch (error) {
      console.error('❌ Export failed:', error);
    }
  }

  // Quick table overview
  async tableOverview() {
    if (!this.isEnabled) return;

    try {
      const manager = await getSimpleHybridManager();
      
      const tables = [
        { name: 'farmers', method: () => manager.getFarmers() },
        { name: 'purchases', method: () => manager.getPurchases() },
        { name: 'invoices', method: () => manager.getInvoices() }
      ];

      console.log('📋 === TABLE OVERVIEW ===');
      
      for (const table of tables) {
        try {
          const result = await table.method();
          const count = result.data?.length || 0;
          const sample = result.data?.[0] || null;
          
          console.log(`\n📊 ${table.name.toUpperCase()}:`);
          console.log(`   Records: ${count}`);
          if (sample) {
            console.log(`   Columns: ${Object.keys(sample).join(', ')}`);
            console.log(`   Sample:`, sample);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log(`   ❌ Error loading ${table.name}:`, errorMessage);
        }
      }
      
      console.log('\n📋 === END OVERVIEW ===');
    } catch (error) {
      console.error('❌ Table overview failed:', error);
    }
  }
}

// Create singleton instance
export const expoDatabaseDebugger = new ExpoDatabaseDebugger();

// Global access for console debugging
if (__DEV__) {
  try {
    (globalThis as any).dbDebugger = expoDatabaseDebugger;
    (globalThis as any).inspectDB = () => expoDatabaseDebugger.inspectDatabase();
    (globalThis as any).exportDB = () => expoDatabaseDebugger.exportForViewing();
    (globalThis as any).tableOverview = () => expoDatabaseDebugger.tableOverview();
    (globalThis as any).monitorDB = () => expoDatabaseDebugger.startMonitoring();
    
    console.log('🗄️ Database debugger available globally:');
    console.log('   - inspectDB() - Full database inspection');
    console.log('   - exportDB() - Export database as JSON');
    console.log('   - tableOverview() - Quick table overview');
    console.log('   - monitorDB() - Start real-time monitoring');
    console.log('   - dbDebugger - Full debugger object');
  } catch (error) {
    console.log('🗄️ Database debugger initialized (global assignment failed)');
  }
}
