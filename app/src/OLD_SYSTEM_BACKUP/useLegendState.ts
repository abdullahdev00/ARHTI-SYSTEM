import { useSelector } from '@legendapp/state/react'
import { partnersStore, purchasesStore, invoicesStore, appState, partnerActions, purchaseActions, appActions } from '../stores/legendStore'

/**
 * Partners Hook - Complete sync with database
 */
export const usePartners = () => {
  // Get partners as array (automatically reactive)
  const partnersList = useSelector(() => {
    const partnersObj = partnersStore.get()
    return Object.values(partnersObj)
  })

  // Get farmers only
  const farmers = useSelector(() => {
    const partnersObj = partnersStore.get()
    return Object.values(partnersObj).filter(p => p.role === 'farmer')
  })

  // Get buyers only
  const buyers = useSelector(() => {
    const partnersObj = partnersStore.get()
    return Object.values(partnersObj).filter(p => p.role === 'buyer')
  })

  // Sync status
  const syncStatus = useSelector(() => appState.syncStatus.partners.get())

  return {
    // Data (automatically reactive)
    partnersList,
    farmers,
    buyers,
    
    // Status
    syncStatus,
    isLoading: syncStatus === 'syncing',
    hasError: syncStatus === 'error',
    
    // Actions (with automatic sync)
    loadPartners: partnerActions.loadPartners,
    addPartner: partnerActions.addPartner,
    updatePartner: partnerActions.updatePartner,
    deletePartner: partnerActions.deletePartner
  }
}

/**
 * Single Partner Hook
 */
export const usePartner = (id: string) => {
  const partner = useSelector(() => partnersStore[id].get())
  
  return {
    partner,
    update: (updates: any) => partnerActions.updatePartner(id, updates),
    delete: () => partnerActions.deletePartner(id),
    exists: !!partner
  }
}

/**
 * Purchases Hook - Complete sync with database
 */
export const usePurchases = () => {
  const purchasesList = useSelector(() => {
    const purchasesObj = purchasesStore.get()
    return Object.values(purchasesObj)
  })

  const syncStatus = useSelector(() => appState.syncStatus.purchases.get())

  // Get purchases by partner
  const getPurchasesByPartner = (partnerId: string) => {
    return useSelector(() => {
      const purchasesObj = purchasesStore.get()
      return Object.values(purchasesObj).filter(p => p.partner_id === partnerId)
    })
  }

  return {
    // Data
    purchasesList,
    getPurchasesByPartner,
    
    // Status
    syncStatus,
    isLoading: syncStatus === 'syncing',
    hasError: syncStatus === 'error',
    
    // Actions
    loadPurchases: purchaseActions.loadPurchases,
    addPurchase: purchaseActions.addPurchase
  }
}

/**
 * App State Hook - Global app state
 */
export const useAppState = () => {
  const isLoading = appState.isLoading.get()
  const isInitialized = appState.isInitialized.get()
  const isOnline = appState.isOnline.get()
  const user = appState.user.get()

  return {
    isLoading,
    isInitialized,
    isOnline,
    user,
    initialize: appActions.initialize,
    setupRealtime: appActions.setupRealtime,
    clearAllData: async () => {
      // Clear all observable stores
      partnersStore.set({})
      purchasesStore.set({})
      invoicesStore.set({})
      console.log('✅ All local data cleared')
    },
    resetApp: async () => {
      // Reset entire app state
      partnersStore.set({})
      purchasesStore.set({})
      invoicesStore.set({})
      appState.isLoading.set(false)
      appState.isInitialized.set(false)
      appState.isOnline.set(false)
      appState.user.set(null)
      appState.searchQuery.set('')
      console.log('✅ App reset to initial state')
    }
  }
}

/**
 * Search Hook
 */
export const useSearch = () => {
  const searchQuery = useSelector(() => appState.searchQuery.get())

  const searchPartners = (query: string) => {
    return useSelector(() => {
      const partnersObj = partnersStore.get()
      const partners = Object.values(partnersObj)
      
      if (!query) return partners
      
      const lowerQuery = query.toLowerCase()
      return partners.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) ||
        p.phone?.toLowerCase().includes(lowerQuery) ||
        p.address?.toLowerCase().includes(lowerQuery)
      )
    })
  }

  return {
    searchQuery,
    searchPartners,
    setSearchQuery: (query: string) => appState.searchQuery.set(query)
  }
}

/**
 * Statistics Hook - Real-time stats
 */
export const useStats = () => {
  const partners = partnersStore.get()
  const purchases = purchasesStore.get()
  const invoices = invoicesStore.get()

  // Calculate stats from observable data
  const totalPartners = Object.keys(partners).length
  const totalFarmers = Object.values(partners).filter((p: any) => p.role === 'farmer').length
  const totalBuyers = Object.values(partners).filter((p: any) => p.role === 'buyer').length
  
  const totalPurchases = Object.keys(purchases).length
  const totalPurchaseAmount = Object.values(purchases).reduce((sum: number, p: any) => sum + p.total_amount, 0)
  
  const totalInvoices = Object.keys(invoices).length
  const pendingInvoices = Object.values(invoices).filter((i: any) => i.status === 'pending').length
  const paidInvoices = Object.values(invoices).filter((i: any) => i.status === 'paid').length

  return {
    totalPartners,
    totalFarmers,
    totalBuyers,
    totalPurchases,
    totalPurchaseAmount,
    totalInvoices,
    pendingInvoices,
    paidInvoices
  }
}
