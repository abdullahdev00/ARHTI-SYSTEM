import { observable } from '@legendapp/state'
import { supabase } from '../config/supabase'

// Types for our data (compatible with both SQLite and Supabase)
export interface Partner {
  id: string              // UUID for Supabase, will be generated
  name: string
  phone?: string
  address?: string
  role: 'farmer' | 'buyer'
  user_id: string         // Required for Supabase RLS
  created_at: string
  updated_at: string
  
  // For SQLite sync mapping
  local_id?: number       // SQLite integer ID
  cloud_id?: string       // Supabase UUID for sync
}

export interface Purchase {
  id: string              // UUID for Supabase
  partner_id: string      // UUID reference to partner
  crop_name: string
  quantity: number
  rate: number
  total_amount: number
  purchase_date: string
  
  // Additional fields
  bag_quantity?: number
  weight_per_bag?: number
  bag_variant_id?: number
  transaction_type?: string
  
  user_id: string         // Required for Supabase RLS
  created_at: string
  updated_at: string
  
  // For SQLite sync mapping
  local_id?: number       // SQLite integer ID
  cloud_id?: string       // Supabase UUID for sync
}

export interface Invoice {
  id: string              // UUID for Supabase
  partner_id: string      // UUID reference to partner
  total_amount: number
  status: 'pending' | 'paid' | 'partial'
  invoice_date: string
  
  // Additional fields
  transaction_type?: string
  
  user_id: string         // Required for Supabase RLS
  created_at: string
  updated_at: string
  
  // For SQLite sync mapping
  local_id?: number       // SQLite integer ID
  cloud_id?: string       // Supabase UUID for sync
}

// Observable stores
export const partnersStore = observable<Record<string, Partner>>({})
export const purchasesStore = observable<Record<string, Purchase>>({})
export const invoicesStore = observable<Record<string, Invoice>>({})

// App state
export const appState = observable({
  isLoading: false,
  isInitialized: false,
  isOnline: true,
  user: null as any,
  searchQuery: '',
  selectedFilters: {} as Record<string, any>,
  
  // Sync status
  syncStatus: {
    partners: 'idle' as 'idle' | 'syncing' | 'error',
    purchases: 'idle' as 'idle' | 'syncing' | 'error',
    invoices: 'idle' as 'idle' | 'syncing' | 'error'
  }
})

// Get current user ID
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

// Generate UUID
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Actions for Partners
export const partnerActions = {
  // Load all partners from Supabase
  loadPartners: async () => {
    try {
      appState.syncStatus.partners.set('syncing')
      const userId = await getCurrentUserId()
      if (!userId) return

      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Clear and populate store
      partnersStore.set({})
      data?.forEach(partner => {
        partnersStore[partner.id].set(partner)
      })

      appState.syncStatus.partners.set('idle')
      console.log(`✅ Loaded ${data?.length || 0} partners`)
    } catch (error) {
      console.error('❌ Failed to load partners:', error)
      appState.syncStatus.partners.set('error')
    }
  },

  // Add new partner
  addPartner: async (partner: Omit<Partner, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const userId = await getCurrentUserId()
      if (!userId) return

      const id = generateId()
      const newPartner: Partner = {
        ...partner,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: userId
      }

      // Optimistic update - add to local store first
      partnersStore[id].set(newPartner)

      // Sync to Supabase
      const { error } = await supabase
        .from('partners')
        .insert([newPartner])

      if (error) {
        // Revert on error
        partnersStore[id].delete()
        throw error
      }

      console.log('✅ Partner added and synced:', newPartner.name)
      return newPartner
    } catch (error) {
      console.error('❌ Failed to add partner:', error)
      throw error
    }
  },

  // Update partner
  updatePartner: async (id: string, updates: Partial<Partner>) => {
    try {
      const partner = partnersStore[id].peek()
      if (!partner) return

      const updatedPartner = {
        ...partner,
        ...updates,
        updated_at: new Date().toISOString()
      }

      // Optimistic update
      partnersStore[id].set(updatedPartner)

      // Sync to Supabase
      const { error } = await supabase
        .from('partners')
        .update(updatedPartner)
        .eq('id', id)

      if (error) {
        // Revert on error
        partnersStore[id].set(partner)
        throw error
      }

      console.log('✅ Partner updated and synced:', updatedPartner.name)
      return updatedPartner
    } catch (error) {
      console.error('❌ Failed to update partner:', error)
      throw error
    }
  },

  // Delete partner
  deletePartner: async (id: string) => {
    try {
      const partner = partnersStore[id].peek()
      if (!partner) return

      // Optimistic delete
      partnersStore[id].delete()

      // Delete from Supabase
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id)

      if (error) {
        // Restore on error
        partnersStore[id].set(partner)
        throw error
      }

      console.log('✅ Partner deleted and synced:', partner.name)
    } catch (error) {
      console.error('❌ Failed to delete partner:', error)
      throw error
    }
  }
}

// Actions for Purchases
export const purchaseActions = {
  loadPurchases: async () => {
    try {
      appState.syncStatus.purchases.set('syncing')
      const userId = await getCurrentUserId()
      if (!userId) return

      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          partner:partners(name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      purchasesStore.set({})
      data?.forEach(purchase => {
        purchasesStore[purchase.id].set({
          ...purchase,
          partnerName: purchase.partner?.name || 'Unknown'
        })
      })

      appState.syncStatus.purchases.set('idle')
      console.log(`✅ Loaded ${data?.length || 0} purchases`)
    } catch (error) {
      console.error('❌ Failed to load purchases:', error)
      appState.syncStatus.purchases.set('error')
    }
  },

  addPurchase: async (purchase: Omit<Purchase, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const userId = await getCurrentUserId()
      if (!userId) return

      const id = generateId()
      const newPurchase: Purchase = {
        ...purchase,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: userId
      }

      purchasesStore[id].set(newPurchase)

      const { error } = await supabase
        .from('purchases')
        .insert([newPurchase])

      if (error) {
        purchasesStore[id].delete()
        throw error
      }

      console.log('✅ Purchase added and synced')
      return newPurchase
    } catch (error) {
      console.error('❌ Failed to add purchase:', error)
      throw error
    }
  }
}

// App initialization
export const appActions = {
  initialize: async () => {
    appState.isLoading.set(true)
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      appState.user.set(user)

      if (user) {
        // Load all data
        await Promise.all([
          partnerActions.loadPartners(),
          purchaseActions.loadPurchases()
        ])
      }

      appState.isInitialized.set(true)
      console.log('✅ Legend State initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Legend State:', error)
    } finally {
      appState.isLoading.set(false)
    }
  },

  // Setup real-time subscriptions
  setupRealtime: () => {
    const userId = appState.user.peek()?.id
    if (!userId) return

    // Subscribe to partners changes
    const partnersChannel = supabase
      .channel('partners-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partners',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          console.log('🔄 Partners real-time event:', payload.eventType)
          
          switch (payload.eventType) {
            case 'INSERT':
              if (payload.new) {
                partnersStore[payload.new.id].set(payload.new as Partner)
              }
              break
            case 'UPDATE':
              if (payload.new) {
                partnersStore[payload.new.id].set(payload.new as Partner)
              }
              break
            case 'DELETE':
              if (payload.old) {
                partnersStore[payload.old.id].delete()
              }
              break
          }
        }
      )
      .subscribe()

    console.log('✅ Real-time subscriptions active')
    return partnersChannel
  }
}
