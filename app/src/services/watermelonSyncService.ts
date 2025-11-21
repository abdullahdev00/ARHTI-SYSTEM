import { synchronize } from '@nozbe/watermelondb/sync'
import { database } from '../database'
import { supabase } from '../config/supabase'
import NetInfo from '@react-native-community/netinfo'

/**
 * ✅ ROBUST WATERMELONDB SYNC SERVICE
 * - Uses WatermelonDB's built-in Sync Engine
 * - Efficient Delta Sync (only changes)
 * - Handles Offline Queueing automatically
 * - Conflict Resolution
 */

export const sync = async () => {
    const state = await NetInfo.fetch()
    if (!state.isConnected || !state.isInternetReachable) {
        console.log('📴 Offline - skipping sync')
        return
    }

    try {
        await synchronize({
            database,
            sendCreatedAsUpdated: true, // ✅ Fix warnings about non-existent records
            pullChanges: async ({ lastPulledAt, schemaVersion }) => {
                console.log('📥 Pulling changes from Supabase...', { lastPulledAt })

                const timestamp = lastPulledAt ? new Date(lastPulledAt).toISOString() : new Date(0).toISOString()

                // Helper to fetch changes for a table
                const fetchChanges = async (table: string) => {
                    const { data, error } = await supabase
                        .from(table)
                        .select('*')
                        .gt('updated_at', timestamp)

                    if (error) throw error
                    return data || []
                }

                // Fetch changes for all tables in parallel
                const [partners, roles, purchases, stockItems, categories] = await Promise.all([
                    fetchChanges('partners'),
                    fetchChanges('roles'),
                    fetchChanges('purchases'),
                    fetchChanges('stock_items'),
                    fetchChanges('categories'),
                ])

                // Helper to categorize changes into created/updated with table-specific mapping
                const processChanges = (items: any[], tableName: string) => ({
                    created: [],
                    updated: items.map(item => {
                        const baseFields = {
                            id: item.id,
                            ...mapFromSupabase(item, tableName),
                        }

                        // Table-specific field mapping
                        switch (tableName) {
                            case 'partners':
                                return { ...baseFields, name: item.name, phone: item.phone, address: item.address, role: item.role }
                            case 'roles':
                                return { ...baseFields, name: item.name, icon: item.icon, color: item.color }
                            case 'purchases':
                                return { ...baseFields, partner_id: item.partner_id, crop_name: item.crop_name, quantity: item.quantity, rate: item.rate, total_amount: item.total_amount, purchase_date: item.purchase_date }
                            case 'stock_items':
                                return {
                                    ...baseFields,
                                    item_name: item.item_name,
                                    category_id: item.category_id,
                                    variants: typeof item.variants === 'string' ? item.variants : JSON.stringify(item.variants || []),
                                    total_quantity: item.total_quantity || 0,
                                    total_bags: item.total_bags || 0,
                                    total_value: item.total_value || 0
                                }
                            case 'categories':
                                return { ...baseFields, name: item.name }
                            default:
                                return baseFields
                        }
                    }),
                    deleted: [], // TODO: Implement soft delete syncing
                })

                return {
                    changes: {
                        partners: processChanges(partners, 'partners'),
                        roles: processChanges(roles, 'roles'),
                        purchases: processChanges(purchases, 'purchases'),
                        stock_items: processChanges(stockItems, 'stock_items'),
                        categories: processChanges(categories, 'categories'),
                    },
                    timestamp: Date.now(),
                }
            },
            pushChanges: async ({ changes, lastPulledAt }) => {
                console.log('📤 Pushing changes to Supabase...', changes)

                const pushTableChanges = async (table: string, tableChanges: any) => {
                    const { created, updated, deleted } = tableChanges

                    // 1. Handle Created
                    if (created.length > 0) {
                        const { error } = await supabase.from(table).insert(
                            created.map((item: any) => ({
                                id: item.id,
                                ...mapToSupabase(item, table),
                            }))
                        )
                        if (error) throw error
                    }

                    // 2. Handle Updated
                    if (updated.length > 0) {
                        for (const item of updated) {
                            const { error } = await supabase
                                .from(table)
                                .update(mapToSupabase(item, table))
                                .eq('id', item.id)
                            if (error) throw error
                        }
                    }

                    // 3. Handle Deleted
                    if (deleted.length > 0) {
                        const { error } = await supabase
                            .from(table)
                            .delete()
                            .in('id', deleted)
                        if (error) throw error
                    }
                }

                await Promise.all([
                    pushTableChanges('partners', (changes as any).partners),
                    pushTableChanges('roles', (changes as any).roles),
                    pushTableChanges('purchases', (changes as any).purchases),
                    pushTableChanges('stock_items', (changes as any).stock_items),
                    pushTableChanges('categories', (changes as any).categories),
                ])
            },
            migrationsEnabledAtVersion: 1,
        })
        console.log('✅ Sync complete')
    } catch (error) {
        console.error('❌ Sync failed:', error)
    }
}

// Helper to map WatermelonDB fields to Supabase columns
const mapToSupabase = (item: any, table: string) => {
    // Get user_id from auth if needed, but usually it should be in the item or handled by RLS
    // For now assuming RLS handles user assignment or it's in the item

    const base = {
        created_at: new Date(item.createdAt).toISOString(),
        updated_at: new Date(item.updatedAt).toISOString(),
    }

    switch (table) {
        case 'partners':
            return {
                ...base,
                name: item.name,
                phone: item.phone,
                address: item.address,
                role: item.role,
            }
        case 'roles':
            return {
                ...base,
                name: item.name,
                icon: item.icon,
                color: item.color,
            }
        case 'purchases':
            return {
                ...base,
                partner_id: item.partner_id,
                crop_name: item.crop_name,
                quantity: item.quantity,
                rate: item.rate,
                total_amount: item.total_amount,
                purchase_date: item.purchase_date,
            }
        case 'stock_items':
            return {
                ...base,
                item_name: item.itemName,
                category_id: item.categoryId,
                variants: typeof item.variants === 'string' ? JSON.parse(item.variants) : item.variants,
                total_quantity: item.totalQuantity,
                total_bags: item.totalBags,
                total_value: item.totalValue,
            }
        case 'categories':
            return {
                ...base,
                name: item.name,
            }
        default:
            return base
    }
}

const mapFromSupabase = (item: any, table: string) => {
    return {
        createdAt: new Date(item.created_at).getTime(),
        updatedAt: new Date(item.updated_at).getTime(),
    }
}

// Auto-sync functions
let autoSyncInterval: ReturnType<typeof setInterval> | null = null

export const startAutoSync = (intervalMs: number = 60000) => {
    if (autoSyncInterval) return
    console.log(`⏱️ Starting auto-sync every ${intervalMs}ms`)
    autoSyncInterval = setInterval(() => {
        sync().catch(err => console.error('❌ Auto-sync error:', err))
    }, intervalMs)
}

export const stopAutoSync = () => {
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval)
        autoSyncInterval = null
        console.log('⏹️ Auto-sync stopped')
    }
}

export const watermelonSyncService = {
    fullSync: sync,
    syncFromSupabase: sync, // Alias for compatibility
    syncToSupabase: async () => { console.log('ℹ️ Sync to Supabase is handled by fullSync') },
}

export default watermelonSyncService
