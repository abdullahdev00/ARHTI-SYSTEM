import * as SQLite from 'expo-sqlite';

/**
 * Database Reset Utility
 * Use this to completely reset the database when migration issues occur
 */
export class DatabaseReset {
    private static dbName = 'arhti_system.db';

    /**
     * Reset database by dropping all tables and recreating schema
     * This is safer than file deletion and works across all platforms
     */
    static async resetDatabase(): Promise<boolean> {
        try {
            console.log('🗑️ Starting database reset...');

            const db = SQLite.openDatabaseSync(this.dbName);

            // Get all table names
            const tables = await db.getAllAsync(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
            `);

            console.log('📋 Found tables:', tables.map((t: any) => t.name).join(', '));

            // Drop all tables
            for (const table of tables) {
                const tableName = (table as any).name;
                await db.execAsync(`DROP TABLE IF EXISTS ${tableName}`);
                console.log(`✅ Dropped table: ${tableName}`);
            }

            // Drop all indexes
            const indexes = await db.getAllAsync(`
                SELECT name FROM sqlite_master 
                WHERE type='index' AND name NOT LIKE 'sqlite_%'
            `);

            for (const index of indexes) {
                const indexName = (index as any).name;
                await db.execAsync(`DROP INDEX IF EXISTS ${indexName}`);
                console.log(`✅ Dropped index: ${indexName}`);
            }

            console.log('✅ Database reset completed - all tables and indexes dropped');
            console.log('ℹ️ App will recreate fresh database on next restart');

            db.closeSync();
            return true;
        } catch (error) {
            console.error('❌ Database reset failed:', error);
            return false;
        }
    }

    /**
     * Check database schema and report current state
     */
    static async inspectDatabase(): Promise<void> {
        try {
            const db = SQLite.openDatabaseSync(this.dbName);

            console.log('🔍 Database Schema Inspection:');

            // Get all tables
            const tables = await db.getAllAsync(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);

            console.log('📋 Tables:', tables.map((t: any) => t.name).join(', '));

            // Check database version
            try {
                const version = await db.getFirstAsync(`
          SELECT value FROM database_info WHERE key = 'version'
        `);
                console.log('📊 Database Version:', version ? (version as any).value : 'Unknown');
            } catch (error) {
                console.log('📊 Database Version: No version info table');
            }

            // Check for problematic columns
            const problemTables = ['partners', 'purchases', 'invoices'];

            for (const tableName of problemTables) {
                try {
                    const columns = await db.getAllAsync(`PRAGMA table_info(${tableName})`);
                    const columnNames = columns.map((col: any) => col.name);

                    console.log(`📋 ${tableName} columns:`, columnNames.join(', '));

                    // Check for specific problematic columns
                    const hasCloudId = columnNames.includes('cloud_id');
                    const hasTransactionType = columnNames.includes('transaction_type');

                    console.log(`   - cloud_id: ${hasCloudId ? '✅' : '❌'}`);
                    console.log(`   - transaction_type: ${hasTransactionType ? '✅' : '❌'}`);

                } catch (error) {
                    console.log(`❌ Could not inspect table ${tableName}:`, error);
                }
            }

            db.closeSync();
        } catch (error) {
            console.error('❌ Database inspection failed:', error);
        }
    }

    /**
     * Force database to specific version (for testing)
     */
    static async setDatabaseVersion(version: number): Promise<boolean> {
        try {
            const db = SQLite.openDatabaseSync(this.dbName);

            await db.execAsync(`
        INSERT OR REPLACE INTO database_info (key, value, updated_at) 
        VALUES ('version', '${version}', datetime('now'))
      `);

            console.log(`✅ Database version set to ${version}`);
            db.closeSync();
            return true;
        } catch (error) {
            console.error('❌ Failed to set database version:', error);
            return false;
        }
    }
}

// Database debug utility class

// Make functions available globally in development
if (__DEV__) {
    console.log('🛠️ Database debug functions available:');
    console.log('   - DatabaseReset.resetDatabase() - Reset entire database');
    console.log('   - DatabaseReset.inspectDatabase() - Inspect database schema');
    console.log('   - DatabaseReset.setDatabaseVersion(n) - Set database version');
}
