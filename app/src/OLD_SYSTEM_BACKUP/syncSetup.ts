import { supabase } from '../config/supabase'

/**
 * Sync Setup Utilities
 * Helper functions to verify and setup real-time sync
 */

export class SyncSetup {
  /**
   * Check if Supabase tables exist
   */
  static async checkSupabaseTables(): Promise<{
    partners: boolean
    purchases: boolean
    invoices: boolean
    allReady: boolean
  }> {
    try {
      const results = {
        partners: false,
        purchases: false,
        invoices: false,
        allReady: false
      }

      // Try to query each table
      try {
        await supabase.from('partners').select('id').limit(1)
        results.partners = true
      } catch (error) {
        console.log('❌ Partners table missing')
      }

      try {
        await supabase.from('purchases').select('id').limit(1)
        results.purchases = true
      } catch (error) {
        console.log('❌ Purchases table missing')
      }

      try {
        await supabase.from('invoices').select('id').limit(1)
        results.invoices = true
      } catch (error) {
        console.log('❌ Invoices table missing')
      }

      results.allReady = results.partners && results.purchases && results.invoices

      return results
    } catch (error) {
      console.error('❌ Failed to check Supabase tables:', error)
      return {
        partners: false,
        purchases: false,
        invoices: false,
        allReady: false
      }
    }
  }

  /**
   * Test real-time connection
   */
  static async testRealtimeConnection(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('❌ No authenticated user')
        return false
      }

      // Test realtime subscription
      const channel = supabase
        .channel('sync-test')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'partners',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('✅ Realtime test successful:', payload.eventType)
          }
        )
        .subscribe()

      // Clean up after test
      setTimeout(() => {
        supabase.removeChannel(channel)
      }, 5000)

      console.log('✅ Realtime connection test started')
      return true
    } catch (error) {
      console.error('❌ Realtime test failed:', error)
      return false
    }
  }

  /**
   * Create a test partner to verify sync
   */
  static async createTestPartner(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('❌ No authenticated user')
        return false
      }

      const testPartner = {
        name: `Test Sync ${Date.now()}`,
        phone: '1234567890',
        address: 'Test Address',
        role: 'farmer' as const,
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('partners')
        .insert([testPartner])
        .select()

      if (error) {
        console.error('❌ Failed to create test partner:', error)
        return false
      }

      console.log('✅ Test partner created:', data[0]?.name)
      
      // Clean up test partner after 10 seconds
      setTimeout(async () => {
        if (data[0]?.id) {
          await supabase
            .from('partners')
            .delete()
            .eq('id', data[0].id)
          console.log('🧹 Test partner cleaned up')
        }
      }, 10000)

      return true
    } catch (error) {
      console.error('❌ Test partner creation failed:', error)
      return false
    }
  }

  /**
   * Complete sync system check
   */
  static async performFullCheck(): Promise<{
    tablesExist: boolean
    realtimeWorks: boolean
    syncReady: boolean
    issues: string[]
  }> {
    console.log('🔍 Starting complete sync system check...')
    
    const issues: string[] = []
    
    // Check tables
    const tables = await this.checkSupabaseTables()
    if (!tables.allReady) {
      if (!tables.partners) issues.push('Partners table missing in Supabase')
      if (!tables.purchases) issues.push('Purchases table missing in Supabase')
      if (!tables.invoices) issues.push('Invoices table missing in Supabase')
    }

    // Check realtime
    const realtimeWorks = await this.testRealtimeConnection()
    if (!realtimeWorks) {
      issues.push('Realtime connection failed')
    }

    // Test sync
    let syncReady = false
    if (tables.allReady) {
      syncReady = await this.createTestPartner()
      if (!syncReady) {
        issues.push('Sync test failed - check permissions')
      }
    }

    const result = {
      tablesExist: tables.allReady,
      realtimeWorks,
      syncReady: tables.allReady && syncReady,
      issues
    }

    // Log results
    console.log('📊 Sync System Check Results:')
    console.log(`✅ Tables exist: ${result.tablesExist}`)
    console.log(`✅ Realtime works: ${result.realtimeWorks}`)
    console.log(`✅ Sync ready: ${result.syncReady}`)
    
    if (result.issues.length > 0) {
      console.log('❌ Issues found:')
      result.issues.forEach(issue => console.log(`  - ${issue}`))
    }

    return result
  }

  /**
   * Show setup instructions
   */
  static showSetupInstructions(): void {
    console.log(`
🚨 REAL-TIME SYNC SETUP REQUIRED

Your system needs setup to enable real-time sync:

1. 📋 CREATE SUPABASE TABLES:
   - Open Supabase Dashboard
   - Go to SQL Editor
   - Run: src/database/supabase-complete-schema.sql

2. 🔄 ENABLE REALTIME:
   - Go to Database → Replication
   - Enable realtime for: partners, purchases, invoices

3. 📱 RESTART APP:
   - To run SQLite migration 9
   - Adds cloud_id columns

4. 🧪 TEST SYNC:
   - Use SyncSetup.performFullCheck()

📖 Full guide: REAL-TIME-SYNC-SETUP.md
    `)
  }
}

// Global debug function
if (__DEV__) {
  // @ts-ignore - Global is available in React Native
  global.syncSetup = SyncSetup
  console.log('🔧 SyncSetup available globally: syncSetup.performFullCheck()')
}
