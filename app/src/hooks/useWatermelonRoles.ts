import { useEffect, useState, useCallback } from 'react'
import { database } from '../database'
import { supabase } from '../config/supabase'
import NetInfo from '@react-native-community/netinfo'

export interface WatermelonRole {
    id: string
    name: string
    icon?: string
    color?: string
    createdAt?: number
    updatedAt?: number
}

// Simple UUID generator
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

/**
 * ✅ WATERMELON ROLES HOOK
 * - Loads roles from WatermelonDB (instant)
 * - Create/Edit/Delete locally first
 * - Background sync to Supabase
 * - Offline support
 */
export const useWatermelonRoles = () => {
    const [roles, setRoles] = useState<WatermelonRole[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // ✅ Reactive Subscription to WatermelonDB
    useEffect(() => {
        const rolesCollection = database.get('roles')
        const query = rolesCollection.query()

        // Subscribe to changes
        const subscription = query.observe().subscribe(data => {
            // console.log('🔄 Roles updated from WatermelonDB:', data.length)
            setRoles(data as unknown as WatermelonRole[])
            setIsLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    // Create role locally (instant)
    const createRole = useCallback(async (roleData: Omit<WatermelonRole, 'id'>) => {
        try {
            console.log('➕ Creating role locally:', roleData.name)

            const roleId = generateUUID()
            const rolesTable = database.get('roles')
            let newRole: any

            await database.write(async () => {
                newRole = await rolesTable.create((record: any) => {
                    record._raw.id = roleId
                    record.name = roleData.name
                    record.icon = roleData.icon || 'person-outline'
                    record.color = roleData.color || '#6b7280'
                    record.createdAt = Date.now()
                    record.updatedAt = Date.now()
                })
            })

            console.log('✅ Role created locally:', newRole.id)

            // Sync to Supabase in background (if online)
            const state = await NetInfo.fetch()
            if (state.isConnected && state.isInternetReachable) {
                console.log('📤 Syncing role to Supabase...')
                syncRoleToSupabase(newRole)
            } else {
                console.log('📴 Offline - role will sync when online')
            }

            return newRole
        } catch (error) {
            console.error('❌ Error creating role:', error)
            throw error
        }
    }, [])

    // Update role locally (instant)
    const updateRole = useCallback(async (roleId: string, updates: Partial<WatermelonRole>) => {
        try {
            console.log('✏️ Updating role locally:', roleId)

            const rolesTable = database.get('roles')
            const role = await rolesTable.find(roleId)

            await database.write(async () => {
                await role.update((record: any) => {
                    if (updates.name) record.name = updates.name
                    if (updates.icon !== undefined) record.icon = updates.icon
                    if (updates.color !== undefined) record.color = updates.color
                    record.updatedAt = Date.now()
                })
            })

            console.log('✅ Role updated locally')

            // Sync to Supabase in background
            const state = await NetInfo.fetch()
            if (state.isConnected && state.isInternetReachable) {
                console.log('📤 Syncing role update to Supabase...')
                syncRoleToSupabase(role)
            }

            return role
        } catch (error) {
            console.error('❌ Error updating role:', error)
            throw error
        }
    }, [])

    // Delete role locally (instant)
    const deleteRole = useCallback(async (roleId: string) => {
        try {
            console.log('🗑️ Deleting role locally:', roleId)

            const rolesTable = database.get('roles')
            const role = await rolesTable.find(roleId)

            await database.write(async () => {
                await role.destroyPermanently()
            })

            console.log('✅ Role deleted locally')

            // Sync deletion to Supabase in background
            const state = await NetInfo.fetch()
            if (state.isConnected && state.isInternetReachable) {
                console.log('📤 Syncing role deletion to Supabase...')
                const { error } = await supabase
                    .from('roles')
                    .delete()
                    .eq('id', roleId)

                if (error) {
                    console.error('❌ Error deleting from Supabase:', error)
                } else {
                    console.log('✅ Role deleted from Supabase')
                }
            }
        } catch (error) {
            console.error('❌ Error deleting role:', error)
            throw error
        }
    }, [])

    return {
        roles,
        isLoading,
        createRole,
        updateRole,
        deleteRole,
        reloadRoles: async () => { } // No-op
    }
}

// Helper function to sync role to Supabase
async function syncRoleToSupabase(role: any) {
    try {
        // Get current user from Supabase auth
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            console.log('❌ No user logged in - skipping sync')
            return
        }

        const { error } = await supabase
            .from('roles')
            .upsert({
                id: role.id,
                user_id: user.id,
                name: role.name,
                created_at: new Date(role.createdAt).toISOString(),
                updated_at: new Date(role.updatedAt).toISOString()
            })

        if (error) {
            console.error('❌ Error syncing role to Supabase:', error)
        } else {
            console.log('✅ Role synced to Supabase:', role.id)
        }
    } catch (error) {
        console.error('❌ Sync error:', error)
    }
}
