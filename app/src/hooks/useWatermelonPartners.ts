import { useEffect, useState, useCallback } from 'react'
import { database } from '../database'
import { supabase } from '../config/supabase'
import NetInfo from '@react-native-community/netinfo'

// Simple UUID v4 generator for React Native
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

export interface Partner {
    id: string
    name: string
    phone?: string
    address?: string
    role: string
    createdAt?: number
    updatedAt?: number
}

/**
 * ✅ REACTIVE WATERMELON PARTNERS HOOK
 * - Loads partners from WatermelonDB (instant)
 * - Auto-syncs to Supabase in background (if online)
 * - Real-time updates when partners change
 * - Handles create/update/delete locally first
 */
export const useWatermelonPartners = () => {
    const [partners, setPartners] = useState<Partner[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // ✅ Reactive Subscription to WatermelonDB
    useEffect(() => {
        const partnersCollection = database.get('partners')
        const query = partnersCollection.query()

        // Subscribe to changes
        const subscription = query.observe().subscribe(data => {
            // console.log('🔄 Partners updated from WatermelonDB:', data.length)
            setPartners(data as unknown as Partner[])
            setIsLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    // Create partner locally (instant)
    const createPartner = useCallback(async (partnerData: Omit<Partner, 'id'>) => {
        try {
            console.log('➕ Creating partner locally:', partnerData.name)

            // Generate UUID for Supabase compatibility
            const partnerId = generateUUID()

            const partnersTable = database.get('partners')
            let newPartner: any

            await database.write(async () => {
                newPartner = await partnersTable.create((record: any) => {
                    record._raw.id = partnerId
                    record.name = partnerData.name
                    record.phone = partnerData.phone || ''
                    record.address = partnerData.address || ''
                    record.role = partnerData.role
                    record.createdAt = Date.now()
                    record.updatedAt = Date.now()
                })
            })

            console.log('✅ Partner created locally:', newPartner.id)

            // Sync to Supabase in background (if online)
            const state = await NetInfo.fetch()
            if (state.isConnected && state.isInternetReachable) {
                console.log('📤 Syncing partner to Supabase...')
                syncPartnerToSupabase(newPartner)
            } else {
                console.log('📴 Offline - partner will sync when online')
            }

            return newPartner
        } catch (error) {
            console.error('❌ Error creating partner:', error)
            throw error
        }
    }, [])

    // Update partner locally (instant)
    const updatePartner = useCallback(async (partnerId: string, updates: Partial<Partner>) => {
        try {
            console.log('✏️ Updating partner locally:', partnerId)

            const partnersTable = database.get('partners')
            const partner = await partnersTable.find(partnerId)

            await database.write(async () => {
                await partner.update((record: any) => {
                    if (updates.name) record.name = updates.name
                    if (updates.phone !== undefined) record.phone = updates.phone
                    if (updates.address !== undefined) record.address = updates.address
                    if (updates.role) record.role = updates.role
                    record.updatedAt = Date.now()
                })
            })

            console.log('✅ Partner updated locally')

            // Sync to Supabase in background
            const state = await NetInfo.fetch()
            if (state.isConnected && state.isInternetReachable) {
                console.log('📤 Syncing update to Supabase...')
                syncPartnerToSupabase(partner)
            }

            return partner
        } catch (error) {
            console.error('❌ Error updating partner:', error)
            throw error
        }
    }, [])

    // Delete partner locally (instant)
    const deletePartner = useCallback(async (partnerId: string) => {
        try {
            console.log('🗑️ Deleting partner locally:', partnerId)

            const partnersTable = database.get('partners')
            const partner = await partnersTable.find(partnerId)

            await database.write(async () => {
                await partner.destroyPermanently()
            })

            console.log('✅ Partner deleted locally')

            // Sync deletion to Supabase in background
            const state = await NetInfo.fetch()
            if (state.isConnected && state.isInternetReachable) {
                console.log('📤 Syncing deletion to Supabase...')
                const { error } = await supabase
                    .from('partners')
                    .delete()
                    .eq('id', partnerId)

                if (error) {
                    console.error('❌ Error deleting from Supabase:', error)
                } else {
                    console.log('✅ Partner deleted from Supabase')
                }
            }
        } catch (error) {
            console.error('❌ Error deleting partner:', error)
            throw error
        }
    }, [])

    return {
        partners,
        isLoading,
        createPartner,
        updatePartner,
        deletePartner,
        reloadPartners: async () => { } // No-op as we are now reactive
    }
}

// Helper function to sync partner to Supabase
async function syncPartnerToSupabase(partner: any) {
    try {
        // Get current user from Supabase auth
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            console.log('❌ No user logged in - skipping sync')
            return
        }

        const { error } = await supabase
            .from('partners')
            .upsert({
                id: partner.id,
                user_id: user.id,
                name: partner.name,
                phone: partner.phone,
                address: partner.address,
                role: partner.role,
                created_at: new Date(partner.createdAt).toISOString(),
                updated_at: new Date(partner.updatedAt).toISOString()
            })

        if (error) {
            console.error('❌ Error syncing to Supabase:', error)
        } else {
            console.log('✅ Partner synced to Supabase:', partner.id)
        }
    } catch (error) {
        console.error('❌ Sync error:', error)
    }
}
